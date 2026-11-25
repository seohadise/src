import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Payment from "@/models/Payment";
import Bus from "@/models/Bus";
import { getUser } from "@/lib/helpers";

export async function POST(request) {
    try {
        await connectDB();
        const user = await getUser();
        if (!user) {
            return NextResponse.json(
                { success: false, message: "لطفا وارد شوید" },
                { status: 401 }
            );
        }

        const { busId, date, description = "پرداخت رزرو اتوبوس" } = await request.json();

        if (!busId) {
            return NextResponse.json(
                { success: false, message: "شناسه اتوبوس الزامی است." },
                { status: 400 }
            );
        }

        // دریافت اطلاعات اتوبوس
        const bus = await Bus.findById(busId).populate("owner");
        if (!bus) {
            return NextResponse.json(
                { success: false, message: "اتوبوس مورد نظر یافت نشد." },
                { status: 404 }
            );
        }

        // بررسی اینکه آیا کاربر مالک این اتوبوس است
        if (bus.owner && bus.owner._id.toString() === user._id.toString()) {
            return NextResponse.json(
                { success: false, message: "شما نمی‌توانید اتوبوس خودتان را رزرو کنید." },
                { status: 403 }
            );
        }

        // بررسی تاریخ‌های در دسترس
        if (bus.availableDates && bus.availableDates.length > 0) {
            // اگر availableDates دارد، فقط آن تاریخ‌ها مجاز هستند
            const availableDate = bus.availableDates.find(
                (d) => new Date(d.date).toDateString() === new Date(date).toDateString()
            );

            if (!availableDate) {
                return NextResponse.json(
                    { success: false, message: "تاریخ انتخابی برای رزرو در دسترس نیست." },
                    { status: 400 }
                );
            }

            if (availableDate.isReserved) {
                return NextResponse.json(
                    { success: false, message: "این تاریخ قبلاً رزرو شده است." },
                    { status: 400 }
                );
            }
        } else {
            // اگر availableDates خالی است، فقط تاریخ اصلی اتوبوس مجاز است
            if (!bus.date) {
                return NextResponse.json(
                    { success: false, message: "هیچ تاریخی برای این اتوبوس در دسترس نیست." },
                    { status: 400 }
                );
            }

            const busMainDate = new Date(bus.date);
            const requestedDate = new Date(date);

            if (busMainDate.toDateString() !== requestedDate.toDateString()) {
                return NextResponse.json(
                    { success: false, message: "تاریخ انتخابی برای رزرو در دسترس نیست." },
                    { status: 400 }
                );
            }

            if (bus.isReserved) {
                return NextResponse.json(
                    { success: false, message: "این تاریخ قبلاً رزرو شده است." },
                    { status: 400 }
                );
            }
        }

        // بررسی تاریخ اتوبوس - استفاده از تاریخ ارسالی یا تاریخ اتوبوس
        const reservationDate = date ? new Date(date) : new Date(bus.date);
        const busDate = new Date(bus.date);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (busDate < now) {
            return NextResponse.json(
                { success: false, message: "تاریخ این اتوبوس گذشته است." },
                { status: 400 }
            );
        }

        // محاسبه قیمت پایه (قیمت مالک)
        const basePrice = bus.price;
        if (!basePrice || basePrice < 1000) {
            return NextResponse.json(
                { success: false, message: "قیمت اتوبوس نامعتبر است." },
                { status: 400 }
            );
        }

        // محاسبه قیمت نهایی (شامل کارمزد 6%)
        const commissionRate = 6;
        const commissionAmount = Math.round((basePrice * commissionRate) / 100);
        const finalPrice = basePrice + commissionAmount;

        // مبلغ کل قابل پرداخت (قیمت پایه + کارمزد)
        const totalAmount = finalPrice;
        const taxRate = 0;
        const taxAmount = 0;

        if (totalAmount < 1000) {
            return NextResponse.json(
                { success: false, message: "مبلغ قابل پرداخت کمتر از حد مجاز است." },
                { status: 400 }
            );
        }

        const zarinpalRequest = {
            merchant_id: process.env.ZARINPAL_MERCHANT_ID || "aaaaaaaaaa",
            amount: totalAmount * 10, // تبدیل تومان به ریال
            description: `رزرو اتوبوس ${
                bus.title
            } - قیمت: ${basePrice.toLocaleString()} تومان + کارمزد: ${commissionAmount.toLocaleString()} تومان`,
            callback_url: `${process.env.BASE_URL}/api/bus-payment/verify`,
            metadata: {
                email: user.email,
                mobile: user.number,
                busId: busId,
                basePrice: basePrice,
                finalPrice: finalPrice,
                commissionAmount: commissionAmount,
                taxAmount: taxAmount,
                taxRate: taxRate,
                date: date,
            },
        };

        const zarinpalResponse = await fetch(
            "https://api.zarinpal.com/pg/v4/payment/request.json",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(zarinpalRequest),
            }
        );

        const zarinpalData = await zarinpalResponse.json();

        if (zarinpalData.data && zarinpalData.data.code === 100) {
            const payment = await Payment.create({
                user: user._id,
                targetUser: bus.owner._id, // اضافه کردن targetUser
                authority: zarinpalData.data.authority,
                amount: totalAmount,
                status: "pending",
                // اطلاعات اضافی برای رزرو
                itemType: "bus",
                busId: busId,
                itemId: busId,
                basePrice: basePrice,
                finalPrice: finalPrice,
                commissionAmount: commissionAmount,
                taxAmount: taxAmount,
                taxRate: taxRate,
                commissionRate: commissionRate,
                busDate: reservationDate,
                date: reservationDate,
            });
            return NextResponse.json({
                success: true,
                data: {
                    authority: zarinpalData.data.authority,
                    paymentUrl: `https://www.zarinpal.com/pg/StartPay/${zarinpalData.data.authority}`,
                    paymentId: payment._id,
                },
                message: "درخواست پرداخت با موفقیت ایجاد شد",
            });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    message: "خطا در ایجاد درخواست پرداخت. پاسخ زرین‌پال ناموفق بود.",
                    error: zarinpalData.errors || { code: -1, message: "پاسخ نامشخص" },
                },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error("Bus payment creation error:", error);
        return NextResponse.json(
            { success: false, message: "خطای داخلی سرور", error: error.message },
            { status: 500 }
        );
    }
}
