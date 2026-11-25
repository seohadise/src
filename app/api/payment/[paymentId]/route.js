import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Payment from "@/models/Payment";
import { getUser } from "@/lib/helpers";

export async function GET(request, { params }) {
    try {
        await connectDB();

        const { paymentId } = await params;
        
        // دریافت کاربر جاری
        const user = await getUser();
        if (!user) {
            return NextResponse.json(
                { success: false, message: "لطفا وارد حساب کاربری خود شوید" },
                { status: 401 }
            );
        }

        // دریافت پرداخت با شناسه
        const payment = await Payment.findById(paymentId).lean();

        if (!payment) {
            return NextResponse.json(
                { success: false, message: "پرداخت مورد نظر یافت نشد" },
                { status: 404 }
            );
        }

        // بررسی اینکه آیا کاربر مالک این پرداخت است
        if (payment.user.toString() !== user._id.toString()) {
            return NextResponse.json(
                { success: false, message: "شما مجاز به مشاهده این پرداخت نیستید" },
                { status: 403 }
            );
        }

        // تبدیل ObjectId به string برای JSON serialization
        const safePayment = {
            ...payment,
            _id: payment._id.toString(),
            user: payment.user?.toString(),
            itemId: payment.itemId?.toString() || null,
            targetUser: payment.targetUser?.toString() || null,
        };

        return NextResponse.json({
            success: true,
            data: safePayment,
        });
    } catch (error) {
        console.error("API Payment Error:", error);
        return NextResponse.json(
            { success: false, message: "خطا در دریافت اطلاعات پرداخت" },
            { status: 500 }
        );
    }
}
