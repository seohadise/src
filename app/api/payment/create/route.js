import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Payment from "@/models/Payment";
import Property from "@/models/Property";
import Bus from "@/models/Bus";
import Food from "@/models/Food";
import Commission from "@/models/Commission";
import Reservation from "@/models/Reservation";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { blockPropertyDates } from "@/lib/property-utils";
import { getUser } from "@/lib/helpers";
import { sendAllReservationNotifications } from "@/lib/sms-service";

// Get Persian day of week: 0=Saturday(شنبه), ..., 6=Friday(جمعه)
const persianDayOfWeek = (date) => {
  const jsDay = date.getUTCDay();
  return jsDay === 6 ? 0 : jsDay + 1;
};

// Normalize date to YYYY-MM-DD string (UTC, timezone-safe)
const normalizeDate = (date) => {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
};

// Calculate price for a date based on pricing config and calendar settings
const calculateDayPrice = (date, pricing, settings) => {
  if (!pricing) return 0;
  if (settings && typeof settings.customPrice === "number" && settings.customPrice > 0) {
    return settings.customPrice;
  }
  if (settings && settings.peak && pricing.peakPrice) {
    return pricing.peakPrice;
  }
  const pDay = persianDayOfWeek(date);
  if (pDay === 6) return pricing.fridayPrice || pricing.regularPrice || 0;
  if (pDay === 5) return pricing.thursdayPrice || pricing.regularPrice || 0;
  if (pDay === 4) return pricing.wednesdayPrice || pricing.regularPrice || 0;
  return pricing.regularPrice || 0;
};

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

        const requestData = await request.json();

        const {
            // Property fields
            propertyId,
            checkInDate,
            checkOutDate,
            // Bus fields
            busId,
            busDate,
            // Food fields
            foodId,
            foodDates,
            quantity = 1,
            // Common fields
            guests = { adults: 1, children: 0 },
            description = "پرداخت",
            // Wallet usage
            useWallet = true,
        } = requestData;

        // تشخیص نوع آیتم
        let itemType = null;
        let itemId = null;

        if (propertyId) {
            itemType = "property";
            itemId = propertyId;
            if (!checkInDate || !checkOutDate) {
                return NextResponse.json(
                    { success: false, message: "تاریخ ورود و خروج الزامی است." },
                    { status: 400 }
                );
            }
        } else if (busId) {
            itemType = "bus";
            itemId = busId;
            if (!busDate) {
                return NextResponse.json(
                    { success: false, message: "تاریخ سفر الزامی است." },
                    { status: 400 }
                );
            }
        } else if (foodId) {
            itemType = "food";
            itemId = foodId;
        } else {
            return NextResponse.json(
                { success: false, message: "شناسه آیتم الزامی است." },
                { status: 400 }
            );
        }

        let item = null;
        let basePrice = 0;
        let nights = 1;
        let totalBasePrice = 0;

        // بررسی و دریافت اطلاعات بر اساس نوع آیتم
        if (itemType === "property") {
            // بررسی صحت تاریخ‌ها
            const checkIn = new Date(checkInDate);
            const checkOut = new Date(checkOutDate);
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            if (checkIn < now) {
                return NextResponse.json(
                    { success: false, message: "تاریخ ورود نمی‌تواند در گذشته باشد." },
                    { status: 400 }
                );
            }

            if (checkOut <= checkIn) {
                return NextResponse.json(
                    { success: false, message: "تاریخ خروج باید بعد از تاریخ ورود باشد." },
                    { status: 400 }
                );
            }

            // دریافت اطلاعات ملک
            const property = await Property.findById(propertyId).populate("owner");
            if (!property) {
                return NextResponse.json(
                    { success: false, message: "ملک مورد نظر یافت نشد." },
                    { status: 404 }
                );
            }

            // بررسی مالکیت
            if (property.owner && property.owner._id.toString() === user._id.toString()) {
                return NextResponse.json(
                    { success: false, message: "شما نمی‌توانید ملک خودتان را رزرو کنید." },
                    { status: 403 }
                );
            }

            if (property.status !== "approved") {
                return NextResponse.json(
                    { success: false, message: "این ملک هنوز تایید نشده است." },
                    { status: 400 }
                );
            }

            item = property;
            nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

            // محاسبه قیمت بر اساس تنظیمات تقویم (calendarSettings) و روز هفته
            const calendarMap = new Map();

            if (Array.isArray(property.calendarSettings)) {
                property.calendarSettings.forEach((setting) => {
                    if (!setting?.date) return;
                    const dateStr = normalizeDate(setting.date);
                    calendarMap.set(dateStr, setting);
                });
            }

            let current = new Date(checkIn);
            totalBasePrice = 0;

            while (current < checkOut) {
                const dateStr = normalizeDate(current);
                const settings = calendarMap.get(dateStr);

                // اگر روز بلاک یا غیرقابل رزرو باشد، اجازه ادامه رزرو نمی‌دهیم
                if (settings && (settings.blocked || settings.available === false)) {
                    return NextResponse.json(
                        {
                            success: false,
                            message: `تاریخ ${current.toLocaleDateString(
                                "fa-IR"
                            )} در دسترس نیست.`,
                        },
                        { status: 400 }
                    );
                }

                // محاسبه قیمت بر اساس روز هفته، پیک یا قیمت سفارشی
                let nightlyPrice = calculateDayPrice(current, property.pricing, settings);

                if (settings) {
                    // اعمال تخفیف لحظه آخری در صورت وجود
                    if (
                        typeof settings.lastMinuteDiscount === "number" &&
                        settings.lastMinuteDiscount > 0 &&
                        settings.lastMinuteDiscount <= 100
                    ) {
                        const discountAmount = Math.round(
                            (nightlyPrice * settings.lastMinuteDiscount) / 100
                        );
                        nightlyPrice = nightlyPrice - discountAmount;
                    }
                }

                totalBasePrice += nightlyPrice;
                current.setDate(current.getDate() + 1);
            }

            // برای هم‌خوانی با فیلدهای پرداخت، basePrice را میانگین هر شب در نظر می‌گیریم
            basePrice = nights > 0 ? Math.round(totalBasePrice / nights) : 0;
        } else if (itemType === "bus") {
            // بررسی تاریخ اتوبوس
            const selectedDate = new Date(busDate);
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            if (selectedDate < now) {
                return NextResponse.json(
                    { success: false, message: "تاریخ سفر نمی‌تواند در گذشته باشد." },
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

            // بررسی مالکیت
            if (bus.owner && bus.owner._id.toString() === user._id.toString()) {
                return NextResponse.json(
                    { success: false, message: "شما نمی‌توانید اتوبوس خودتان را رزرو کنید." },
                    { status: 403 }
                );
            }

            if (bus.status !== "approved") {
                return NextResponse.json(
                    { success: false, message: "این اتوبوس هنوز تایید نشده است." },
                    { status: 400 }
                );
            }

            // محاسبه تعداد کل مهمان
            const totalGuests = (guests.adults || 1) + (guests.children || 0);

            // بررسی ظرفیت اتوبوس
            const busCapacity = bus.vehicle?.capacity || 0;
            const selectedBusDate = new Date(busDate);

            // اگر اتوبوس availableDates دارد
            if (bus.availableDates && bus.availableDates.length > 0) {
                const dateObj = bus.availableDates.find(
                    (d) => new Date(d.date).toDateString() === selectedBusDate.toDateString()
                );

                if (!dateObj) {
                    return NextResponse.json(
                        { success: false, message: "تاریخ انتخابی برای رزرو در دسترس نیست." },
                        { status: 400 }
                    );
                }

                if (dateObj.isReserved) {
                    return NextResponse.json(
                        { success: false, message: "این تاریخ قبلاً رزرو شده است." },
                        { status: 400 }
                    );
                }

                // بررسی ظرفیت باقیمانده
                const remainingCapacity = dateObj.remainingCapacity ?? busCapacity;
                if (totalGuests > remainingCapacity) {
                    return NextResponse.json(
                        { 
                            success: false, 
                            message: `ظرفیت باقیمانده اتوبوس برای این تاریخ ${remainingCapacity} نفر است. تعداد مهمان انتخابی (${totalGuests} نفر) بیش از ظرفیت موجود است.` 
                        },
                        { status: 400 }
                    );
                }
            } else {
                // اگر availableDates خالی است، فقط تاریخ اصلی اتوبوس مجاز است
                const busMainDate = new Date(bus.date);
                if (selectedBusDate.toDateString() !== busMainDate.toDateString()) {
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

                // بررسی ظرفیت کل اتوبوس
                if (totalGuests > busCapacity) {
                    return NextResponse.json(
                        { 
                            success: false, 
                            message: `ظرفیت اتوبوس ${busCapacity} نفر است. تعداد مهمان انتخابی (${totalGuests} نفر) بیش از ظرفیت موجود است.` 
                        },
                        { status: 400 }
                    );
                }
            }

            item = bus;
            basePrice = bus.price || 0;
            nights = 1;

            // محاسبه قیمت بر اساس تعداد مهمان
            basePrice = basePrice * totalGuests;
        } else if (itemType === "food") {
            // بررسی تاریخ‌های غذا
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            for (const dateStr of foodDates) {
                const selectedDate = new Date(dateStr);
                if (selectedDate < now) {
                    return NextResponse.json(
                        { success: false, message: "تاریخ سفارش نمی‌تواند در گذشته باشد." },
                        { status: 400 }
                    );
                }
            }

            // دریافت اطلاعات غذا
            const food = await Food.findById(foodId).populate("owner");
            if (!food) {
                return NextResponse.json(
                    { success: false, message: "غذا مورد نظر یافت نشد." },
                    { status: 404 }
                );
            }

            // بررسی مالکیت
            if (food.owner && food.owner._id.toString() === user._id.toString()) {
                return NextResponse.json(
                    { success: false, message: "شما نمی‌توانید غذای خودتان را سفارش دهید." },
                    { status: 403 }
                );
            }

            if (food.status !== "approved") {
                return NextResponse.json(
                    { success: false, message: "این غذا هنوز تایید نشده است." },
                    { status: 400 }
                );
            }

            if (
                food.availableDates &&
                food.availableDates.length > 0 &&
                (!foodDates || !Array.isArray(foodDates) || foodDates.length === 0)
            ) {
                return NextResponse.json(
                    { success: false, message: "لطفا حداقل یک تاریخ برای سفارش انتخاب کنید." },
                    { status: 400 }
                );
            }

            if (!foodDates || !Array.isArray(foodDates)) {
                foodDates = [];
            }

            item = food;
            const unitPrice = food.pricing?.basePrice || food.price || 0;
            const orderQuantity = Math.max(
                typeof quantity === "number" && quantity > 0 ? quantity : 0,
                food.pricing?.minimumOrder || 1
            );

            if (!unitPrice || unitPrice < 100) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "قیمت غذا نامعتبر است.",
                    },
                    { status: 400 }
                );
            }

            basePrice = unitPrice * orderQuantity;
            nights = foodDates.length > 0 ? foodDates.length : 1;
        }

        // بررسی تداخل تاریخ‌ها (فقط برای Property)
        if (itemType === "property") {
            const checkIn = new Date(checkInDate);
            const checkOut = new Date(checkOutDate);

            // بررسی بازه موجود بودن ملک
            if (item.availabilityStartDate && item.availabilityEndDate) {
                const availStart = new Date(item.availabilityStartDate);
                const availEnd = new Date(item.availabilityEndDate);
                if (checkIn < availStart || checkOut > availEnd) {
                    return NextResponse.json(
                        {
                            success: false,
                            message: `تاریخ‌های انتخابی خارج از بازه موجود بودن ملک هستند.`,
                        },
                        { status: 400 }
                    );
                }
            }

            // بررسی تاریخ‌های رزرو شده در availableDates
            if (item.availableDates && item.availableDates.length > 0) {
                const currentDate = new Date(checkIn);
                while (currentDate < checkOut) {
                    const dateObj = item.availableDates.find(
                        (d) => normalizeDate(d.date) === normalizeDate(currentDate)
                    );

                    // اگر تاریخ در لیست موجود باشد و رزرو شده باشد
                    if (dateObj) {
                        const hasCapacity = dateObj.remainingCapacity !== undefined && dateObj.remainingCapacity !== null 
                            ? dateObj.remainingCapacity > 0 
                            : !dateObj.isReserved;
                        
                        if (!hasCapacity) {
                            return NextResponse.json(
                                {
                                    success: false,
                                    message: `تاریخ ${currentDate.toLocaleDateString(
                                        "fa-IR"
                                    )} ظرفیت خالی ندارد.`,
                                },
                                { status: 400 }
                            );
                        }
                    }

                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }
        }

        // اگر برای ملک از تقویم محاسبه شده، totalBasePrice از قبل پر است
        if (itemType !== "property") {
            totalBasePrice = basePrice * nights;
        }

        // بررسی قیمت
        if (!totalBasePrice || totalBasePrice < 100) {
            return NextResponse.json(
                { success: false, message: "قیمت نامعتبر است." },
                { status: 400 }
            );
        }

        // کارمزد 6% از قیمت کل
        const commissionRate = 6;
        const commissionAmount = Math.round((totalBasePrice * commissionRate) / 100);

        // محاسبه بیعانه
        let depositRate = 10; // پیش‌فرض برای ملک
        if (itemType === "property" && item.pricing?.deposit) {
            depositRate = item.pricing.deposit;
        } else if (itemType === "bus") {
            depositRate = 100;
        } else if (itemType === "food") {
            depositRate = 100; // برای غذا کل مبلغ پرداخت می‌شود
        }
        // برای ملک حداکثر 80% بیعانه، برای اتوبوس و غذا 100%
        if (itemType === "property") {
            depositRate = Math.min(depositRate, 80);
        }
        
        // بیعانه از قیمت پایه محاسبه می‌شود
        const depositAmount = Math.round((totalBasePrice * depositRate) / 100);

        // منطق مالی ملک با اتوبوس و غذا متفاوت است:
        // ملک: کارمزد از سهم مالک کسر می‌شود، مالیات از بیعانه
        // اتوبوس و غذا: کارمزد به مبلغ پرداختی مشتری اضافه می‌شود، مالیات از (بیعانه + کارمزد)
        const taxRate = 10;
        let amount;
        let taxAmount;

        if (itemType === "property") {
            // ملک: مالیات فقط از بیعانه، کارمزد از سهم مالک کسر می‌شود
            taxAmount = Math.round((depositAmount * taxRate) / 100);
            amount = depositAmount + taxAmount;
        } else {
            // اتوبوس و غذا: کارمزد به مبلغ پرداختی اضافه می‌شود، مالیات از (بیعانه + کارمزد)
            const priceWithCommission = depositAmount + commissionAmount;
            taxAmount = Math.round((priceWithCommission * taxRate) / 100);
            amount = priceWithCommission + taxAmount;
        }

        if (amount < 100) {
            return NextResponse.json(
                {
                    success: false,
                    message: `مبلغ قابل پرداخت (${amount} تومان) کمتر از حد مجاز است.`,
                },
                { status: 400 }
            );
        }

        // بررسی استفاده از کیف پول
        let walletUsed = 0;
        let remainingAmount = amount;
        const MIN_GATEWAY_AMOUNT = 1000; // حداقل مبلغ درگاه زرین‌پال (تومان)
        
        if (useWallet && user.wallet && user.wallet.balance > 0) {
            const walletBalance = user.wallet.balance || 0;
            
            if (walletBalance >= amount) {
                // کیف پول کافی است - کل مبلغ از کیف پول کسر می‌شود
                walletUsed = amount;
                remainingAmount = 0;
            } else {
                // کیف پول ناکافی - بخشی از کیف پول استفاده می‌شود
                const potentialRemaining = amount - walletBalance;
                
                // اگر مبلغ باقیمانده کمتر از حداقل درگاه باشد
                if (potentialRemaining > 0 && potentialRemaining < MIN_GATEWAY_AMOUNT) {
                    // اگر کل مبلغ کمتر از حداقل درگاه است، از کیف پول استفاده نکن
                    if (amount < MIN_GATEWAY_AMOUNT) {
                        walletUsed = 0;
                        remainingAmount = amount;
                    } else {
                        // فقط به اندازه‌ای از کیف پول استفاده کن که مبلغ باقیمانده حداقل 1000 تومان باشد
                        const maxWalletUse = Math.max(0, amount - MIN_GATEWAY_AMOUNT);
                        walletUsed = Math.min(walletBalance, maxWalletUse);
                        remainingAmount = amount - walletUsed;
                    }
                } else {
                    walletUsed = walletBalance;
                    remainingAmount = potentialRemaining;
                }
            }
        }
        
        // اگر مبلغ باقیمانده کمتر از حداقل درگاه و بیشتر از صفر باشد، خطا بده
        if (remainingAmount > 0 && remainingAmount < MIN_GATEWAY_AMOUNT) {
            return NextResponse.json(
                {
                    success: false,
                    message: `مبلغ باقیمانده (${remainingAmount} تومان) کمتر از حداقل مجاز درگاه پرداخت (${MIN_GATEWAY_AMOUNT} تومان) است. لطفاً موجودی کیف پول خود را افزایش دهید.`,
                },
                { status: 400 }
            );
        }

        // تولید توضیحات بر اساس نوع آیتم
        let itemName = "";
        let itemDescription = "";

        if (itemType === "property") {
            itemName = item.name || "ملک";
            itemDescription = `رزرو ${itemName} (${nights} شب)`;
        } else if (itemType === "bus") {
            itemName = item.vehicle?.name || "اتوبوس";
            itemDescription = `رزرو ${itemName}`;
        } else if (itemType === "food") {
            itemName = item.name || "غذا";
            itemDescription = `سفارش ${itemName} (${nights} روز)`;
        }

        // اگر کل مبلغ از کیف پول پرداخت شد، نیازی به درگاه نیست
        if (remainingAmount === 0) {
            // تولید اطلاعات پرداخت
            const paymentData = {
                user: user._id,
                targetUser: item.owner._id,
                authority: `WALLET_${Date.now()}`,
                amount: amount,
                status: "paid",
                itemId: itemId,
                itemType: itemType,
                basePrice: totalBasePrice,
                totalBasePrice: totalBasePrice,
                finalPrice: totalBasePrice, // قیمت نهایی بدون کارمزد اضافی
                depositAmount: depositAmount,
                commissionAmount: commissionAmount, // کارمزد 6% از کل قیمت
                taxAmount: taxAmount,
                taxRate: taxRate,
                depositRate: depositRate,
                commissionRate: commissionRate,
                nights: nights,
                guests: guests,
                description: description,
                walletUsed: walletUsed,
                trackingCode: `WALLET_${Date.now()}`,
            };

            // اضافه کردن فیلدهای خاص هر نوع
            if (itemType === "property") {
                paymentData.propertyId = propertyId;
                paymentData.checkInDate = checkInDate;
                paymentData.checkOutDate = checkOutDate;
            } else if (itemType === "bus") {
                paymentData.busId = busId;
                paymentData.busDate = busDate;
            } else if (itemType === "food") {
                paymentData.foodId = foodId;
                paymentData.foodDates = foodDates;
            }

            const payment = await Payment.create(paymentData);

            await User.findByIdAndUpdate(user._id, {
                $inc: { "wallet.balance": -walletUsed }
            });

            const transaction = await Transaction.create({
                user: user._id,
                type: "expense",
                amount: walletUsed,
                description: `پرداخت ${itemDescription} از کیف پول`,
                relatedId: payment._id,
                relatedType: "Payment",
                status: "completed",
            });

            await User.findByIdAndUpdate(user._id, {
                $push: { "wallet.transactions": transaction._id }
            });

            try {
                if (itemType === "property" && propertyId && checkInDate && checkOutDate) {
                    const property = item;
                    if (property) {
                        // بررسی رزرو آنی
                        let reservationStatus = "pending";
                        const checkIn = new Date(checkInDate);
                        const checkOut = new Date(checkOutDate);
                        
                        if (property.calendarSettings && property.calendarSettings.length > 0) {
                            const calendarMap = new Map();
                            property.calendarSettings.forEach(setting => {
                                if (setting?.date) {
                                    const dateStr = normalizeDate(setting.date);
                                    calendarMap.set(dateStr, setting);
                                }
                            });
                            
                            let allDatesHaveInstant = true;
                            for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
                                const dateStr = normalizeDate(d);
                                const settings = calendarMap.get(dateStr);
                                if (!settings || !settings.instantBooking) {
                                    allDatesHaveInstant = false;
                                    break;
                                }
                            }
                            
                            if (allDatesHaveInstant) {
                                reservationStatus = "confirmed";
                            }
                        }
                        
                        const reservation = await Reservation.create({
                            user: user._id,
                            targetUser: property.owner._id,
                            itemType: "property",
                            itemModel: "Property",
                            itemId: propertyId,
                            checkInDate: new Date(checkInDate),
                            checkOutDate: new Date(checkOutDate),
                            guests: guests,
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

                        await Property.findByIdAndUpdate(propertyId, {
                            $push: { reservations: reservation._id },
                        });

                        await blockPropertyDates(propertyId, checkInDate, checkOutDate);

                        const commissionBaseAmount = payment.basePrice || payment.amount || 0;
                        const commissionDepositRate = Math.min(payment.depositRate || depositRate, 80);
                        const commissionDepositAmount = Math.round((commissionBaseAmount * commissionDepositRate) / 100);
                        const commissionRemainingAmount = Math.max(commissionBaseAmount - commissionDepositAmount, 0);

                        await Commission.create({
                            reservation: reservation._id,
                            payment: payment._id,
                            user: property.owner._id,
                            targetUser: user._id,
                            itemType: "property",
                            itemId: propertyId,
                            baseAmount: payment.basePrice || payment.amount,
                            commissionAmount: payment.commissionAmount || 0,
                            commissionRate: payment.commissionRate || 6,
                            property: propertyId,
                            owner: property.owner._id,
                            customer: user._id,
                            depositRate: commissionDepositRate,
                            depositAmount: commissionDepositAmount,
                            totalPaidAmount: payment.amount || 0,
                            remainingAmount: commissionRemainingAmount,
                            paymentTrackingCode: payment.trackingCode,
                            // کارمزد تا زمان تایید رزرو توسط مالک به حالت pending می‌ماند
                            status: reservationStatus === "confirmed" ? "collected" : "pending",
                            collectedAt: reservationStatus === "confirmed" ? new Date() : null,
                        });

                        // ذخیره اطلاعات مالی در رزرو برای واریز بعدی (پس از تایید مالک)
                        // کارمزد 6% از کل قیمت محاسبه می‌شود و از بیعانه کسر می‌شود
                        // ownerAmount = بیعانه - کارمزد (مثال: 1000 - 600 = 400)
                        // adminAmount = کارمزد + مالیات (مثال: 600 + 100 = 700)
                        const totalCommission = payment.commissionAmount || 0; // 6% از کل قیمت
                        const propertyOwnerAmount = Math.max((payment.depositAmount || 0) - totalCommission, 0);
                        const propertyAdminAmount = totalCommission + (payment.taxAmount || 0);

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
                            console.log("[payment/create] واریز رزرو آنی ملک (کیف پول):", { ownerAmount: propertyOwnerAmount, adminAmount: propertyAdminAmount });
                        }

                        // Send SMS notifications for property reservation (wallet payment)
                        try {
                            await sendAllReservationNotifications({
                                userPhone: user?.number,
                                userName: user?.fullName || user?.name || "کاربر",
                                ownerPhone: property.owner?.number,
                                ownerName: property.owner?.fullName || property.owner?.name || "مالک",
                                itemType: "property",
                                itemName: property.name || property.address?.city || property.address?.fullAddress || "ملک",
                            });
                        } catch (smsError) {
                            console.error("Error sending SMS notifications for property (wallet):", smsError);
                        }
                    }
                } else if (itemType === "bus" && busId && busDate) {
                    const bus = item;
                    if (bus) {
                        const reservation = await Reservation.create({
                            user: user._id,
                            targetUser: bus.owner._id,
                            itemType: "bus",
                            itemModel: "Bus",
                            itemId: busId,
                            date: new Date(busDate),
                            guests: guests,
                            amount: payment.amount,
                            totalPrice: payment.amount,
                            status: "pending",
                            payment: payment._id,
                            contactInfo: {
                                name: bus.owner?.fullName || bus.owner?.name || "",
                                phone: bus.owner?.number || bus.owner?.phone || "",
                                email: bus.owner?.email || "",
                            },
                        });

                        const commissionBaseAmount = payment.basePrice || payment.amount || 0;
                        // برای اتوبوس بیعانه 100% است (کل مبلغ پرداخت می‌شود)
                        const commissionDepositRate = 100;
                        const commissionDepositAmount = commissionBaseAmount; // 100% قیمت پایه
                        const commissionRemainingAmount = 0; // برای اتوبوس مبلغ باقی‌مانده صفر است

                        await Commission.create({
                            reservation: reservation._id,
                            payment: payment._id,
                            user: bus.owner._id,
                            targetUser: user._id,
                            itemType: "bus",
                            itemId: busId,
                            baseAmount: commissionBaseAmount,
                            commissionAmount: payment.commissionAmount || 0,
                            commissionRate: payment.commissionRate || 6,
                            depositRate: commissionDepositRate,
                            depositAmount: commissionDepositAmount,
                            totalPaidAmount: payment.amount || 0,
                            remainingAmount: commissionRemainingAmount,
                            // کارمزد تا زمان تایید رزرو توسط مالک به حالت pending می‌ماند
                            status: "pending",
                            collectedAt: null,
                        });

                        // ذخیره تعداد مهمان برای کاهش ظرفیت بعدی (پس از تایید مالک)
                        const selectedBusDate = new Date(busDate);
                        const guestCount = (guests?.adults || 1) + (guests?.children || 0);
                        
                        // ظرفیت فقط پس از تایید رزرو توسط مالک کاهش می‌یابد (در API status)
                        console.log(`[payment/create] رزرو اتوبوس ثبت شد با کیف پول - ظرفیت پس از تایید مالک کاهش می‌یابد. تعداد مهمان: ${guestCount}, تاریخ: ${selectedBusDate.toLocaleDateString("fa-IR")}`);

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

                        // Send SMS notifications for bus reservation (wallet payment)
                        try {
                            await sendAllReservationNotifications({
                                userPhone: user?.number,
                                userName: user?.fullName || user?.name || "کاربر",
                                ownerPhone: bus.owner?.number,
                                ownerName: bus.owner?.fullName || bus.owner?.name || "مالک",
                                itemType: "bus",
                                itemName: bus.vehicle?.name || `${bus.from?.city} - ${bus.to?.city}` || "اتوبوس",
                            });
                        } catch (smsError) {
                            console.error("Error sending SMS notifications for bus (wallet):", smsError);
                        }
                    }
                } else if (itemType === "food" && foodId) {
                    const food = item;
                    if (food) {
                        const reservation = await Reservation.create({
                            user: user._id,
                            targetUser: food.owner._id,
                            itemType: "food",
                            itemModel: "Food",
                            itemId: foodId,
                            dates: (foodDates || []).map((date) => new Date(date)),
                            guests: guests,
                            amount: payment.amount,
                            totalPrice: payment.amount,
                            status: "pending",
                            payment: payment._id,
                            quantity: quantity,
                            contactInfo: {
                                name: food.owner?.fullName || food.owner?.name || "",
                                phone: food.owner?.number || food.owner?.phone || "",
                                email: food.owner?.email || "",
                            },
                        });

                        const commissionBaseAmount = payment.basePrice || payment.amount || 0;
                        // برای غذا بیعانه 100% است (کل مبلغ پرداخت می‌شود)
                        const commissionDepositRate = 100;
                        const commissionDepositAmount = commissionBaseAmount; // 100% قیمت پایه
                        const commissionRemainingAmount = 0; // برای غذا مبلغ باقی‌مانده صفر است

                        await Commission.create({
                            reservation: reservation._id,
                            payment: payment._id,
                            user: food.owner._id,
                            targetUser: user._id,
                            itemType: "food",
                            itemId: foodId,
                            baseAmount: commissionBaseAmount,
                            commissionAmount: payment.commissionAmount || 0,
                            commissionRate: payment.commissionRate || 6,
                            depositRate: commissionDepositRate,
                            depositAmount: commissionDepositAmount,
                            totalPaidAmount: payment.amount || 0,
                            remainingAmount: commissionRemainingAmount,
                            // کارمزد تا زمان تایید رزرو توسط مالک به حالت pending می‌ماند
                            status: "pending",
                            collectedAt: null,
                        });

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

                        // Send SMS notifications for food reservation (wallet payment)
                        try {
                            await sendAllReservationNotifications({
                                userPhone: user?.number,
                                userName: user?.fullName || user?.name || "کاربر",
                                ownerPhone: food.owner?.number,
                                ownerName: food.owner?.fullName || food.owner?.name || "مالک",
                                itemType: "food",
                                itemName: food.foods?.[0] || food.staff?.chef?.name || "غذا",
                            });
                        } catch (smsError) {
                            console.error("Error sending SMS notifications for food (wallet):", smsError);
                        }
                    }
                }
            } catch (error) {
                console.error("Wallet reservation creation error:", error);
                
                // بازگرداندن پول به کیف پول در صورت خطا
                try {
                    await User.findByIdAndUpdate(user._id, {
                        $inc: { "wallet.balance": walletUsed }
                    });
                    
                    await Transaction.create({
                        user: user._id,
                        type: "refund",
                        amount: walletUsed,
                        description: `بازگشت وجه به دلیل خطا در ایجاد رزرو`,
                        relatedId: payment._id,
                        relatedType: "Payment",
                        status: "completed",
                    });
                    
                    // تغییر وضعیت پرداخت به ناموفق
                    await Payment.findByIdAndUpdate(payment._id, {
                        status: "failed"
                    });
                } catch (refundError) {
                    console.error("Refund error:", refundError);
                }
                
                return NextResponse.json({
                    success: false,
                    message: "خطا در ایجاد رزرو. مبلغ به کیف پول شما بازگردانده شد.",
                }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                paidByWallet: true,
                paymentId: payment._id,
                amount: payment.amount,
                walletUsed: walletUsed,
                data: {
                    trackingCode: payment.trackingCode,
                    paymentUrl: null,
                },
                message: "پرداخت با موفقیت از کیف پول انجام شد",
            });
        }

        // اگر باید به درگاه برود
        const zarinpalRequest = {
            merchant_id: process.env.ZARINPAL_MERCHANT_ID || "aaaaaaaaaa",
            amount: remainingAmount * 10, // تبدیل تومان به ریال
            description: `${itemDescription} - مبلغ: ${depositAmount.toLocaleString()} تومان${taxAmount > 0 ? ` + مالیات: ${taxAmount.toLocaleString()} تومان` : ""}${walletUsed > 0 ? ` (${walletUsed.toLocaleString()} تومان از کیف پول)` : ""}`,
            callback_url: `${process.env.BASE_URL}/api/payment/verify`,
            metadata: {
                email: user.email,
                mobile: user.number,
                itemType: itemType,
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
            // تولید اطلاعات پرداخت بر اساس نوع آیتم
            const paymentData = {
                user: user._id,
                targetUser: item.owner._id,
                authority: zarinpalData.data.authority,
                amount: amount,
                status: "pending",
                itemId: itemId,
                itemType: itemType,
                basePrice: totalBasePrice,
                totalBasePrice: totalBasePrice,
                finalPrice: totalBasePrice, // قیمت نهایی بدون کارمزد اضافی
                depositAmount: depositAmount,
                commissionAmount: commissionAmount, // کارمزد 6% از کل قیمت
                taxAmount: taxAmount,
                taxRate: taxRate,
                depositRate: depositRate,
                commissionRate: commissionRate,
                nights: nights,
                guests: guests,
                description: description,
                walletUsed: walletUsed,
                remainingAmount: remainingAmount,
            };

            // اضافه کردن فیلدهای خاص هر نوع
            if (itemType === "property") {
                paymentData.propertyId = propertyId;
                paymentData.checkInDate = checkInDate;
                paymentData.checkOutDate = checkOutDate;
            } else if (itemType === "bus") {
                paymentData.busId = busId;
                paymentData.busDate = busDate;
            } else if (itemType === "food") {
                paymentData.foodId = foodId;
                paymentData.foodDates = foodDates;
            }

            const payment = await Payment.create(paymentData);

            return NextResponse.json({
                success: true,
                paidByWallet: false,
                paymentId: payment._id,
                walletUsed,
                amount: payment.amount,
                data: {
                    paymentUrl: `https://www.zarinpal.com/pg/StartPay/${zarinpalData.data.authority}`,
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
        console.error("Payment creation error:", error);
        console.error("Error stack:", error.stack);
        return NextResponse.json(
            {
                success: false,
                message: "خطای داخلی سرور",
                error: process.env.NODE_ENV === "development" ? error.message : "خطای داخلی",
            },
            { status: 500 }
        );
    }
}
