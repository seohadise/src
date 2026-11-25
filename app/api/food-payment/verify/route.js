import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Payment from "@/models/Payment";
import Food from "@/models/Food";
import Reservation from "@/models/Reservation";
import Transaction from "@/models/Transaction";
import Commission from "@/models/Commission";
import User from "@/models/User";
import { sendAllReservationNotifications } from "@/lib/sms-service";

export async function GET(request) {
    let payment = null;
    try {
        await connectDB();

        // دریافت پارامترهای URL
        const { searchParams } = new URL(request.url);
        const authority = searchParams.get("Authority");
        const status = searchParams.get("Status");

        if (!authority || status !== "OK") {
            return NextResponse.redirect(
                `${process.env.BASE_URL}/payment/failed?message=پرداخت ناموفق یا لغو شده است`
            );
        }

        // یافتن رکورد پرداخت بر اساس کد پیگیری
        payment = await Payment.findOne({ authority });
        if (!payment) {
            return NextResponse.redirect(
                `${process.env.BASE_URL}/payment/failed?message=رکورد پرداخت یافت نشد`
            );
        }

        // اگر پرداخت قبلاً تأیید شده باشد
        if (payment.status === "success") {
            return NextResponse.redirect(
                `${process.env.BASE_URL}/payment/success?paymentId=${payment._id}`
            );
        }

        // بررسی وضعیت پرداخت با زرین‌پال
        const verifyRequest = {
            merchant_id: process.env.ZARINPAL_MERCHANT_ID || "aaaaaaaaaa",
            authority: authority,
            amount: payment.amount * 10, // تبدیل تومان به ریال
        };

        const verifyResponse = await fetch("https://api.zarinpal.com/pg/v4/payment/verify.json", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(verifyRequest),
        });

        const verifyData = await verifyResponse.json();

        // اگر پرداخت موفق باشد
        if (verifyData.data && verifyData.data.code === 100) {
            // به‌روزرسانی وضعیت پرداخت
            payment.status = "success";
            payment.refId = verifyData.data.ref_id;
            payment.trackingCode = verifyData.data.ref_id; // اضافه کردن trackingCode
            payment.cardPan = verifyData.data.card_pan;
            payment.cardHash = verifyData.data.card_hash;
            await payment.save();

            // یافتن غذا
            const food = await Food.findById(payment.itemId).populate("owner");
            if (!food) {
                // پرداخت موفق بوده اما غذا یافت نشد - باید به صفحه موفق برود اما با پیام خطا
                return NextResponse.redirect(
                    `${process.env.BASE_URL}/payment/success?paymentId=${payment._id}&ref_id=${payment.refId}&amount=${payment.amount}&warning=غذای مورد نظر یافت نشد`
                );
            }

            let reservation;
            try {
                reservation = await Reservation.create({
                    user: payment.user,
                    targetUser: food.owner._id,
                    itemId: payment.itemId,
                    itemType: "food",
                    itemModel: "Food",
                    payment: payment._id,
                    status: "pending", // در انتظار تایید مالک
                    dates: payment.dates || payment.foodDates,
                    quantity: payment.quantity || 1,
                    amount: payment.amount,
                    basePrice: payment.basePrice,
                    commissionAmount: payment.commissionAmount,
                    contactInfo: {
                        name: food.owner?.fullName || food.owner?.name || "",
                        phone: food.owner?.number || food.owner?.phone || "",
                        email: food.owner?.email || "",
                    },
                });
            } catch (reservationError) {
                console.error("خطا در ثبت رزرو غذا:", reservationError);
                return NextResponse.redirect(
                    `${process.env.BASE_URL}/payment/success?paymentId=${payment._id}&ref_id=${payment.refId}&amount=${payment.amount}&warning=پرداخت موفق بود اما در ثبت سفارش مشکلی پیش آمد`
                );
            }

            // تاریخ‌ها فقط زمانی بلاک می‌شوند که رزرو تایید شود
            // این کار در API تغییر وضعیت رزرو انجام می‌شود

            try {
                // ایجاد کارمزد با وضعیت pending - پول پس از تایید رزرو به مالک می‌رسد
                await Commission.create({
                    user: food.owner._id,
                    targetUser: payment.user,
                    reservation: reservation._id,
                    payment: payment._id,
                    itemType: "food",
                    itemId: payment.itemId,
                    baseAmount: payment.basePrice || payment.amount,
                    commissionAmount: payment.commissionAmount || 0,
                    commissionRate: payment.commissionRate || 6,
                    depositRate: 100, // برای غذا کل مبلغ پرداخت می‌شود
                    depositAmount: payment.amount || 0,
                    totalPaidAmount: payment.amount || 0,
                    remainingAmount: 0, // برای غذا مبلغ باقی‌مانده صفر است
                    status: "pending", // در انتظار تایید رزرو - پس از تایید به collected تغییر می‌کند
                });

                // ذخیره اطلاعات مالی در رزرو برای واریز بعدی (پس از تایید مالک)
                // ownerAmount = قیمت پایه (بدون کارمزد و مالیات)
                // adminAmount = کارمزد + مالیات
                const foodOwnerAmount = payment.depositAmount || payment.basePrice || 0;
                const foodAdminAmount = (payment.commissionAmount || 0) + (payment.taxAmount || 0);

                reservation.financialDetails = {
                    basePrice: payment.basePrice || 0,
                    depositAmount: payment.depositAmount || 0,
                    taxAmount: payment.taxAmount || 0,
                    commissionAmount: payment.commissionAmount || 0,
                    adminAmount: foodAdminAmount,
                    ownerAmount: foodOwnerAmount,
                    totalPaid: payment.amount
                };
                await reservation.save();

                console.log("اطلاعات مالی رزرو غذا ذخیره شد - واریز پس از تایید مالک انجام می‌شود:", {
                    ownerAmount: foodOwnerAmount,
                    adminAmount: foodAdminAmount,
                });
            } catch (postProcessError) {
                console.error("خطا در پردازش مالی رزرو غذا:", postProcessError);
            }

            // Send SMS notifications for food reservation
            try {
                const userInfo = await User.findById(payment.user);
                await sendAllReservationNotifications({
                    userPhone: userInfo?.number,
                    userName: userInfo?.fullName || userInfo?.name || "کاربر",
                    ownerPhone: food.owner?.number,
                    ownerName: food.owner?.fullName || food.owner?.name || "مالک",
                    itemType: "food",
                    itemName: food.foods?.[0] || food.staff?.chef?.name || "غذا",
                });
            } catch (smsError) {
                console.error("Error sending SMS notifications for food:", smsError);
            }

            return NextResponse.redirect(
                `${process.env.BASE_URL}/payment/success?paymentId=${payment._id}&ref_id=${payment.refId}&amount=${payment.amount}`
            );
        } else {
            // به‌روزرسانی وضعیت پرداخت به ناموفق
            payment.status = "failed";
            payment.errorCode = verifyData.errors?.code || -1;
            payment.errorMessage = verifyData.errors?.message || "خطای نامشخص";
            await payment.save();

            return NextResponse.redirect(
                `${process.env.BASE_URL}/payment/failed?message=تأیید پرداخت ناموفق بود`
            );
        }
    } catch (error) {
        console.error("خطا در تأیید پرداخت غذا:", error);
        // اگر پرداخت قبلاً موفق شده بود، به صفحه موفق برود
        if (payment && payment.status === "success") {
            return NextResponse.redirect(
                `${process.env.BASE_URL}/payment/success?paymentId=${payment._id}&ref_id=${payment.refId}&amount=${payment.amount}&warning=خطای داخلی سرور`
            );
        }
        return NextResponse.redirect(
            `${process.env.BASE_URL}/payment/failed?message=خطای داخلی سرور: ${error.message}`
        );
    }
}
