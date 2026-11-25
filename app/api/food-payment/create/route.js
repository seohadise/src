import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Payment from "@/models/Payment";
import Food from "@/models/Food";
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

        const {
            foodId,
            dates = [],
            quantity = 1,
            description = "پرداخت سفارش غذا",
        } = await request.json();

        if (!foodId) {
            return NextResponse.json(
                { success: false, message: "شناسه غذا الزامی است." },
                { status: 400 }
            );
        }

        // دریافت اطلاعات غذا
        const food = await Food.findById(foodId).populate("owner");
        if (!food) {
            return NextResponse.json(
                { success: false, message: "غذای مورد نظر یافت نشد." },
                { status: 404 }
            );
        }

        // بررسی اینکه آیا کاربر مالک این غذا است
        if (food.owner && food.owner._id.toString() === user._id.toString()) {
            return NextResponse.json(
                { success: false, message: "شما نمی‌توانید غذای خودتان را سفارش دهید." },
                { status: 403 }
            );
        }

        // بررسی تاریخ‌های انتخابی
        if (food.availableDates && food.availableDates.length > 0 && dates.length === 0) {
            return NextResponse.json(
                { success: false, message: "لطفا حداقل یک تاریخ برای سفارش انتخاب کنید." },
                { status: 400 }
            );
        }

        // محاسبه قیمت پایه (قیمت مالک)
        const unitPrice = food.pricing?.basePrice || food.price || 0;
        const basePrice = unitPrice * quantity * (dates.length || 1);

        if (!unitPrice || unitPrice < 1000) {
            return NextResponse.json(
                {
                    success: false,
                    message: "قیمت غذا نامعتبر است. قیمت باید حداقل 1000 تومان باشد.",
                },
                { status: 400 }
            );
        }

        if (!basePrice || basePrice < 1000) {
            return NextResponse.json(
                { success: false, message: "مبلغ کل سفارش نامعتبر است." },
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
            description: `سفارش ${
                food.title
            } - قیمت: ${basePrice.toLocaleString()} تومان + مالیات: ${taxAmount.toLocaleString()} تومان`,
            callback_url: `${process.env.BASE_URL}/api/food-payment/verify`,
            metadata: {
                email: user.email,
                mobile: user.number,
                foodId: foodId,
                basePrice: basePrice,
                finalPrice: finalPrice,
                commissionAmount: commissionAmount,
                taxAmount: taxAmount,
                taxRate: taxRate,
                dates: dates,
                quantity: quantity,
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
                targetUser: food.owner._id, // اضافه کردن targetUser
                authority: zarinpalData.data.authority,
                amount: totalAmount,
                status: "pending",
                // اطلاعات اضافی برای سفارش
                itemType: "food",
                foodId: foodId,
                itemId: foodId,
                basePrice: basePrice,
                finalPrice: finalPrice,
                commissionAmount: commissionAmount,
                taxAmount: taxAmount,
                taxRate: taxRate,
                commissionRate: commissionRate,
                foodDates: dates,
                dates: dates,
                quantity: quantity,
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
        console.error("Food payment creation error:", error);
        return NextResponse.json(
            { success: false, message: "خطای داخلی سرور", error: error.message },
            { status: 500 }
        );
    }
}
