const connectDB = require("../config/db");
const Payment = require("../models/Payment");
const Reservation = require("../models/Reservation");
const Property = require("../models/Property");
const Bus = require("../models/Bus");
const Food = require("../models/Food");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Commission = require("../models/Commission");

async function recoverReservations() {
    try {
        await connectDB();
        console.log("🔄 شروع بازیابی رزروهای قبلی...");

        // یافتن پرداخت‌های موفق که رزرو ندارند
        const successfulPayments = await Payment.find({
            status: "paid",
            $or: [
                { propertyId: { $exists: true, $ne: null } },
                { busId: { $exists: true, $ne: null } },
                { foodId: { $exists: true, $ne: null } },
            ],
        }).populate("user");

        console.log(`📊 ${successfulPayments.length} پرداخت موفق یافت شد`);

        let recoveredCount = 0;
        let walletUpdatedCount = 0;

        for (const payment of successfulPayments) {
            try {
                // بررسی اینکه آیا رزرو قبلاً وجود دارد
                const existingReservation = await Reservation.findOne({
                    payment: payment._id,
                });

                if (existingReservation) {
                    console.log(`⏭️  رزرو برای پرداخت ${payment._id} قبلاً وجود دارد`);
                    continue;
                }

                let reservation = null;
                let itemDetails = null;

                // رزرو ملک
                if (payment.propertyId && payment.checkInDate && payment.checkOutDate) {
                    const property = await Property.findById(payment.propertyId).populate("owner");
                    if (property) {
                        itemDetails = property;
                        reservation = await Reservation.create({
                            user: payment.user._id,
                            targetUser: property.owner._id,
                            itemType: "property",
                            itemId: payment.propertyId,
                            checkInDate: new Date(payment.checkInDate),
                            checkOutDate: new Date(payment.checkOutDate),
                            guests: payment.guests || { adults: 1, children: 0 },
                            amount: payment.amount,
                            totalPrice: payment.amount,
                            status: "confirmed",
                            payment: payment._id,
                        });

                        // بروزرسانی کیف پول مالک
                        const ownerAmount =
                            (payment.depositAmount || 0) - (payment.commissionAmount || 0);
                        if (ownerAmount > 0) {
                            await User.findByIdAndUpdate(property.owner._id, {
                                $inc: { "wallet.balance": ownerAmount },
                            });

                            // ایجاد تراکنش
                            await Transaction.create({
                                user: property.owner._id,
                                type: "income",
                                amount: ownerAmount,
                                description: `بازیابی درآمد از رزرو ملک ${property.name}`,
                                relatedModel: "Reservation",
                                relatedId: reservation._id,
                                status: "completed",
                            });

                            walletUpdatedCount++;
                        }

                        // ایجاد کارمزد
                        await Commission.create({
                            reservation: reservation._id,
                            property: payment.propertyId,
                            owner: property.owner._id,
                            customer: payment.user._id,
                            baseAmount: payment.basePrice || payment.amount,
                            commissionRate: payment.commissionRate || 6,
                            depositRate: payment.depositRate || 10,
                            paymentTrackingCode: payment.trackingCode,
                            status: "collected",
                            collectedAt: new Date(),
                        });
                    }
                }

                // رزرو اتوبوس
                else if (payment.busId && payment.busDate) {
                    const bus = await Bus.findById(payment.busId).populate("owner");
                    if (bus) {
                        itemDetails = bus;
                        reservation = await Reservation.create({
                            user: payment.user._id,
                            targetUser: bus.owner._id,
                            itemType: "bus",
                            itemId: payment.busId,
                            date: new Date(payment.busDate),
                            guests: payment.guests || { adults: 1, children: 0 },
                            amount: payment.amount,
                            totalPrice: payment.amount,
                            status: "confirmed",
                            payment: payment._id,
                        });
                    }
                }

                // رزرو غذا
                else if (payment.foodId && payment.foodDates) {
                    const food = await Food.findById(payment.foodId).populate("owner");
                    if (food) {
                        itemDetails = food;
                        reservation = await Reservation.create({
                            user: payment.user._id,
                            targetUser: food.owner._id,
                            itemType: "food",
                            itemId: payment.foodId,
                            dates: payment.foodDates.map((date) => new Date(date)),
                            guests: payment.guests || { adults: 1, children: 0 },
                            amount: payment.amount,
                            totalPrice: payment.amount,
                            status: "confirmed",
                            payment: payment._id,
                        });
                    }
                }

                if (reservation) {
                    recoveredCount++;
                    console.log(
                        `✅ رزرو بازیابی شد: ${reservation._id} برای ${
                            itemDetails?.name || "آیتم نامشخص"
                        }`
                    );
                }
            } catch (error) {
                console.error(`❌ خطا در بازیابی پرداخت ${payment._id}:`, error.message);
            }
        }

        console.log(`🎉 بازیابی کامل شد:`);
        console.log(`   📝 ${recoveredCount} رزرو بازیابی شد`);
        console.log(`   💰 ${walletUpdatedCount} کیف پول بروزرسانی شد`);
    } catch (error) {
        console.error("❌ خطا در بازیابی رزروها:", error);
    }
}

// اجرای اسکریپت
recoverReservations()
    .then(() => {
        console.log("✨ اسکریپت بازیابی کامل شد");
        process.exit(0);
    })
    .catch((error) => {
        console.error("💥 خطا در اجرای اسکریپت:", error);
        process.exit(1);
    });
