import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Payment from "@/models/Payment";
import Reservation from "@/models/Reservation";
import { getUser } from "@/lib/helpers";

export async function GET(request) {
    try {
        await connectDB();

        // بررسی دسترسی ادمین
        const user = await getUser();
        if (!user || !user.isAdmin) {
            return NextResponse.json(
                { success: false, message: "دسترسی غیرمجاز" },
                { status: 403 }
            );
        }

        // تمام پرداخت‌ها
        const allPayments = await Payment.find({}).populate("user", "fullName email").lean();

        // پرداخت‌های موفق
        const successfulPayments = await Payment.find({ status: "paid" })
            .populate("user", "fullName email")
            .lean();

        // رزروهای موجود
        const allReservations = await Reservation.find({})
            .populate("user", "fullName email")
            .lean();

        // پرداخت‌های موفق که رزرو ندارند
        const paymentsWithoutReservation = [];
        for (const payment of successfulPayments) {
            const hasReservation = await Reservation.findOne({ payment: payment._id });
            if (!hasReservation) {
                paymentsWithoutReservation.push({
                    _id: payment._id,
                    amount: payment.amount,
                    user: payment.user?.fullName || "نامشخص",
                    propertyId: payment.propertyId,
                    itemId: payment.itemId,
                    busId: payment.busId,
                    foodId: payment.foodId,
                    checkInDate: payment.checkInDate,
                    checkOutDate: payment.checkOutDate,
                    busDate: payment.busDate,
                    foodDates: payment.foodDates,
                    authority: payment.authority,
                    trackingCode: payment.trackingCode,
                    createdAt: payment.createdAt,
                });
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                totalPayments: allPayments.length,
                successfulPayments: successfulPayments.length,
                totalReservations: allReservations.length,
                paymentsWithoutReservation: paymentsWithoutReservation.length,
                paymentsWithoutReservationDetails: paymentsWithoutReservation,
                allPaymentsDetails: allPayments.map((p) => ({
                    _id: p._id,
                    status: p.status,
                    amount: p.amount,
                    user: p.user?.fullName || "نامشخص",
                    propertyId: p.propertyId,
                    busId: p.busId,
                    foodId: p.foodId,
                    createdAt: p.createdAt,
                })),
                allReservationsDetails: allReservations.map((r) => ({
                    _id: r._id,
                    user: r.user?.fullName || "نامشخص",
                    itemType: r.itemType,
                    itemId: r.itemId,
                    amount: r.amount,
                    status: r.status,
                    payment: r.payment,
                    createdAt: r.createdAt,
                })),
            },
        });
    } catch (error) {
        console.error("❌ خطا در بررسی پرداخت‌ها:", error);
        return NextResponse.json(
            { success: false, message: "خطا در بررسی پرداخت‌ها", error: error.message },
            { status: 500 }
        );
    }
}
