import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import WithdrawalRequest from "@/models/WithdrawalRequest";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
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

        const filter = {};
        if (status) {
            filter.status = status;
        }

        const skip = (page - 1) * limit;

        const withdrawals = await WithdrawalRequest.find(filter)
            .populate("user", "fullName email number type")
            .populate("processedBy", "fullName email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalWithdrawals = await WithdrawalRequest.countDocuments(filter);

        // آمار کلی
        const stats = await WithdrawalRequest.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$amount" },
                },
            },
        ]);

        return NextResponse.json({
            success: true,
            data: {
                withdrawals,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalWithdrawals / limit),
                    totalItems: totalWithdrawals,
                    itemsPerPage: limit,
                },
                stats,
            },
            message: "درخواست‌های برداشت با موفقیت دریافت شد",
        });
    } catch (error) {
        console.error("خطا در دریافت درخواست‌های برداشت:", error);
        return NextResponse.json(
            {
                success: false,
                message: "خطا در دریافت درخواست‌های برداشت",
                error: process.env.NODE_ENV === "development" ? error.message : "خطای داخلی سرور",
            },
            { status: 500 }
        );
    }
}

// API برای بروزرسانی وضعیت درخواست برداشت
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

        const { withdrawalId, status, adminNotes, trackingCode } = await request.json();

        if (!withdrawalId || !status) {
            return NextResponse.json(
                { success: false, message: "شناسه درخواست و وضعیت الزامی است" },
                { status: 400 }
            );
        }

        if (!["pending", "approved", "rejected", "completed"].includes(status)) {
            return NextResponse.json(
                { success: false, message: "وضعیت نامعتبر است" },
                { status: 400 }
            );
        }

        const withdrawal = await WithdrawalRequest.findById(withdrawalId).populate("user");
        if (!withdrawal) {
            return NextResponse.json(
                { success: false, message: "درخواست برداشت مورد نظر یافت نشد" },
                { status: 404 }
            );
        }

        // جلوگیری از تغییر وضعیت درخواست‌های تکمیل شده یا رد شده قبلی
        if (withdrawal.status === "completed" || withdrawal.status === "rejected") {
            return NextResponse.json(
                { success: false, message: "این درخواست قبلاً پردازش شده است" },
                { status: 400 }
            );
        }

        // بروزرسانی وضعیت
        withdrawal.status = status;
        withdrawal.processedBy = user._id;
        withdrawal.processedAt = new Date();

        if (adminNotes) {
            withdrawal.adminNotes = adminNotes;
        }

        if (trackingCode) {
            withdrawal.trackingCode = trackingCode;
        }

        await withdrawal.save();

        // مبلغ هنگام ثبت درخواست از کیف پول کسر شده است.
        // بنابراین در این مرحله بسته به وضعیت تنها تراکنش مرتبط را به‌روزرسانی می‌کنیم
        // و در صورت رد، مبلغ را به کیف پول کاربر بازمی‌گردانیم.

        try {
            if (status === "rejected" && withdrawal.user) {
                // بازگشت مبلغ به کیف پول کاربر
                await User.findByIdAndUpdate(withdrawal.user._id, {
                    $inc: { "wallet.balance": withdrawal.amount },
                });

                // علامت‌گذاری تراکنش‌های pending مرتبط به عنوان failed
                await Transaction.updateMany(
                    {
                        relatedModel: "WithdrawalRequest",
                        relatedId: withdrawal._id,
                        status: "pending",
                    },
                    { $set: { status: "failed" } }
                );

                // ثبت تراکنش بازگشت وجه (refund) برای شفافیت
                await Transaction.create({
                    user: withdrawal.user._id,
                    amount: withdrawal.amount,
                    type: "refund",
                    description: `بازگشت مبلغ درخواست برداشت رد شده${
                        adminNotes ? ` - ${adminNotes}` : ""
                    }`,
                    status: "completed",
                    relatedModel: "WithdrawalRequest",
                    relatedId: withdrawal._id,
                });
            } else if (status === "completed" || status === "approved") {
                // تایید نهایی واریز توسط ادمین → تراکنش از pending به completed
                await Transaction.updateMany(
                    {
                        relatedModel: "WithdrawalRequest",
                        relatedId: withdrawal._id,
                        status: "pending",
                    },
                    {
                        $set: {
                            status: "completed",
                            description: `برداشت وجه${
                                trackingCode ? ` - کد پیگیری: ${trackingCode}` : ""
                            }`,
                        },
                    }
                );
            }
        } catch (walletError) {
            console.error("Error updating wallet/transaction:", walletError);
            return NextResponse.json(
                { success: false, message: "خطا در بروزرسانی کیف پول/تراکنش" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `درخواست برداشت با موفقیت ${
                status === "approved"
                    ? "تایید"
                    : status === "rejected"
                    ? "رد"
                    : status === "completed"
                    ? "تکمیل"
                    : "بروزرسانی"
            } شد`,
            data: withdrawal,
        });
    } catch (error) {
        console.error("خطا در بروزرسانی درخواست برداشت:", error);
        return NextResponse.json(
            {
                success: false,
                message: "خطا در بروزرسانی درخواست برداشت",
                error: process.env.NODE_ENV === "development" ? error.message : "خطای داخلی سرور",
            },
            { status: 500 }
        );
    }
}
