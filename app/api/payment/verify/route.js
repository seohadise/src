import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Payment from "@/models/Payment";
import Commission from "@/models/Commission";
import Reservation from "@/models/Reservation";
import Property from "@/models/Property";
import Bus from "@/models/Bus";
import Food from "@/models/Food";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { blockPropertyDates } from "@/lib/property-utils";
import { sendAllReservationNotifications } from "@/lib/sms-service";

export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const authority = searchParams.get("Authority");
        const status = searchParams.get("Status");

        if (!authority) {
            return NextResponse.redirect(
                `${process.env.BASE_URL}/payment/failed?error=missing_authority`
            );
        }

        // پیدا کردن پرداخت در دیتابیس
        const payment = await Payment.findOne({ authority }).populate("user");

        if (!payment) {
            return NextResponse.redirect(
                `${process.env.BASE_URL}/payment/failed?error=payment_not_found`
            );
        }

        // اگر پرداخت کنسل شده باشد
        if (status !== "OK") {
            payment.status = "failed";
            await payment.save();

            return NextResponse.redirect(
                `${process.env.BASE_URL}/payment/failed?error=payment_cancelled`
            );
        }

        // تایید پرداخت با ZarinPal
        // مبلغ verify باید برابر با مبلغ پرداخت شده از درگاه باشد (نه کل مبلغ)
        const gatewayAmount = payment.remainingAmount || payment.amount;
        const verifyRequest = {
            merchant_id: process.env.ZARINPAL_MERCHANT_ID || "aaaaaaaaaa",
            authority: authority,
            amount: gatewayAmount * 10, // تبدیل تومان به ریال
        };

        const verifyResponse = await fetch("https://api.zarinpal.com/pg/v4/payment/verify.json", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(verifyRequest),
        });

        const verifyData = await verifyResponse.json();

        if (verifyData.data?.code === 100) {
            // پرداخت موفق
            payment.status = "paid";
            payment.trackingCode = verifyData.data.ref_id;
            
            // اگر بخشی از مبلغ از کیف پول پرداخت شده، کسر کنیم
            if (payment.walletUsed && payment.walletUsed > 0) {
                const User = (await import("@/models/User")).default;
                const Transaction = (await import("@/models/Transaction")).default;
                
                await User.findByIdAndUpdate(payment.user, {
                    $inc: { "wallet.balance": -payment.walletUsed }
                });

                // ثبت تراکنش
                const transaction = await Transaction.create({
                    user: payment.user,
                    type: "expense",
                    amount: payment.walletUsed,
                    description: `پرداخت بخشی از ${payment.description} از کیف پول`,
                    relatedId: payment._id,
                    relatedType: "Payment",
                    status: "completed",
                });

                await User.findByIdAndUpdate(payment.user, {
                    $push: { "wallet.transactions": transaction._id }
                });
            }
            
            await payment.save();

            // اگر این پرداخت مربوط به رزرو ملک است
            if (
                (payment.itemId || payment.propertyId) &&
                payment.checkInDate &&
                payment.checkOutDate
            ) {
                try {
                    // دریافت اطلاعات ملک
                    const propertyId = payment.itemId || payment.propertyId;
                    const property = await Property.findById(propertyId).populate("owner");

                    if (property) {
                        // بررسی تنظیمات تقویم یکپارچه
                        let reservationStatus = "pending"; // پیش‌فرض: در انتظار تایید مالک
                        let totalDiscount = 0;
                        let hasInstantBooking = false;
                        
                        const checkIn = new Date(payment.checkInDate);
                        const checkOut = new Date(payment.checkOutDate);
                        
                        // ساخت Map از تنظیمات تقویم برای دسترسی سریع
                        const calendarMap = new Map();
                        if (property.calendarSettings && property.calendarSettings.length > 0) {
                            property.calendarSettings.forEach(setting => {
                                const dateStr = new Date(setting.date).toDateString();
                                calendarMap.set(dateStr, setting);
                            });
                        }
                        
                        // بررسی هر روز رزرو
                        let allDatesHaveInstant = true;
                        let discountSum = 0;
                        let dayCount = 0;
                        let maxMinimumNights = 0;
                        let hasUnavailableDate = false;
                        
                        for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
                            const dateStr = d.toDateString();
                            const settings = calendarMap.get(dateStr);
                            
                            dayCount++;
                            
                            if (settings) {
                                // بررسی در دسترس بودن
                                if (settings.available === false) {
                                    hasUnavailableDate = true;
                                }
                                
                                // بررسی رزرو آنی
                                if (!settings.instantBooking) {
                                    allDatesHaveInstant = false;
                                }
                                
                                // جمع تخفیف‌ها
                                if (settings.lastMinuteDiscount > 0) {
                                    discountSum += settings.lastMinuteDiscount;
                                }
                                
                                // بررسی بلاک بودن
                                if (settings.blocked) {
                                    allDatesHaveInstant = false;
                                }
                                
                                // پیدا کردن حداکثر حداقل شب
                                if (settings.minimumNights && settings.minimumNights > maxMinimumNights) {
                                    maxMinimumNights = settings.minimumNights;
                                }
                            } else {
                                allDatesHaveInstant = false;
                            }
                        }
                        
                        // بررسی روزهای غیرقابل رزرو
                        if (hasUnavailableDate) {
                            // پرداخت موفق بوده ولی تاریخ‌ها غیرقابل رزرو هستند
                            // رزرو را با وضعیت pending ایجاد می‌کنیم تا مالک بررسی کند
                            console.warn("برخی از روزهای انتخابی غیرقابل رزرو هستند - رزرو با وضعیت pending ایجاد می‌شود");
                        }
                        
                        // بررسی حداقل تعداد شب - فقط لاگ می‌کنیم چون پرداخت انجام شده
                        if (maxMinimumNights > 0 && dayCount < maxMinimumNights) {
                            console.warn(`حداقل ${maxMinimumNights} شب برای این تاریخ‌ها الزامی است - رزرو با وضعیت pending ایجاد می‌شود`);
                        }
                        
                        // اگر همه روزها رزرو آنی باشند
                        if (allDatesHaveInstant && dayCount > 0) {
                            reservationStatus = "confirmed";
                            hasInstantBooking = true;
                        }
                        
                        // محاسبه میانگین تخفیف
                        if (dayCount > 0 && discountSum > 0) {
                            totalDiscount = Math.round(discountSum / dayCount);
                            
                            // اگر تخفیف وجود داشته باشد، رزرو آنی می‌شود
                            if (totalDiscount > 0) {
                                reservationStatus = "confirmed";
                            }
                        }
                        
                        // ایجاد رزرو
                        const reservation = await Reservation.create({
                            user: payment.user._id || payment.user,
                            targetUser: property.owner._id,
                            itemType: "property",
                            itemModel: "Property",
                            itemId: propertyId,
                            checkInDate: new Date(payment.checkInDate),
                            checkOutDate: new Date(payment.checkOutDate),
                            guests: payment.guests || { adults: 1, children: 0 },
                            amount: payment.amount,
                            totalPrice: payment.amount,
                            status: reservationStatus,
                            payment: payment._id,
                            contactInfo: {
                                name: property.owner?.fullName || property.owner?.name || "",
                                phone:
                                    property.managerNumber ||
                                    property.owner?.number ||
                                    property.owner?.phone ||
                                    "",
                                email: property.owner?.email || "",
                            },
                        });

                        console.log("رزرو ایجاد شد:", {
                            reservationId: reservation._id,
                            user: reservation.user,
                            targetUser: reservation.targetUser,
                            itemType: reservation.itemType,
                            itemId: reservation.itemId,
                        });

                        // به‌روزرسانی وضعیت رزرو در ملک
                        await Property.findByIdAndUpdate(propertyId, {
                            $push: { reservations: reservation._id },
                        });

                        // ایجاد کارمزد
                        const commission = await Commission.create({
                            reservation: reservation._id,
                            payment: payment._id,
                            user: property.owner._id,
                            targetUser: payment.user._id || payment.user,
                            itemType: "property",
                            itemId: propertyId,
                            baseAmount: payment.basePrice || payment.amount,
                            commissionAmount: payment.commissionAmount || 0,
                            commissionRate: payment.commissionRate || 6,
                            // فیلدهای قدیمی برای سازگاری
                            property: propertyId,
                            owner: property.owner._id,
                            customer: payment.user._id || payment.user,
                            depositRate: payment.depositRate || 10,
                            depositAmount: payment.depositAmount || 0,
                            totalPaidAmount: payment.amount || 0,
                            remainingAmount:
                                (payment.basePrice || payment.amount) -
                                (payment.depositAmount || 0),
                            paymentTrackingCode: verifyData.data.ref_id,
                            // کارمزد تا زمان تایید رزرو توسط مالک به حالت pending می‌ماند
                            status: reservationStatus === "confirmed" ? "collected" : "pending",
                            collectedAt: reservationStatus === "confirmed" ? new Date() : null,
                        });

                        // بلاک کردن تاریخ‌های رزرو شده
                        try {
                            await blockPropertyDates(
                                propertyId,
                                payment.checkInDate,
                                payment.checkOutDate
                            );
                            console.log("تاریخ‌های ملک با موفقیت بلاک شدند");
                        } catch (error) {
                            console.error("خطا در بلاک کردن تاریخ‌های ملک:", error);
                        }

                        // ذخیره اطلاعات مالی در رزرو برای واریز بعدی (پس از تایید مالک)
                        // کارمزد 6% از کل قیمت محاسبه می‌شود و از بیعانه کسر می‌شود
                        // ownerAmount = بیعانه - کارمزد (مثال: 1000 - 600 = 400)
                        // adminAmount = کارمزد + مالیات (مثال: 600 + 100 = 700)
                        const totalCommission = payment.commissionAmount || 0; // 6% از کل قیمت
                        const propertyOwnerAmount = Math.max((payment.depositAmount || 0) - totalCommission, 0);
                        const propertyAdminAmount = totalCommission + (payment.taxAmount || 0);

                        // ذخیره اطلاعات مالی در رزرو
                        reservation.financialDetails = {
                            basePrice: payment.basePrice || 0,
                            totalBasePrice: payment.totalBasePrice || 0,
                            depositAmount: payment.depositAmount || 0,
                            taxAmount: payment.taxAmount || 0,
                            commissionAmount: payment.commissionAmount || 0,
                            adminAmount: propertyAdminAmount,
                            ownerAmount: propertyOwnerAmount,
                            totalPaid: payment.amount,
                            isPaid: reservationStatus === "confirmed",
                        };
                        await reservation.save();

                        // اگر رزرو آنی است، واریز به کیف پول مالک و ادمین
                        if (reservationStatus === "confirmed") {
                            if (propertyOwnerAmount > 0) {
                                await User.findByIdAndUpdate(property.owner._id, {
                                    $inc: { "wallet.balance": propertyOwnerAmount },
                                });
                                const ownerTx = await Transaction.create({
                                    user: property.owner._id,
                                    type: "income",
                                    amount: propertyOwnerAmount,
                                    description: `دریافت درآمد از رزرو آنی ملک ${property.name || ""}`,
                                    relatedId: reservation._id,
                                    relatedType: "Reservation",
                                    status: "completed",
                                });
                                await User.findByIdAndUpdate(property.owner._id, {
                                    $push: { "wallet.transactions": ownerTx._id }
                                });
                            }
                            if (propertyAdminAmount > 0) {
                                const adminUser = await User.findOne({ isAdmin: true });
                                if (adminUser) {
                                    await User.findByIdAndUpdate(adminUser._id, {
                                        $inc: { "wallet.balance": propertyAdminAmount },
                                    });
                                    await Transaction.create({
                                        user: adminUser._id,
                                        type: "income",
                                        amount: propertyAdminAmount,
                                        description: `دریافت کارمزد و مالیات از رزرو آنی ملک ${property.name || ""}`,
                                        relatedId: reservation._id,
                                        relatedType: "Reservation",
                                        status: "completed",
                                    });
                                }
                            }
                            console.log("[payment/verify] واریز رزرو آنی ملک (درگاه):", { ownerAmount: propertyOwnerAmount, adminAmount: propertyAdminAmount });
                        } else {
                            console.log("اطلاعات مالی رزرو ذخیره شد - واریز پس از تایید مالک انجام می‌شود:", {
                                ownerAmount: propertyOwnerAmount,
                                adminAmount: propertyAdminAmount,
                            });
                        }

                        // Send SMS notifications for property reservation
                        try {
                            const userInfo = await User.findById(payment.user._id || payment.user);
                            await sendAllReservationNotifications({
                                userPhone: userInfo?.number || payment.user?.number,
                                userName: userInfo?.fullName || userInfo?.name || "کاربر",
                                ownerPhone: property.owner?.number,
                                ownerName: property.owner?.fullName || property.owner?.name || "مالک",
                                itemType: "property",
                                itemName: property.name || property.address?.city || property.address?.fullAddress || "ملک",
                            });
                        } catch (smsError) {
                            console.error("Error sending SMS notifications for property:", smsError);
                        }
                    }
                } catch (error) {
                    console.error("خطا در ثبت رزرو یا کارمزد:", error);
                    // در صورت خطا، پرداخت را موفق در نظر می‌گیریم اما رزرو را دستی بررسی می‌کنیم
                }
            }

            // اگر این پرداخت مربوط به رزرو اتوبوس است
            if (payment.busId && payment.busDate) {
                try {
                    // دریافت اطلاعات اتوبوس
                    const bus = await Bus.findById(payment.busId).populate("owner");

                    if (bus) {
                        // ایجاد رزرو در انتظار تایید
                        const reservation = await Reservation.create({
                            user: payment.user,
                            targetUser: bus.owner._id,
                            itemType: "bus",
                            itemModel: "Bus",
                            itemId: payment.busId,
                            date: new Date(payment.busDate),
                            guests: payment.guests || { adults: 1, children: 0 },
                            amount: payment.amount,
                            totalPrice: payment.amount,
                            status: "pending", // در انتظار تایید مالک
                            payment: payment._id,
                            contactInfo: {
                                name: bus.owner?.fullName || bus.owner?.name || "",
                                phone: bus.owner?.number || bus.owner?.phone || "",
                                email: bus.owner?.email || "",
                            },
                        });

                        // ایجاد کارمزد
                        const busBaseAmount = payment.basePrice || payment.amount || 0;
                        const commission = await Commission.create({
                            reservation: reservation._id,
                            payment: payment._id,
                            user: bus.owner._id,
                            targetUser: payment.user._id || payment.user,
                            itemType: "bus",
                            itemId: payment.busId,
                            baseAmount: busBaseAmount,
                            commissionAmount: payment.commissionAmount || 0,
                            commissionRate: payment.commissionRate || 6,
                            depositRate: 100, // برای اتوبوس کل مبلغ پرداخت می‌شود
                            depositAmount: busBaseAmount, // 100% قیمت پایه
                            totalPaidAmount: payment.amount || 0,
                            remainingAmount: 0, // برای اتوبوس مبلغ باقی‌مانده صفر است
                            // کارمزد تا زمان تایید رزرو توسط مالک به حالت pending می‌ماند
                            status: "pending",
                            collectedAt: null,
                        });

                        // ذخیره تعداد مهمان در رزرو برای کاهش ظرفیت بعدی (پس از تایید مالک)
                        const busDate = new Date(payment.busDate);
                        const guestCount = (payment.guests?.adults || 1) + (payment.guests?.children || 0);
                        
                        // ظرفیت فقط پس از تایید رزرو توسط مالک کاهش می‌یابد (در API status)
                        console.log(`[payment/verify] رزرو اتوبوس ثبت شد - ظرفیت پس از تایید مالک کاهش می‌یابد. تعداد مهمان: ${guestCount}, تاریخ: ${busDate.toLocaleDateString("fa-IR")}`);

                        // ذخیره اطلاعات مالی در رزرو برای واریز بعدی (پس از تایید مالک)
                        // اتوبوس: کارمزد از مشتری گرفته شده، پس کل قیمت پایه به مالک می‌رسد
                        // adminAmount = کارمزد + مالیات
                        const busTotalCommission = payment.commissionAmount || 0;
                        const busOwnerAmount = payment.depositAmount || payment.basePrice || 0;
                        const busAdminAmount = busTotalCommission + (payment.taxAmount || 0);

                        reservation.financialDetails = {
                            basePrice: payment.basePrice || 0,
                            totalBasePrice: payment.totalBasePrice || payment.basePrice || 0,
                            depositAmount: payment.depositAmount || 0,
                            taxAmount: payment.taxAmount || 0,
                            commissionAmount: payment.commissionAmount || 0,
                            adminAmount: busAdminAmount,
                            ownerAmount: busOwnerAmount,
                            totalPaid: payment.amount
                        };
                        await reservation.save();

                        console.log("رزرو اتوبوس با موفقیت ثبت شد:", {
                            reservationId: reservation._id,
                            commissionId: commission._id,
                            trackingCode: verifyData.data.ref_id,
                            ownerAmount: busOwnerAmount,
                            adminAmount: busAdminAmount,
                        });

                        // Send SMS notifications for bus reservation
                        try {
                            const userInfo = await User.findById(payment.user._id || payment.user);
                            await sendAllReservationNotifications({
                                userPhone: userInfo?.number || payment.user?.number,
                                userName: userInfo?.fullName || userInfo?.name || "کاربر",
                                ownerPhone: bus.owner?.number,
                                ownerName: bus.owner?.fullName || bus.owner?.name || "مالک",
                                itemType: "bus",
                                itemName: bus.vehicle?.name || `${bus.from?.city} - ${bus.to?.city}` || "اتوبوس",
                            });
                        } catch (smsError) {
                            console.error("Error sending SMS notifications for bus:", smsError);
                        }
                    }
                } catch (error) {
                    console.error("خطا در ثبت رزرو اتوبوس:", error);
                }
            }

            // اگر این پرداخت مربوط به رزرو غذا است
            if (payment.foodId && payment.foodDates) {
                try {
                    // دریافت اطلاعات غذا
                    const food = await Food.findById(payment.foodId).populate("owner");

                    if (food) {
                        // ایجاد رزرو در انتظار تایید
                        const reservation = await Reservation.create({
                            user: payment.user,
                            targetUser: food.owner._id,
                            itemType: "food",
                            itemModel: "Food",
                            itemId: payment.foodId,
                            dates: payment.foodDates.map((date) => new Date(date)),
                            guests: payment.guests || { adults: 1, children: 0 },
                            amount: payment.amount,
                            totalPrice: payment.amount,
                            status: "pending", // در انتظار تایید مالک
                            payment: payment._id,
                            contactInfo: {
                                name: food.owner?.fullName || food.owner?.name || "",
                                phone: food.owner?.number || food.owner?.phone || "",
                                email: food.owner?.email || "",
                            },
                        });

                        // ایجاد کارمزد
                        const foodBaseAmount = payment.basePrice || payment.amount || 0;
                        const commission = await Commission.create({
                            reservation: reservation._id,
                            payment: payment._id,
                            user: food.owner._id,
                            targetUser: payment.user._id || payment.user,
                            itemType: "food",
                            itemId: payment.foodId,
                            baseAmount: foodBaseAmount,
                            commissionAmount: payment.commissionAmount || 0,
                            commissionRate: payment.commissionRate || 6,
                            depositRate: 100, // برای غذا کل مبلغ پرداخت می‌شود
                            depositAmount: foodBaseAmount, // 100% قیمت پایه
                            totalPaidAmount: payment.amount || 0,
                            remainingAmount: 0, // برای غذا مبلغ باقی‌مانده صفر است
                            // کارمزد تا زمان تایید رزرو توسط مالک به حالت pending می‌ماند
                            status: "pending",
                            collectedAt: null,
                        });

                        // تاریخ‌ها فقط زمانی بلاک می‌شوند که رزرو تایید شود

                        // ذخیره اطلاعات مالی در رزرو برای واریز بعدی (پس از تایید مالک)
                        // غذا: کارمزد از مشتری گرفته شده، پس کل قیمت پایه به مالک می‌رسد
                        // adminAmount = کارمزد + مالیات
                        const foodTotalCommission = payment.commissionAmount || 0;
                        const foodOwnerAmount = payment.depositAmount || payment.basePrice || 0;
                        const foodAdminAmount = foodTotalCommission + (payment.taxAmount || 0);

                        reservation.financialDetails = {
                            basePrice: payment.basePrice || 0,
                            totalBasePrice: payment.totalBasePrice || payment.basePrice || 0,
                            depositAmount: payment.depositAmount || 0,
                            taxAmount: payment.taxAmount || 0,
                            commissionAmount: payment.commissionAmount || 0,
                            adminAmount: foodAdminAmount,
                            ownerAmount: foodOwnerAmount,
                            totalPaid: payment.amount
                        };
                        await reservation.save();

                        // Send SMS notifications for food reservation
                        try {
                            const userInfo = await User.findById(payment.user._id || payment.user);
                            await sendAllReservationNotifications({
                                userPhone: userInfo?.number || payment.user?.number,
                                userName: userInfo?.fullName || userInfo?.name || "کاربر",
                                ownerPhone: food.owner?.number,
                                ownerName: food.owner?.fullName || food.owner?.name || "مالک",
                                itemType: "food",
                                itemName: food.foods?.[0] || food.staff?.chef?.name || "غذا",
                            });
                        } catch (smsError) {
                            console.error("Error sending SMS notifications for food:", smsError);
                        }
                    }
                } catch (error) {
                    console.error("خطا در ثبت رزرو غذا:", error);
                }
            }

            return NextResponse.redirect(
                `${process.env.BASE_URL}/payment/success?ref_id=${verifyData.data.ref_id}&amount=${payment.amount}`
            );
        } else {
            // پرداخت ناموفق
            payment.status = "failed";
            await payment.save();

            return NextResponse.redirect(
                `${process.env.BASE_URL}/payment/failed?error=verification_failed`
            );
        }
    } catch (error) {
        console.error("Payment verification error:", error);
        return NextResponse.redirect(`${process.env.BASE_URL}/payment/failed?error=server_error`);
    }
}

export async function POST(request) {
    // همان منطق GET اما برای POST request
    return GET(request);
}
