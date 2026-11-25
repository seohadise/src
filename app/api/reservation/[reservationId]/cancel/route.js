import connectDB from "@/config/db";
import Reservation from "@/models/Reservation";
import Property from "@/models/Property";
import Bus from "@/models/Bus";
import Food from "@/models/Food";
import User from "@/models/User";
import Payment from "@/models/Payment";
import Transaction from "@/models/Transaction";
import { NextResponse } from "next/server";
import { unblockPropertyDates } from "@/lib/property-utils";
import { getUser } from "@/lib/helpers";
import { sendAllCancellationNotifications } from "@/lib/sms-service";

// لغو رزرو توسط کاربر
export async function POST(request, { params }) {
    try {
        await connectDB();

        // دریافت کاربر جاری
        const user = await getUser();
        if (!user) {
            return NextResponse.json(
                { success: false, message: "لطفا وارد حساب کاربری خود شوید" },
                { status: 401 }
            );
        }

        // دریافت رزرو با شناسه
        const { reservationId } = await params;
        const reservation = await Reservation.findById(reservationId);

        if (!reservation) {
            return NextResponse.json(
                { success: false, message: "رزرو مورد نظر یافت نشد" },
                { status: 404 }
            );
        }

        // بررسی دسترسی کاربر به این رزرو
        if (reservation.user.toString() !== user._id.toString()) {
            return NextResponse.json(
                { success: false, message: "شما دسترسی به لغو این رزرو ندارید" },
                { status: 403 }
            );
        }

        // بررسی وضعیت رزرو - فقط رزروهای در انتظار تایید یا تایید شده قابل لغو هستند
        if (reservation.status !== "pending" && reservation.status !== "confirmed") {
            return NextResponse.json(
                { success: false, message: "این رزرو قابل لغو نیست" },
                { status: 400 }
            );
        }

        // ذخیره وضعیت قبلی رزرو برای استفاده در تصمیم‌گیری‌های مالی
        const oldStatus = reservation.status;

        // Refund for property reservations (full refund, no penalty)
        let penaltyAmount = 0;
        let refundAmount = 0;
        let penaltyDetails = null;

        if (reservation.itemType === "property") {
            try {
                const property = await Property.findById(reservation.itemId);
                const payment = await Payment.findById(reservation.payment);

                if (property && payment) {
                    const totalPaid = reservation.amount || payment.amount || 0;
                    refundAmount = totalPaid;
                    penaltyAmount = 0;

                    console.log("Property cancellation - full refund:", refundAmount);

                    // Refund full amount to guest wallet
                    if (refundAmount > 0) {
                        await User.findByIdAndUpdate(user._id, {
                            $inc: { "wallet.balance": refundAmount },
                        });

                        // Create refund transaction for guest
                        await Transaction.create({
                            user: user._id,
                            type: "income",
                            amount: refundAmount,
                            description: `بازگشت وجه از لغو رزرو ملک ${property.name}`,
                            relatedModel: "Reservation",
                            relatedId: reservation._id,
                            status: "completed",
                        });
                    }
                }
            } catch (error) {
                console.error("Error refunding property cancellation:", error);
                // Continue with cancellation even if refund fails
            }
        }

        // Refund for bus and food reservations (full refund)
        if (reservation.itemType === "bus" || reservation.itemType === "food") {
            try {
                const totalPaid = reservation.financialDetails?.totalPaid || reservation.amount || 0;
                if (totalPaid > 0) {
                    refundAmount = totalPaid;

                    await User.findByIdAndUpdate(user._id, {
                        $inc: { "wallet.balance": refundAmount },
                    });

                    const itemLabel = reservation.itemType === "bus" ? "اتوبوس" : "غذا";
                    await Transaction.create({
                        user: user._id,
                        type: "refund",
                        amount: refundAmount,
                        description: `بازگشت وجه از لغو رزرو ${itemLabel}`,
                        relatedModel: "Reservation",
                        relatedId: reservation._id,
                        status: "completed",
                    });

                    console.log(`[cancel] Refund for ${reservation.itemType}:`, { refundAmount });
                }
            } catch (error) {
                console.error("Error refunding bus/food reservation:", error);
            }
        }

        // If reservation was confirmed and owner/admin were already paid, deduct from their wallets
        // Skip for property - no penalties for property cancellations
        if (reservation.itemType !== "property" && reservation.financialDetails?.isPaid && oldStatus === "confirmed") {
            try {
                const { ownerAmount, adminAmount } = reservation.financialDetails;
                const itemLabel = reservation.itemType === "bus" ? "اتوبوس" : "غذا";

                // Deduct from owner wallet
                if (ownerAmount > 0 && reservation.targetUser) {
                    await User.findByIdAndUpdate(reservation.targetUser, {
                        $inc: { "wallet.balance": -ownerAmount },
                    });

                    await Transaction.create({
                        user: reservation.targetUser,
                        type: "expense",
                        amount: ownerAmount,
                        description: `کسر درآمد به دلیل لغو رزرو ${itemLabel} توسط مهمان`,
                        relatedModel: "Reservation",
                        relatedId: reservation._id,
                        status: "completed",
                    });
                }

                // Deduct from admin wallet
                if (adminAmount > 0) {
                    const adminUser = await User.findOne({ role: "admin" }) || await User.findOne({ isAdmin: true });
                    if (adminUser) {
                        await User.findByIdAndUpdate(adminUser._id, {
                            $inc: { "wallet.balance": -adminAmount },
                        });

                        await Transaction.create({
                            user: adminUser._id,
                            type: "expense",
                            amount: adminAmount,
                            description: `کسر کارمزد و مالیات به دلیل لغو رزرو ${itemLabel} توسط مهمان`,
                            relatedModel: "Reservation",
                            relatedId: reservation._id,
                            status: "completed",
                        });
                    }
                }

                // Mark as no longer paid
                reservation.financialDetails.isPaid = false;
                await reservation.save();

                console.log(`[cancel] Deducted from owner/admin wallets:`, { ownerAmount, adminAmount });
            } catch (error) {
                console.error("Error deducting from owner/admin wallets:", error);
            }
        } else {
            console.log(`[cancel] Skipping wallet deduction - reservation was not confirmed (status: ${oldStatus}, isPaid: ${reservation.financialDetails?.isPaid})`);
        }

        // لغو رزرو
        reservation.status = "cancelled";
        await reservation.save();

        // ارسال پیامک لغو رزرو به مالک و مدیر
        try {
            let itemName = "";
            let ownerPhone = "";
            let ownerName = "";

            if (reservation.itemType === "property") {
                const property = await Property.findById(reservation.itemId).populate("owner");
                itemName = property?.name || property?.address?.city || property?.address?.fullAddress || "ملک";
                ownerPhone = property?.owner?.number || "";
                ownerName = property?.owner?.fullName || "مالک";
            } else if (reservation.itemType === "bus") {
                const bus = await Bus.findById(reservation.itemId).populate("owner");
                itemName = bus?.vehicle?.name || `${bus?.from?.city} - ${bus?.to?.city}` || "اتوبوس";
                ownerPhone = bus?.owner?.number || "";
                ownerName = bus?.owner?.fullName || "مالک";
            } else if (reservation.itemType === "food") {
                const food = await Food.findById(reservation.itemId).populate("owner");
                itemName = food?.foods?.[0] || food?.staff?.chef?.name || "غذا";
                ownerPhone = food?.owner?.number || "";
                ownerName = food?.owner?.fullName || "مالک";
            }

            await sendAllCancellationNotifications({
                userPhone: user.number,
                userName: user.fullName || "کاربر",
                ownerPhone: ownerPhone,
                ownerName: ownerName,
                itemType: reservation.itemType,
                itemName: itemName,
                cancelledBy: "user",
            });
        } catch (smsError) {
            console.error("Error sending cancellation SMS:", smsError);
        }

        // آزاد کردن تاریخ‌های رزرو شده در صورتی که نوع آیتم ملک باشد
        if (reservation.itemType === "property") {
            try {
                if (reservation.checkInDate && reservation.checkOutDate) {
                    await unblockPropertyDates(
                        reservation.itemId,
                        reservation.checkInDate,
                        reservation.checkOutDate
                    );
                    console.log("تاریخ‌های ملک با موفقیت آزاد شدند");
                }
            } catch (error) {
                console.error("Error updating property dates:", error);
                // ادامه می‌دهیم حتی اگر بروزرسانی تاریخ‌ها با خطا مواجه شد
            }
        } else if (reservation.itemType === "bus") {
            try {
                const bus = await Bus.findById(reservation.itemId);
                if (bus && reservation.date) {
                    const guestCount = (reservation.guests?.adults || 1) + (reservation.guests?.children || 0);

                    if (bus.availableDates && bus.availableDates.length > 0) {
                        // آزاد کردن تاریخ مشخص در availableDates
                        const dateToFree = bus.availableDates.find(
                            (d) =>
                                new Date(d.date).toDateString() ===
                                new Date(reservation.date).toDateString()
                        );

                        if (dateToFree) {
                            // بازگشت ظرفیت
                            const currentRemaining = dateToFree.remainingCapacity ?? 0;
                            const maxCapacity = bus.vehicle?.capacity ?? bus.capacity ?? 0;
                            dateToFree.remainingCapacity = Math.min(currentRemaining + guestCount, maxCapacity);
                            if (dateToFree.remainingCapacity > 0) {
                                dateToFree.isReserved = false;
                            }
                            await bus.save();
                            console.log(`[cancel] Bus capacity restored: ${currentRemaining} -> ${dateToFree.remainingCapacity}`);
                        }
                    } else {
                        // اگر availableDates خالی است، تاریخ اصلی را آزاد کن
                        bus.isReserved = false;
                        await bus.save();
                        console.log("اتوبوس آزاد شد:", reservation.date);
                    }
                }
            } catch (error) {
                console.error("Error updating bus reservation status:", error);
            }
        } else if (reservation.itemType === "food") {
            try {
                const food = await Food.findById(reservation.itemId);
                if (food && reservation.dates) {
                    const quantity = reservation.quantity || 1;

                    reservation.dates.forEach((selectedDate) => {
                        const dateObj = food.availableDates.find(
                            (d) =>
                                new Date(d.date).toDateString() ===
                                new Date(selectedDate).toDateString()
                        );
                        if (dateObj) {
                            if (dateObj.remainingCapacity === undefined || dateObj.remainingCapacity === null) {
                                dateObj.remainingCapacity = food.dailyCapacity || 0;
                            }

                            const currentRemaining = dateObj.remainingCapacity;
                            const newRemaining = Math.min(currentRemaining + quantity, food.dailyCapacity || 0);
                            dateObj.remainingCapacity = newRemaining;

                            if (newRemaining > 0) {
                                dateObj.isReserved = false;
                            }

                            console.log(`[cancel] Food capacity restored: ${currentRemaining} -> ${dateObj.remainingCapacity}`);
                        }
                    });
                    await food.save();
                }
            } catch (error) {
                console.error("Error updating food reservation status:", error);
            }
        }

        return NextResponse.json({
            success: true,
            message: penaltyDetails?.isFreeWindow
                ? "رزرو با موفقیت و بدون جریمه لغو شد"
                : "رزرو با موفقیت لغو شد",
            data: {
                refundAmount,
                penaltyAmount,
                refundPercent: penaltyDetails?.refundPercent || 0,
                penaltyPercent: penaltyDetails?.penaltyPercent || 0,
                isFreeWindow: penaltyDetails?.isFreeWindow || false,
                appliedRule: penaltyDetails?.appliedRule || null,
            },
        });
    } catch (error) {
        console.error("API Cancel Reservation Error:", error);
        return NextResponse.json({ success: false, message: "خطا در لغو رزرو" }, { status: 500 });
    }
}
