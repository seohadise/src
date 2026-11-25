import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        propertyCode: {
            type: String,
            unique: true,
            sparse: true,
        },
        name: {
            type: String,
            required: [true, "نام ملک الزامی است"],
        },
        description: {
            type: String,
            required: [true, "توضیحات ملک الزامی است"],
        },
        rules: {
            type: String,
            default: "",
        },
        // آدرس کامل
        address: {
            province: {
                type: String,
                required: [true, "استان الزامی است"],
            },
            city: {
                type: String,
                required: [true, "شهر الزامی است"],
            },
            fullAddress: {
                type: String,
                required: [true, "آدرس کامل الزامی است"],
            },
            location: {
                lat: {
                    type: String,
                    required: [true, "موقعیت جغرافیایی الزامی است"],
                },
                lng: {
                    type: String,
                    required: [true, "موقعیت جغرافیایی الزامی است"],
                },
            },
        },
        postalCode: {
            type: String,
            required: [true, "کد پستی الزامی است"],
        },
        number: {
            type: String,
            required: [true, "شماره تماس الزامی است"],
        },
        managerName: {
            type: String,
            required: [true, "نام مدیر الزامی است"],
        },
        managerNumber: {
            type: String,
            required: [true, "شماره تماس مدیر الزامی است"],
        },
        area: {
            type: Number,
            required: [true, "متراژ الزامی است"],
            min: [1, "متراژ باید مثبت باشد"],
        },
        yearBuilt: {
            type: Number,
            required: [true, "سال ساخت الزامی است"],
            min: [1300, "سال ساخت نامعتبر است"],
        },
        capacity: {
            type: Number,
            required: [true, "ظرفیت الزامی است"],
            min: [1, "ظرفیت باید حداقل 1 نفر باشد"],
        },
        maxCapacity: {
            type: Number,
            required: [true, "ظرفیت حداکثر الزامی است"],
            min: [1, "ظرفیت حداکثر باید حداقل 1 نفر باشد"],
        },
        // قیمت‌گذاری پیشرفته
        pricing: {
            regularPrice: {
                type: Number,
                required: [true, "قیمت عادی الزامی است"],
                min: [1000, "قیمت باید حداقل 1000 تومان باشد"],
            },
            weekendPrice: {
                type: Number,
                default: 0,
                min: [0, "قیمت آخر هفته نمی‌تواند منفی باشد"],
            },
            wednesdayPrice: {
                type: Number,
                default: 0,
                min: [0, "قیمت چهارشنبه نمی‌تواند منفی باشد"],
            },
            thursdayPrice: {
                type: Number,
                default: 0,
                min: [0, "قیمت پنج‌شنبه نمی‌تواند منفی باشد"],
            },
            fridayPrice: {
                type: Number,
                default: 0,
                min: [0, "قیمت جمعه نمی‌تواند منفی باشد"],
            },
            peakPrice: {
                type: Number,
                required: [true, "قیمت پیک الزامی است"],
                min: [1000, "قیمت باید حداقل 1000 تومان باشد"],
            },
            extraGuestPrice: {
                type: Number,
                default: 0,
                min: [0, "قیمت نفرات اضافه نمی‌تواند منفی باشد"],
            },
            extraGuestPeakPrice: {
                type: Number,
                default: 0,
                min: [0, "قیمت نفرات اضافه پیک نمی‌تواند منفی باشد"],
            },
            longStayDiscount: {
                type: Number,
                default: 0,
                min: [0, "تخفیف نمی‌تواند منفی باشد"],
                max: [80, "تخفیف نمی‌تواند بیشتر از 80 درصد باشد"],
            },
            discount: {
                type: Number,
                default: 0,
                min: [0, "تخفیف نمی‌تواند منفی باشد"],
                max: [80, "تخفیف نمی‌تواند بیشتر از 80 درصد باشد"],
            },
            deposit: {
                type: Number,
                default: 10,
                min: [10, "بیعانه باید حداقل 10 درصد باشد"],
                max: [80, "بیعانه نمی‌تواند بیشتر از 80 درصد باشد"],
            },
        },
        // تصاویر
        images: {
            type: [String],
            required: [true, "حداقل یک تصویر الزامی است"],
            validate: [
                {
                    validator: function (v) {
                        return v && v.length >= 1;
                    },
                    message: "حداقل یک تصویر آپلود کنید",
                },
            ],
        },
        // تصاویر 360 درجه
        images360: {
            type: [String],
            default: [],
            validate: [
                {
                    validator: function (v) {
                        return !v || v.length <= 3;
                    },
                    message: "حداکثر 3 تصویر 360 درجه مجاز است",
                },
            ],
        },
        document: {
            type: String,
            required: [true, "فیش آب یا برق الزامی است"],
        },
        nationalIdCard: {
            type: String,
            default: "",
        },
        ownershipDocument: {
            type: String,
            required: [true, "مدرک سند مالکیت الزامی است"],
        },
        type: {
            type: String,
            enum: ["villa", "apartment", "garden"],
            required: [true, "نوع ملک الزامی است"],
        },
        floorType: {
            type: String,
            enum: ["carpet", "earthenware", "stone", "other"],
            default: "carpet",
        },
        condition: {
            type: String,
            enum: ["new", "old", "renovated"],
            required: [true, "وضعیت ملک الزامی است"],
        },
        environment: {
            type: String,
            enum: ["city-center", "forest", "coastal", "desert", "historical", "rural"],
            required: [true, "بافت محیطی الزامی است"],
        },
        heating: {
            type: String,
            enum: [
                "gas-heater",
                "electric-heater",
                "radiator",
                "electric-fan",
                "fireplace",
                "fan-coil",
                "other",
            ],
            required: [true, "سیستم گرمایشی الزامی است"],
        },
        cooling: {
            type: String,
            enum: ["water-cooler", "gas-cooler", "split-unit", "ceiling-fan", "regular-fan"],
            required: [true, "سیستم سرمایشی الزامی است"],
        },
        parkingAmount: {
            type: Number,
            default: 0,
            min: [0, "تعداد پارکینگ نمی‌تواند منفی باشد"],
        },
        floor: {
            type: Number,
            default: 0,
        },
        ownerShipType: {
            type: String,
            enum: ["private", "public"],
            required: [true, "نوع مالکیت الزامی است"],
        },
        checkInTime: {
            type: String,
            required: [true, "ساعت ورود الزامی است"],
            default: "14:00",
        },
        checkOutTime: {
            type: String,
            required: [true, "ساعت خروج الزامی است"],
            default: "12:00",
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "مالک ملک الزامی است"],
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        rejectReason: {
            type: String,
            default: "",
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        reviewedAt: {
            type: Date,
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        // اتاق‌های خواب
        bedrooms: [
            {
                bedName: {
                    type: String,
                    required: [true, "نام اتاق خواب الزامی است"],
                },
                beds: {
                    single: { type: Number, default: 0, min: 0 },
                    double: { type: Number, default: 0, min: 0 },
                    sofa: { type: Number, default: 0, min: 0 },
                },
                amenities: {
                    curtain: { type: Boolean, default: false },
                    tv: { type: Boolean, default: false },
                    closet: { type: Boolean, default: false },
                    heating: {
                        type: String,
                        enum: [
                            "gas-heater",
                            "electric-heater",
                            "radiator",
                            "electric-fan",
                            "fireplace",
                            "fan-coil",
                            "other",
                        ],
                        required: true,
                    },
                    cooling: {
                        type: String,
                        enum: [
                            "water-cooler",
                            "gas-cooler",
                            "split-unit",
                            "ceiling-fan",
                            "regular-fan",
                        ],
                        required: true,
                    },
                },
            },
        ],
        // فضاهای اضافی اقامتگاه
        additionalSpaces: [
            {
                spaceName: {
                    type: String,
                    required: [true, "نام فضا الزامی است"],
                },
                spaceType: {
                    type: String,
                    enum: [
                        "living-room",
                        "kitchen",
                        "bathroom",
                        "yard",
                        "balcony",
                        "terrace",
                        "garage",
                        "storage",
                        "other",
                    ],
                    required: [true, "نوع فضا الزامی است"],
                },
                area: {
                    type: Number,
                    min: [0, "متراژ نمی‌تواند منفی باشد"],
                },
                description: {
                    type: String,
                    default: "",
                },
                amenities: [String], // امکانات این فضا
            },
        ],
        // امکانات عمومی
        facilities: [
            {
                label: String,
                value: String,
            },
        ],
        kitchenEquipment: [
            {
                label: String,
                value: String,
            },
        ],
        entertainment: [
            {
                label: String,
                value: String,
            },
        ],
        amenities: [
            {
                label: String,
                value: String,
            },
        ],
        // تاریخ‌های در دسترس
        availableDates: [
            {
                date: {
                    type: Date,
                    required: [true, "تاریخ الزامی است"],
                },
                isReserved: {
                    type: Boolean,
                    default: false,
                },
                isPeakSeason: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
        // قوانین لغو رزرو
        cancellationPolicy: {
            type: String,
            enum: ["easy", "balanced", "strict"],
            default: "balanced",
        },
        cancellationRules: {
            penalties: [
                {
                    label: { type: String, required: true },
                    minHoursBefore: { type: Number, required: true },
                    hostPenaltyPercent: { type: Number, required: true },
                    guestRefundPercent: { type: Number, required: true },
                },
            ],
        },
        // قوانین رزرو
        reservationRules: {
            minimumStay: {
                type: Number,
                default: 1,
                min: [1, "حداقل اقامت 1 شب است"],
            },
            maximumStay: {
                type: Number,
                default: 30,
                min: [1, "حداکثر اقامت باید حداقل 1 شب باشد"],
            },
            advanceBooking: {
                type: Number,
                default: 365,
                min: [1, "حداقل 1 روز قبل از تاریخ ورود قابل رزرو است"],
            },
            instantBooking: {
                type: Boolean,
                default: false,
            },
            guestRequirements: {
                type: String,
                default: "",
            },
        },
        // قوانین اقامتگاه
        propertyRules: {
            smokingAllowed: {
                type: Boolean,
                default: false,
            },
            petsAllowed: {
                type: Boolean,
                default: false,
            },
            partyAllowed: {
                type: Boolean,
                default: false,
            },
            singleGuestAllowed: {
                type: Boolean,
                default: false,
            },
            privacyDocumentRequired: {
                type: Boolean,
                default: false,
            },
        },
        // نقش در اقامتگاه
        ownerRole: {
            type: String,
            enum: ["owner", "lawyer", "agent"],
            default: "owner",
        },
        // مدارک پذیرش مهمان
        guestDocumentType: {
            type: String,
            enum: ["id-card", "marriage-certificate"],
            default: "id-card",
        },
        // آخرین روز نمایش تقویم
        calendarDisplayMonths: {
            type: Number,
            default: 1,
            min: [1, "حداقل 1 ماه"],
            max: [12, "حداکثر 12 ماه"],
        },
        // رزرو آنی
        instantBooking: {
            enabled: {
                type: Boolean,
                default: false,
            },
            dates: [
                {
                    type: Date,
                }
            ],
        },
        // تخفیف لحظه آخری
        lastMinuteDiscount: {
            enabled: {
                type: Boolean,
                default: false,
            },
            discountPercent: {
                type: Number,
                default: 0,
                min: [0, "حداقل تخفیف 0 درصد"],
                max: [100, "حداکثر تخفیف 100 درصد"],
            },
            dates: [
                {
                    type: Date,
                }
            ],
        },
        // بازه زمانی موجود بودن ملک
        availabilityStartDate: {
            type: Date,
        },
        availabilityEndDate: {
            type: Date,
        },
        // مدیریت تقویم یکپارچه
        calendarSettings: [
            {
                date: {
                    type: Date,
                    required: true,
                },
                instantBooking: {
                    type: Boolean,
                    default: false,
                },
                lastMinuteDiscount: {
                    type: Number,
                    default: 0,
                    min: 0,
                    max: 100,
                },
                blocked: {
                    type: Boolean,
                    default: false,
                },
                customPrice: {
                    type: Number,
                    min: 0,
                },
                minimumNights: {
                    type: Number,
                    min: 1,
                },
                available: {
                    type: Boolean,
                    default: true,
                },
                peak: {
                    type: Boolean,
                    default: false,
                },
            }
        ],
        // نظرات و امتیازات
        comments: [
            {
                name: String,
                text: String,
                rating: {
                    type: Number,
                    min: [1, "حداقل امتیاز 1 است"],
                    max: [5, "حداکثر امتیاز 5 است"],
                    default: 5,
                },
                reply: {
                    name: String,
                    text: String,
                },
                isApproved: { type: Boolean, default: false },
                createdAt: { type: Date, default: Date.now },
            },
        ],
        averageRating: {
            type: Number,
            default: 0,
            min: [0, "امتیاز نمی‌تواند منفی باشد"],
            max: [5, "امتیاز نمی‌تواند بیشتر از 5 باشد"],
        },
        totalReservations: {
            type: Number,
            default: 0,
            min: [0, "تعداد رزرو نمی‌تواند منفی باشد"],
        },
        // رزروها
        reservations: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Reservation",
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Virtual fields برای قیمت‌گذاری (قیمت پایه بدون کارمزد نمایش داده می‌شود)
schema.virtual("finalPricing").get(function () {
    if (this.pricing) {
        return {
            regularPrice: this.pricing.regularPrice, // قیمت نمایشی = قیمت مالک
            peakPrice: this.pricing.peakPrice, // قیمت نمایشی = قیمت مالک
            discount: this.pricing.discount,
            deposit: this.pricing.deposit,
            baseRegularPrice: this.pricing.regularPrice, // قیمت اصلی مالک
            basePeakPrice: this.pricing.peakPrice, // قیمت اصلی مالک
            commissionRate: 6, // درصد کارمزد (برای محاسبه در پرداخت)
        };
    }
    return null;
});

// Virtual field برای قیمت قدیمی (سازگاری با کد قدیمی)
schema.virtual("finalPrice").get(function () {
    // قیمت نمایشی = قیمت مالک (بدون کارمزد)
    return this.price;
});

// اضافه کردن index ها برای بهبود عملکرد
schema.index({ "address.province": 1, "address.city": 1 });
schema.index({ status: 1 });
schema.index({ type: 1 });
schema.index({ "pricing.regularPrice": 1 });
schema.index({ "pricing.peakPrice": 1 });
schema.index({ averageRating: -1 });
schema.index({ createdAt: -1 });
schema.index({ owner: 1 });
schema.index({ isAvailable: 1 });
schema.index({ "availableDates.date": 1 });

// تولید خودکار کد ملک
schema.pre("save", async function (next) {
    if (!this.propertyCode) {
        let attempts = 0;
        while (attempts < 10) {
            const lastProperty = await mongoose.models.Property
                .findOne({})
                .sort({ propertyCode: -1 })
                .select("propertyCode");

            let nextNum = 1001;
            if (lastProperty && lastProperty.propertyCode) {
                const match = lastProperty.propertyCode.match(/TG-(\d+)/);
                if (match) {
                    nextNum = parseInt(match[1], 10) + 1;
                }
            }

            const candidateCode = `TG-${String(nextNum).padStart(5, "0")}`;
            const exists = await mongoose.models.Property.exists({ propertyCode: candidateCode });
            if (!exists) {
                this.propertyCode = candidateCode;
                break;
            }
            // اگر کد تکراری بود، عدد بزرگ‌تر امتحان شود
            attempts++;
        }
    }
    next();
});

const Property = mongoose.models?.Property || mongoose.model("Property", schema);

export default Property;
