import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Reservation from "@/models/Reservation";
import Property from "@/models/Property";
import Bus from "@/models/Bus";
import Food from "@/models/Food";
import User from "@/models/User";
import Commission from "@/models/Commission";
import Transaction from "@/models/Transaction";
import { getUser } from "@/lib/helpers";
import { blockPropertyDates, unblockPropertyDates } from "@/lib/property-utils";
import { sendConfirmationNotification, sendAllCancellationNotifications, sendReservationRejectedSMSToUser } from "@/lib/sms-service";

export async function POST(request, { params }) {
    try {
        await connectDB();
        const user = await getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, message: "لطفا وارد حساب کاربری خود شوید" },
                { status: 401 }
            );
        }

        const { reservationId } = await params;
        const { status } = await request.json();

        // بررسی اعتبار وضعیت درخواستی
        if (!["pending", "confirmed", "cancelled", "completed", "rejected"].includes(status)) {
            return NextResponse.json(
                { success: false, message: "وضعیت نامعتبر است" },
                { status: 400 }
            );
        }

        // پیدا کردن رزرو
        const reservation = await Reservation.findById(reservationId);

        if (!reservation) {
            return NextResponse.json(
                { success: false, message: "رزرو مورد نظر یافت نشد" },
                { status: 404 }
            );
        }

        // بررسی دسترسی کاربر به رزرو
        let hasAccess = false;
        let isOwner = false;

        // اگر کاربر مالک رزرو است
        if (reservation.user && reservation.user.toString() === user._id.toString()) {
            hasAccess = true;
        }
        // اگر کاربر مالک آیتم است
        else if (reservation.itemType === "property") {
            const property = await Property.findById(reservation.itemId);
            if (property && property.owner && property.owner.toString() === user._id.toString()) {
                hasAccess = true;
                isOwner = true;
            }
        } else if (reservation.itemType === "bus") {
            const bus = await Bus.findById(reservation.itemId);
            if (bus && bus.owner && bus.owner.toString() === user._id.toString()) {
                hasAccess = true;
                isOwner = true;
            }
        } else if (reservation.itemType === "food") {
            const food = await Food.findById(reservation.itemId);
            if (food && food.owner && food.owner.toString() === user._id.toString()) {
                hasAccess = true;
                isOwner = true;
            }
        }
        // اگر کاربر ادمین است
        else if (user.isAdmin) {
            hasAccess = true;
            isOwner = true;
        }

        if (!hasAccess) {
            return NextResponse.json(
                { success: false, message: "شما دسترسی به این رزرو ندارید" },
                { status: 403 }
            );
        }

        // بروزرسانی وضعیت رزرو
        const oldStatus = reservation.status;
        reservation.status = status;
        console.log(`[status] Changing reservation ${reservationId} from ${oldStatus} to ${status}`);
        await reservation.save();
        console.log(`[status] Reservation saved successfully`);

        // اگر رزرو تایید شد، واریز به کیف پول مالک و ادمین انجام شود
        if (status === "confirmed" && oldStatus !== "confirmed") {
            // واریز وجه به کیف پول مالک و ادمین
            if (reservation.financialDetails && !reservation.financialDetails.isPaid) {
                const Transaction = (await import("@/models/Transaction")).default;
                const { ownerAmount, adminAmount } = reservation.financialDetails;
                
                // واریز به کیف پول مالک
                if (ownerAmount > 0) {
                    await User.findByIdAndUpdate(reservation.targetUser, {
                        $inc: { "wallet.balance": ownerAmount },
                    });

                    await Transaction.create({
                        user: reservation.targetUser,
                        type: "income",
                        amount: ownerAmount,
                        description: `دریافت درآمد از تایید رزرو ${reservation.itemType === "property" ? "ملک" : reservation.itemType === "bus" ? "اتوبوس" : "غذا"}`,
                        relatedModel: "Reservation",
                        relatedId: reservation._id,
                        status: "completed",
                    });
                }

                // واریز به کیف پول ادمین
                if (adminAmount > 0) {
                    const adminUser = await User.findOne({ role: "admin" });
                    if (adminUser) {
                        await User.findByIdAndUpdate(adminUser._id, {
                            $inc: { "wallet.balance": adminAmount },
                        });

                        await Transaction.create({
                            user: adminUser._id,
                            type: "income",
                            amount: adminAmount,
                            description: `دریافت کارمزد و مالیات از تایید رزرو ${reservation.itemType === "property" ? "ملک" : reservation.itemType === "bus" ? "اتوبوس" : "غذا"}`,
                            relatedModel: "Reservation",
                            relatedId: reservation._id,
                            status: "completed",
                        });
                    }
                }

                // علامت‌گذاری که واریز انجام شده
                reservation.financialDetails.isPaid = true;
                await reservation.save();

                console.log("واریز به کیف پول مالک و ادمین با موفقیت انجام شد:", {
                    reservationId: reservation._id,
                    ownerAmount,
                    adminAmount,
                });
            }

            // بروزرسانی وضعیت Commission به collected
            try {
                await Commission.updateMany(
                    { reservation: reservation._id },
                    { 
                        status: "collected",
                        collectedAt: new Date()
                    }
                );
                console.log("وضعیت کارمزد به collected تغییر کرد");
            } catch (commissionError) {
                console.error("خطا در بروزرسانی وضعیت کارمزد:", commissionError);
            }
        }

        // اگر رزرو تایید شد، تاریخ‌ها را بلاک کن
        if (status === "confirmed" && oldStatus !== "confirmed") {
            if (reservation.itemType === "property") {
                try {
                    if (reservation.checkInDate && reservation.checkOutDate) {
                        await blockPropertyDates(
                            reservation.itemId,
                            reservation.checkInDate,
                            reservation.checkOutDate
                        );
                        console.log("تاریخ‌های ملک با موفقیت بلاک شدند");
                    }
                } catch (error) {
                    console.error("خطا در بلاک کردن تاریخ‌های ملک:", error);
                }
            } else if (reservation.itemType === "bus") {
                const bus = await Bus.findById(reservation.itemId);
                if (bus && reservation.date) {
                    const guestCount = (reservation.guests?.adults || 1) + (reservation.guests?.children || 0);
                    
                    console.log(`[reservation/status] شروع کاهش ظرفیت اتوبوس - رزرو تایید شد`);
                    console.log(`  - Bus ID: ${bus._id}`);
                    console.log(`  - تعداد مهمان: ${guestCount}`);
                    console.log(`  - تاریخ رزرو: ${new Date(reservation.date).toLocaleDateString("fa-IR")}`);
                    
                    // اگر اتوبوس سیستم availableDates دارد
                    if (bus.availableDates && bus.availableDates.length > 0) {
                        const reservationDate = new Date(reservation.date);
                        const dateIndex = bus.availableDates.findIndex(
                            (d) =>
                                new Date(d.date).toDateString() === reservationDate.toDateString()
                        );
                        
                        console.log(`  - تعداد تاریخ‌های موجود: ${bus.availableDates.length}`);
                        console.log(`  - ایندکس تاریخ پیدا شده: ${dateIndex}`);
                        
                        if (dateIndex !== -1) {
                            const currentRemaining = bus.availableDates[dateIndex].remainingCapacity ?? bus.vehicle?.capacity ?? 0;
                            const newRemaining = currentRemaining - guestCount;
                            
                            console.log(`  - ظرفیت قبلی: ${currentRemaining}`);
                            console.log(`  - ظرفیت جدید: ${Math.max(0, newRemaining)}`);
                            
                            bus.availableDates[dateIndex].remainingCapacity = Math.max(0, newRemaining);
                            
                            // فقط اگر ظرفیت تمام شد، isReserved را true کن
                            if (newRemaining <= 0) {
                                bus.availableDates[dateIndex].isReserved = true;
                                console.log(`  - وضعیت: تاریخ به رزرو شده تغییر کرد (ظرفیت تمام شد)`);
                            } else {
                                console.log(`  - وضعیت: تاریخ هنوز موجود است (${newRemaining} صندلی باقیمانده)`);
                            }
                        } else {
                            console.log(`  - خطا: تاریخ در availableDates پیدا نشد!`);
                        }
                        await bus.save();
                        console.log(`  - ذخیره اتوبوس موفق`);
                    } else {
                        // اگر اتوبوس سیستم ساده دارد
                        console.log(`  - سیستم ساده: اتوبوس به رزرو شده تغییر کرد`);
                        bus.isReserved = true;
                        await bus.save();
                    }
                }
            } else if (reservation.itemType === "food") {
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
                            // اگر remainingCapacity تعریف نشده، از dailyCapacity استفاده کن
                            if (dateObj.remainingCapacity === undefined || dateObj.remainingCapacity === null) {
                                dateObj.remainingCapacity = food.dailyCapacity || 0;
                            }
                            
                            // کاهش ظرفیت
                            const currentRemaining = dateObj.remainingCapacity;
                            const newRemaining = currentRemaining - quantity;
                            dateObj.remainingCapacity = Math.max(0, newRemaining);
                            
                            // فقط اگر ظرفیت تمام شد، isReserved را true کن
                            if (newRemaining <= 0) {
                                dateObj.isReserved = true;
                            }
                            
                            console.log(`Food capacity updated: ${currentRemaining} -> ${dateObj.remainingCapacity}`);
                        }
                    });
                    await food.save();
                }
            }
        }

        // Send SMS notification when reservation is confirmed
        if (status === "confirmed" && oldStatus !== "confirmed") {
            try {
                // Get user info
                const reservationUser = await User.findById(reservation.user);
                
                // Get item and owner info
                let itemName = "";
                let ownerName = "";
                
                if (reservation.itemType === "property") {
                    const property = await Property.findById(reservation.itemId).populate("owner");
                    itemName = property?.name || property?.address?.city || property?.address?.fullAddress || "ملک";
                    ownerName = property?.owner?.fullName || property?.owner?.name || "مالک";
                } else if (reservation.itemType === "bus") {
                    const bus = await Bus.findById(reservation.itemId).populate("owner");
                    itemName = bus?.vehicle?.name || `${bus?.from?.city} - ${bus?.to?.city}` || "اتوبوس";
                    ownerName = bus?.owner?.fullName || bus?.owner?.name || "مالک";
                } else if (reservation.itemType === "food") {
                    const food = await Food.findById(reservation.itemId).populate("owner");
                    itemName = food?.foods?.[0] || food?.staff?.chef?.name || "غذا";
                    ownerName = food?.owner?.fullName || food?.owner?.name || "مالک";
                }
                
                await sendConfirmationNotification({
                    userPhone: reservationUser?.number,
                    ownerName: ownerName,
                    itemType: reservation.itemType,
                    itemName: itemName,
                });
            } catch (smsError) {
                console.error("Error sending confirmation SMS:", smsError);
            }
        }

        // اگر رزرو لغو یا رد شد، مبلغ به کیف پول کاربر برگردد و Commission به refunded تغییر کند
        // در هر دو حالت (pending یا confirmed)، مبلغ کاربر باید بازگردانده شود چون پرداخت انجام شده است
        if ((status === "cancelled" || status === "rejected") && oldStatus !== "cancelled" && oldStatus !== "rejected") {
            // برگشت وجه به کیف پول کاربر در هر دو حالت pending و confirmed
            if (reservation.financialDetails && reservation.financialDetails.totalPaid > 0) {
                const refundAmount = reservation.financialDetails.totalPaid;
                const actionLabel = status === "rejected" ? "رد" : "لغو";

                await User.findByIdAndUpdate(reservation.user, {
                    $inc: { "wallet.balance": refundAmount },
                });

                await Transaction.create({
                    user: reservation.user,
                    type: "refund",
                    amount: refundAmount,
                    description: `بازگشت وجه از ${actionLabel} رزرو ${reservation.itemType === "property" ? "ملک" : reservation.itemType === "bus" ? "اتوبوس" : "غذا"}`,
                    relatedModel: "Reservation",
                    relatedId: reservation._id,
                    status: "completed",
                });

                console.log(`مبلغ به کیف پول کاربر برگشت داده شد (${actionLabel}):`, {
                    reservationId: reservation._id,
                    refundAmount,
                    oldStatus,
                });
            }

            // اگر مالک رزرو تایید شده را لغو کند، مبلغ از کیف پول مالک و ادمین کسر شود
            if (status === "cancelled" && isOwner && oldStatus === "confirmed" && reservation.financialDetails?.isPaid) {
                const { ownerAmount, adminAmount } = reservation.financialDetails;
                const itemLabel = reservation.itemType === "property" ? "ملک" : reservation.itemType === "bus" ? "اتوبوس" : "غذا";

                // کسر از کیف پول مالک
                if (ownerAmount > 0 && reservation.targetUser) {
                    await User.findByIdAndUpdate(reservation.targetUser, {
                        $inc: { "wallet.balance": -ownerAmount },
                    });

                    await Transaction.create({
                        user: reservation.targetUser,
                        type: "expense",
                        amount: ownerAmount,
                        description: `کسر درآمد به دلیل لغو رزرو ${itemLabel} توسط مالک`,
                        relatedModel: "Reservation",
                        relatedId: reservation._id,
                        status: "completed",
                    });
                }

                // کسر از کیف پول ادمین
                if (adminAmount > 0) {
                    const adminUser = await User.findOne({ role: "admin" });
                    if (adminUser) {
                        await User.findByIdAndUpdate(adminUser._id, {
                            $inc: { "wallet.balance": -adminAmount },
                        });

                        await Transaction.create({
                            user: adminUser._id,
                            type: "expense",
                            amount: adminAmount,
                            description: `کسر کارمزد و مالیات به دلیل لغو رزرو ${itemLabel} توسط مالک`,
                            relatedModel: "Reservation",
                            relatedId: reservation._id,
                            status: "completed",
                        });
                    }
                }

                // علامت‌گذاری که واریز انجام نشده
                reservation.financialDetails.isPaid = false;
                await reservation.save();

                console.log(`[owner-cancel] مبلغ از کیف پول مالک و ادمین کسر شد:`, { ownerAmount, adminAmount });
            }

            // بروزرسانی وضعیت Commission به refunded - در هر دو حالت pending و confirmed
            // این تضمین می‌کند که کارمزد در آمار مالی محاسبه نشود
            try {
                await Commission.updateMany(
                    { reservation: reservation._id },
                    {
                        status: "refunded",
                        refundedAt: new Date()
                    }
                );
                console.log(`وضعیت کارمزد به refunded تغییر کرد (oldStatus: ${oldStatus})`);
            } catch (commissionError) {
                console.error("خطا در بروزرسانی وضعیت کارمزد:", commissionError);
            }
        }

        // Send SMS notification when reservation is cancelled by owner
        if (status === "cancelled" && oldStatus !== "cancelled") {
            try {
                // Get user info
                const reservationUser = await User.findById(reservation.user);
                const userPhone = reservationUser?.number || reservationUser?.phone;
                
                // Get item and owner info
                let itemName = "";
                let ownerName = "";
                let ownerPhone = "";
                
                if (reservation.itemType === "property") {
                    const property = await Property.findById(reservation.itemId).populate("owner");
                    itemName = property?.name || property?.address?.city || property?.address?.fullAddress || "ملک";
                    ownerName = property?.owner?.fullName || "مالک";
                    ownerPhone = property?.owner?.number || "";
                } else if (reservation.itemType === "bus") {
                    const bus = await Bus.findById(reservation.itemId).populate("owner");
                    itemName = bus?.vehicle?.name || `${bus?.from?.city} - ${bus?.to?.city}` || "اتوبوس";
                    ownerName = bus?.owner?.fullName || "مالک";
                    ownerPhone = bus?.owner?.number || "";
                } else if (reservation.itemType === "food") {
                    const food = await Food.findById(reservation.itemId).populate("owner");
                    itemName = food?.foods?.[0] || food?.staff?.chef?.name || "غذا";
                    ownerName = food?.owner?.fullName || "مالک";
                    ownerPhone = food?.owner?.number || "";
                }
                
                await sendAllCancellationNotifications({
                    userPhone: userPhone,
                    userName: reservationUser?.fullName || "کاربر",
                    ownerPhone: ownerPhone,
                    ownerName: ownerName,
                    itemType: reservation.itemType,
                    itemName: itemName,
                    cancelledBy: "owner",
                });
            } catch (smsError) {
                console.error("Error sending cancellation SMS:", smsError);
            }
        }

        // Send SMS notification when owner rejects a reservation
        if (status === "rejected" && oldStatus !== "rejected") {
            console.log("=== REJECTION SMS PROCESS STARTED ===");
            console.log(`Status changed from ${oldStatus} to ${status}`);
            try {
                // Get user info
                const reservationUser = await User.findById(reservation.user);
                const userPhone = reservationUser?.number || reservationUser?.phone;
                console.log(`User found: ${reservationUser?.fullName}, Phone: ${userPhone}`);
                
                // Get item and owner info
                let itemName = "";
                let ownerName = "";
                
                if (reservation.itemType === "property") {
                    const property = await Property.findById(reservation.itemId).populate("owner");
                    itemName = property?.name || property?.address?.city || property?.address?.fullAddress || "ملک";
                    ownerName = property?.owner?.fullName || "مالک";
                } else if (reservation.itemType === "bus") {
                    const bus = await Bus.findById(reservation.itemId).populate("owner");
                    itemName = bus?.vehicle?.name || `${bus?.from?.city} - ${bus?.to?.city}` || "اتوبوس";
                    ownerName = bus?.owner?.fullName || "مالک";
                } else if (reservation.itemType === "food") {
                    const food = await Food.findById(reservation.itemId).populate("owner");
                    itemName = food?.foods?.[0] || food?.staff?.chef?.name || "غذا";
                    ownerName = food?.owner?.fullName || "مالک";
                }
                
                console.log(`Item: ${itemName}, Owner: ${ownerName}, Type: ${reservation.itemType}`);
                
                // Send SMS to user about rejection
                if (userPhone) {
                    console.log("Attempting to send rejection SMS...");
                    const smsResult = await sendReservationRejectedSMSToUser(
                        userPhone,
                        reservation.itemType,
                        itemName,
                        ownerName
                    );
                    console.log("SMS Result:", smsResult);
                } else {
                    console.log("ERROR: User phone number not found!");
                }
            } catch (smsError) {
                console.error("Error sending rejection SMS:", smsError);
            }
            console.log("=== REJECTION SMS PROCESS ENDED ===");
        }

        // اگر رزرو لغو یا رد شد، تاریخ‌ها را آزاد کن
        if ((status === "cancelled" || status === "rejected") && (oldStatus === "confirmed" || oldStatus === "pending")) {
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
                    console.error("خطا در آزاد کردن تاریخ‌های ملک:", error);
                }
            } else if (reservation.itemType === "bus") {
                const bus = await Bus.findById(reservation.itemId);
                if (bus && reservation.date) {
                    const guestCount = (reservation.guests?.adults || 1) + (reservation.guests?.children || 0);

                    // اگر اتوبوس سیستم availableDates دارد
                    if (bus.availableDates && bus.availableDates.length > 0) {
                        const reservationDate = new Date(reservation.date);
                        const dateObj = bus.availableDates.find(
                            (d) =>
                                new Date(d.date).toDateString() === reservationDate.toDateString()
                        );
                        if (dateObj) {
                            // بازگشت ظرفیت
                            const currentRemaining = dateObj.remainingCapacity ?? 0;
                            const maxCapacity = bus.vehicle?.capacity ?? bus.capacity ?? 0;
                            dateObj.remainingCapacity = Math.min(currentRemaining + guestCount, maxCapacity);
                            if (dateObj.remainingCapacity > 0) {
                                dateObj.isReserved = false;
                            }
                        }
                        await bus.save();
                    } else {
                        // اگر اتوبوس سیستم ساده دارد
                        bus.isReserved = false;
                        await bus.save();
                    }
                }
            } else if (reservation.itemType === "food") {
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
                            // اگر remainingCapacity تعریف نشده، از dailyCapacity استفاده کن
                            if (dateObj.remainingCapacity === undefined || dateObj.remainingCapacity === null) {
                                dateObj.remainingCapacity = food.dailyCapacity || 0;
                            }
                            
                            // افزایش ظرفیت (برگشت ظرفیت)
                            const currentRemaining = dateObj.remainingCapacity;
                            const newRemaining = Math.min(currentRemaining + quantity, food.dailyCapacity || 0);
                            dateObj.remainingCapacity = newRemaining;
                            
                            // اگر ظرفیت آزاد شد، isReserved را false کن
                            if (newRemaining > 0) {
                                dateObj.isReserved = false;
                            }
                            
                            console.log(`Food capacity restored: ${currentRemaining} -> ${dateObj.remainingCapacity}`);
                        }
                    });
                    await food.save();
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: "وضعیت رزرو با موفقیت بروزرسانی شد",
            data: {
                _id: reservation._id,
                status: reservation.status,
            },
        });
    } catch (error) {
        console.error("Error updating reservation status:", error);
        return NextResponse.json(
            { success: false, message: "خطا در بروزرسانی وضعیت رزرو" },
            { status: 500 }
        );
    }
}
