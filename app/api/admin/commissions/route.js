import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Commission from "@/models/Commission";
import { getUser } from "@/lib/helpers";

export async function GET(request) {
    try {
        await connectDB();

        const user = await getUser();
        if (!user || !user.isAdmin) {
            return NextResponse.json(
                { success: false, message: "دسترسی غیرمجاز" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 20;
        const status = searchParams.get("status");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const propertyId = searchParams.get("propertyId");
        const ownerId = searchParams.get("ownerId");

        // ساخت فیلتر
        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        if (propertyId) {
            filter.property = propertyId;
        }

        if (ownerId) {
            filter.$or = [{ owner: ownerId }, { user: ownerId }];
        }

        // محاسبه skip برای pagination
        const skip = (page - 1) * limit;

        // اگر کارمزدی وجود ندارد، از Payment‌ها محاسبه کن
        const commissionCount = await Commission.countDocuments();
        let commissions = [];

        if (commissionCount === 0) {
            // محاسبه کارمزد از Payment‌ها
            const Payment = (await import("@/models/Payment")).default;
            const Reservation = (await import("@/models/Reservation")).default;

            const paymentFilter = { status: "paid" };
            if (startDate && endDate) {
                paymentFilter.createdAt = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                };
            }

            const payments = await Payment.find(paymentFilter)
                .populate({
                    path: "reservation",
                    populate: [
                        {
                            path: "user",
                            select: "fullName email number",
                        },
                    ],
                })
                .populate("user", "fullName email number")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            commissions = payments.map((payment) => {
                const commissionRate = 0.06; // 6% کارمزد
                const baseAmount = payment.amount || 0;
                const commissionAmount = Math.round(baseAmount * commissionRate);

                return {
                    _id: payment._id,
                    paymentId: payment._id,
                    itemType: payment.reservation?.itemType || "property",
                    itemId: payment.reservation?.itemId || payment.propertyId,
                    user: payment.reservation?.user || payment.user,
                    targetUser: payment.user,
                    customer: payment.user,
                    baseAmount: baseAmount,
                    commissionAmount: commissionAmount,
                    commissionRate: commissionRate * 100,
                    status: "collected",
                    paymentTrackingCode: payment.trackingCode,
                    createdAt: payment.createdAt,
                    updatedAt: payment.updatedAt,
                    reservation: payment.reservation,
                };
            });
        } else {
            // استفاده از Commission‌های موجود
            commissions = await Commission.find(filter)
                .populate({
                    path: "property",
                    select: "name address.city address.province pricing",
                })
                .populate({
                    path: "user",
                    select: "fullName email number",
                })
                .populate({
                    path: "targetUser",
                    select: "fullName email number",
                })
                .populate({
                    path: "owner",
                    select: "fullName email number",
                })
                .populate({
                    path: "customer",
                    select: "fullName email number",
                })
                .populate({
                    path: "reservation",
                    select: "startDate endDate guests status",
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
        }

        // Populate dynamic itemId based on itemType
        for (let commission of commissions) {
            if (commission.itemType && commission.itemId) {
                let populatedItem = null;
                try {
                    if (commission.itemType === "property") {
                        const Property = (await import("@/models/Property")).default;
                        populatedItem = await Property.findById(commission.itemId)
                            .select("name title address.city address.province pricing")
                            .lean();
                    } else if (commission.itemType === "bus") {
                        const Bus = (await import("@/models/Bus")).default;
                        populatedItem = await Bus.findById(commission.itemId)
                            .select(
                                "vehicle.name from.city from.province to.city to.province price"
                            )
                            .lean();
                    } else if (commission.itemType === "food") {
                        const Food = (await import("@/models/Food")).default;
                        populatedItem = await Food.findById(commission.itemId)
                            .select("name address.city address.province pricing staff.chef.name foods")
                            .lean();
                    }

                    if (populatedItem) {
                        commission.item = populatedItem;
                        // Also set property field for backward compatibility
                        if (commission.itemType === "property") {
                            commission.property = populatedItem;
                        }
                    }
                } catch (error) {
                    console.error(`Error populating ${commission.itemType}:`, error);
                }
            }
        }

        // شمارش کل رکوردها
        let totalCommissions;
        let stats;
        let statusStats;

        if (commissionCount === 0) {
            // محاسبه از Payment‌ها
            const Payment = (await import("@/models/Payment")).default;
            const allPayments = await Payment.find({ status: "paid" }).lean();

            totalCommissions = allPayments.length;

            const totalCommissionAmount = allPayments.reduce((sum, payment) => {
                return sum + Math.round((payment.amount || 0) * 0.06);
            }, 0);

            const totalBaseAmount = allPayments.reduce((sum, payment) => {
                return sum + (payment.amount || 0);
            }, 0);

            stats = {
                totalCommissions: totalCommissionAmount,
                totalTransactions: allPayments.length,
                averageCommission:
                    allPayments.length > 0 ? totalCommissionAmount / allPayments.length : 0,
                totalBaseAmount,
            };

            statusStats = [
                {
                    _id: "collected",
                    count: allPayments.length,
                    totalAmount: totalCommissionAmount,
                },
            ];
        } else {
            // استفاده از Commission‌های موجود - فقط status=collected را در آمار لحاظ کن
            totalCommissions = await Commission.countDocuments(filter);
            stats = await Commission.getCommissionStats(startDate, endDate);
            statusStats = await Commission.aggregate([
                { $match: { ...filter, status: "collected" } },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                        totalAmount: { $sum: "$commissionAmount" },
                    },
                },
            ]);
        }

        return NextResponse.json({
            success: true,
            data: {
                commissions,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCommissions / limit),
                    totalItems: totalCommissions,
                    itemsPerPage: limit,
                },
                stats,
                statusStats,
            },
            message: "کارمزدها با موفقیت دریافت شد",
        });
    } catch (error) {
        console.error("خطا در دریافت کارمزدها:", error);
        return NextResponse.json(
            {
                success: false,
                message: "خطا در دریافت کارمزدها",
                error: process.env.NODE_ENV === "development" ? error.message : "خطای داخلی سرور",
            },
            { status: 500 }
        );
    }
}

// API برای بروزرسانی وضعیت کارمزد
export async function PATCH(request) {
    try {
        await connectDB();

        const user = await getUser();
        if (!user || !user.isAdmin) {
            return NextResponse.json(
                { success: false, message: "دسترسی غیرمجاز" },
                { status: 403 }
            );
        }

        const { commissionId, status, notes } = await request.json();

        if (!commissionId || !status) {
            return NextResponse.json(
                { success: false, message: "شناسه کارمزد و وضعیت الزامی است" },
                { status: 400 }
            );
        }

        const commission = await Commission.findById(commissionId);
        if (!commission) {
            return NextResponse.json(
                { success: false, message: "کارمزد مورد نظر یافت نشد" },
                { status: 404 }
            );
        }

        // بروزرسانی وضعیت
        commission.status = status;
        if (notes) {
            commission.notes = notes;
        }

        if (status === "collected" && !commission.collectedAt) {
            commission.collectedAt = new Date();
        }

        await commission.save();

        return NextResponse.json({
            success: true,
            data: commission,
            message: "وضعیت کارمزد با موفقیت بروزرسانی شد",
        });
    } catch (error) {
        console.error("خطا در بروزرسانی کارمزد:", error);
        return NextResponse.json(
            {
                success: false,
                message: "خطا در بروزرسانی کارمزد",
                error: error.message,
            },
            { status: 500 }
        );
    }
}
