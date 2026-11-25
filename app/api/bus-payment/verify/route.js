import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Payment from "@/models/Payment";
import Bus from "@/models/Bus";
import Reservation from "@/models/Reservation";
import Transaction from "@/models/Transaction";
import Commission from "@/models/Commission";
import User from "@/models/User";
import { getUser } from "@/lib/helpers";
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

            try {
                // یافتن اتوبوس با populate کردن owner
                const bus = await Bus.findById(payment.itemId).populate("owner");
                if (!bus) {
                    return NextResponse.redirect(
                        `${process.env.BASE_URL}/payment/success?paymentId=${payment._id}&ref_id=${payment.refId}&amount=${payment.amount}&warning=اتوبوس مورد نظر یافت نشد`
                    );
                }

                // ثبت رزرو در انتظار تایید
                const reservation = await Reservation.create({
                    user: payment.user,
                    targetUser: bus.owner._id,
                    itemId: payment.itemId,
                    itemType: "bus",
                    itemModel: "Bus",
                    payment: payment._id,
                    status: "pending", // در انتظار تایید مالک
                    date: payment.date || payment.busDate,
                    amount: payment.amount,
                    basePrice: payment.basePrice,
                    commissionAmount: payment.commissionAmount,
                    contactInfo: {
                        name: bus.owner?.fullName || bus.owner?.name || "",
                        phone: bus.owner?.number || bus.owner?.phone || "",
                        email: bus.owner?.email || "",
                    },
                });

                // ذخیره اطلاعات مهمان در رزرو برای کاهش ظرفیت بعدی (پس از تایید مالک)
                const reservationDate = payment.date || payment.busDate;
                const guestCount = (payment.guests?.adults || 1) + (payment.guests?.children || 0);
                
                // ذخیره تعداد مهمان در رزرو
                reservation.guests = payment.guests || { adults: 1, children: 0 };
                await reservation.save();
                
                // ظرفیت فقط پس از تایید رزرو توسط مالک کاهش می‌یابد (در API status)
                console.log(`رزرو اتوبوس ثبت شد - ظرفیت پس از تایید مالک کاهش می‌یابد. تعداد مهمان: ${guestCount}`);

                // ایجاد کارمزد با وضعیت pending - پول پس از تایید رزرو به مالک می‌رسد
                const commission = await Commission.create({
                    user: bus.owner._id,
                    targetUser: payment.user,
                    reservation: reservation._id,
                    payment: payment._id,
                    itemType: "bus",
                    itemId: payment.itemId,
                    baseAmount: payment.basePrice || payment.amount,
                    commissionAmount: payment.commissionAmount || 0,
                    commissionRate: payment.commissionRate || 6,
                    depositRate: 100, // برای اتوبوس کل مبلغ پرداخت می‌شود
                    depositAmount: payment.amount || 0,
                    totalPaidAmount: payment.amount || 0,
                    remainingAmount: 0, // برای اتوبوس مبلغ باقی‌مانده صفر است
                    status: "pending", // در انتظار تایید رزرو - پس از تایید به collected تغییر می‌کند
                });

                // ذخیره اطلاعات مالی در رزرو برای واریز بعدی (پس از تایید مالک)
                // ownerAmount = قیمت پایه (بدون کارمزد و مالیات)
                // adminAmount = کارمزد + مالیات
                const busOwnerAmount = payment.depositAmount || payment.basePrice || 0;
                const busAdminAmount = (payment.commissionAmount || 0) + (payment.taxAmount || 0);

                reservation.financialDetails = {
                    basePrice: payment.basePrice || 0,
                    depositAmount: payment.depositAmount || 0,
                    taxAmount: payment.taxAmount || 0,
                    commissionAmount: payment.commissionAmount || 0,
                    adminAmount: busAdminAmount,
                    ownerAmount: busOwnerAmount,
                    totalPaid: payment.amount
                };
                await reservation.save();

                console.log("اطلاعات مالی رزرو اتوبوس ذخیره شد - واریز پس از تایید مالک انجام می‌شود:", {
                    ownerAmount: busOwnerAmount,
                    adminAmount: busAdminAmount,
                });

                // Send SMS notifications for bus reservation
                try {
                    const userInfo = await User.findById(payment.user);
                    await sendAllReservationNotifications({
                        userPhone: userInfo?.number,
                        userName: userInfo?.fullName || userInfo?.name || "کاربر",
                        ownerPhone: bus.owner?.number,
                        ownerName: bus.owner?.fullName || bus.owner?.name || "مالک",
                        itemType: "bus",
                        itemName: bus.vehicle?.name || `${bus.from?.city} - ${bus.to?.city}` || "اتوبوس",
                    });
                } catch (smsError) {
                    console.error("Error sending SMS notifications for bus:", smsError);
                }

                return NextResponse.redirect(
                    `${process.env.BASE_URL}/payment/success?paymentId=${payment._id}&reservationId=${reservation._id}&ref_id=${payment.refId}&amount=${payment.amount}`
                );
            } catch (reservationError) {
                console.error("خطا در ثبت رزرو اتوبوس:", reservationError);
                // پرداخت موفق بوده اما در ثبت رزرو مشکل بوده - باید به صفحه موفق برود اما با پیام خطا
                return NextResponse.redirect(
                    `${process.env.BASE_URL}/payment/success?paymentId=${payment._id}&ref_id=${payment.refId}&amount=${payment.amount}&warning=پرداخت موفق بود اما در ثبت رزرو مشکلی پیش آمد`
                );
            }
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
        console.error("خطا در تأیید پرداخت اتوبوس:", error);
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
