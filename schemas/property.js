import { z } from "zod";

export const propertySchema = z.object({
    name: z.string().min(1, "نام ملک الزامیست"),
    address: z.object({
        province: z.string({ required_error: "استان الزامیست" }).min(1, "استان الزامیست"),
        city: z.string({ required_error: "شهر الزامیست" }).min(1, "شهر الزامیست"),
        fullAddress: z.string().min(1, "آدرس کامل الزامیست"),
        location: z.object({
            lat: z.string({ required_error: "موقعیت دقیق الزامیست" }).min(1, "موقعیت دقیق الزامیست"),
            lng: z.string().min(1, "موقعیت دقیق الزامیست"),
        }),
    }),
    postalCode: z.string().min(1, "کد پستی ملک الزامیست"),
    number: z.string().min(1, "شماره تماس الزامیست"),
    managerName: z.string().min(1, "نام مدیر الزامیست"),
    managerNumber: z.string().min(1, "شماره تماس مدیر الزامیست"),
    area: z.number().min(1, "متراژ باید حداقل ۱ باشد"),
    description: z.string().min(1, "توضیحات اقامتگاه الزامیست"),
    rules: z.string().min(1, "قوانین اقامتگاه الزامیست"),
    bedrooms: z
        .array(
            z.object({
                bedName: z.string().min(1, "نام اتاق خواب الزامیست"),
                beds: z
                    .object({
                        single: z.number().min(0).default(0),
                        double: z.number().min(0).default(0),
                        sofa: z.number().min(0).default(0),
                    })
                    .refine((beds) => beds.single + beds.double + beds.sofa > 0, {
                        message: "حداقل یک تخت باید انتخاب شود",
                    }),
                amenities: z.object({
                    curtain: z.boolean().default(false),
                    tv: z.boolean().default(false),
                    closet: z.boolean().default(false),
                    heating: z.enum(
                        [
                            "gas-heater",
                            "electric-heater",
                            "radiator",
                            "electric-fan",
                            "fireplace",
                            "fan-coil",
                            "other",
                        ],
                        { required_error: "انتخاب سیستم گرمایشی الزامیست" }
                    ),
                    cooling: z.enum(
                        ["water-cooler", "gas-cooler", "split-unit", "ceiling-fan", "regular-fan"],
                        { required_error: "انتخاب سیستم سرمایشی الزامیست" }
                    ),
                }),
            })
        )
        .min(1, "حداقل یک اتاق خواب الزامیست"),
    yearBuilt: z
        .number()
        .min(1300, "سال ساخت نامعتبر است")
        .max(new Date().getFullYear(), "سال ساخت نامعتبر است"),
    capacity: z.number().min(1, "ظرفیت باید حداقل ۱ باشد"),
    maxCapacity: z.number().min(1, "ظرفیت حداکثر باید حداقل ۱ باشد"),
    availableDates: z.array(
        z.object({
            date: z.union([z.string(), z.date()]),
        })
    ).optional().default([]),
    images: z.array(z.string()).min(5, "حداقل 5 تصویر الزامیست"),
    images360: z.array(z.string()).min(1, "حداقل یک تصویر 360 درجه الزامیست").max(3, "حداکثر 3 تصویر 360 درجه مجاز است"),
    ownershipDocument: z.string().min(1, "مدرک سند مالکیت الزامیست"),
    checkInTime: z.string().min(1, "ساعت ورود الزامیست"),
    checkOutTime: z.string().min(1, "ساعت خروج الزامیست"),
    type: z.enum(["villa", "apartment", "garden"]),
    floorType: z.enum(["carpet", "earthenware", "stone", "other"], { required_error: "نوع کف الزامیست" }),
    condition: z.enum(["new", "old", "renovated"]),
    facilities: z.array(
        z.object({
            label: z.string(),
            value: z.string(),
        })
    ).min(1, "حداقل یک امکان رفاهی الزامیست"),
    kitchenEquipment: z.array(
        z.object({
            label: z.string(),
            value: z.string(),
        })
    ).min(1, "حداقل یک تجهیز آشپزخانه الزامیست"),
    entertainment: z.array(
        z.object({
            label: z.string(),
            value: z.string(),
        })
    ).min(1, "حداقل یک امکان سرگرمی الزامیست"),
    amenities: z.array(
        z.object({
            label: z.string(),
            value: z.string(),
        })
    ).min(1, "حداقل یک امکانات الزامیست"),
    environment: z.enum(["city-center", "forest", "coastal", "desert", "historical", "rural"]),
    heating: z.enum([
        "gas-heater",
        "electric-heater",
        "radiator",
        "electric-fan",
        "fireplace",
        "fan-coil",
        "other",
    ]),
    cooling: z.enum(["water-cooler", "gas-cooler", "split-unit", "ceiling-fan", "regular-fan"]),
    parkingAmount: z.number().min(0, "تعداد پارکینگ نمیتواند منفی باشد"),
    floor: z.number(),
    document: z.string().min(1, "فیش آب یا برق ملک الزامیست"),
    nationalIdCard: z.string().min(1, "بارگذاری کارت ملی الزامیست"),
    // قیمت‌گذاری پیشرفته
    pricing: z.object({
        regularPrice: z.number().positive("قیمت عادی باید عدد مثبت باشد"),
        weekendPrice: z.number().min(0, "قیمت آخر هفته نمی‌تواند منفی باشد"),
        wednesdayPrice: z.number().min(0, "قیمت چهارشنبه نمی‌تواند منفی باشد").default(0),
        thursdayPrice: z.number().min(0, "قیمت پنج‌شنبه نمی‌تواند منفی باشد").default(0),
        fridayPrice: z.number().min(0, "قیمت جمعه نمی‌تواند منفی باشد").default(0),
        peakPrice: z.number().positive("قیمت پیک باید عدد مثبت باشد"),
        extraGuestPrice: z.number().min(0, "قیمت نفرات اضافه نمیتواند منفی باشد").default(0),
        extraGuestPeakPrice: z.number().min(0, "قیمت نفرات اضافه پیک نمیتواند منفی باشد").default(0),
        longStayDiscount: z
            .number()
            .min(0, "تخفیف نمیتواند منفی باشد")
            .max(80, "تخفیف نمیتواند بیشتر از 80 درصد باشد")
            .default(0),
        discount: z
            .number()
            .min(0, "تخفیف نمیتواند منفی باشد")
            .max(80, "تخفیف نمیتواند بیشتر از 80 درصد باشد")
            .default(0),
        deposit: z
            .number()
            .min(10, "بیعانه باید حداقل ۱۰ درصد باشد")
            .max(80, "بیعانه نمیتواند بیشتر از ۸۰ درصد باشد")
            .default(10),
    }),
    ownerShipType: z.enum(["private", "public"]),
    // فضاهای اضافی
    additionalSpaces: z
        .array(
            z.object({
                spaceName: z.string().min(1, "نام فضا الزامیست"),
                spaceType: z.enum([
                    "living-room",
                    "kitchen",
                    "bathroom",
                    "yard",
                    "balcony",
                    "terrace",
                    "garage",
                    "storage",
                    "other",
                ]),
                area: z.number().min(0, "متراژ نمیتواند منفی باشد").optional(),
                description: z.string().optional(),
                amenities: z.array(z.string()).optional(),
            })
        )
        .min(1, "حداقل یک فضای اضافی الزامیست"),
    // قوانین لغو و رزرو
    cancellationPolicy: z
        .enum(["easy", "balanced", "strict"])
        .default("balanced"),
    cancellationRules: z
        .object({
            penalties: z.array(
                z.object({
                    label: z.string(),
                    minHoursBefore: z.number(),
                    hostPenaltyPercent: z.number(),
                    guestRefundPercent: z.number(),
                })
            ),
        })
        .optional(),
    reservationRules: z
        .object({
            minimumStay: z.number().min(1, "حداقل اقامت 1 شب است").default(1),
            maximumStay: z.number().min(1, "حداکثر اقامت باید حداقل 1 شب باشد").default(30),
            advanceBooking: z
                .number()
                .min(1, "حداقل 1 روز قبل از تاریخ ورود قابل رزرو است")
                .default(365),
            instantBooking: z.boolean().default(false),
            guestRequirements: z.string().optional(),
        }),
    // قوانین اقامتگاه
    propertyRules: z.object({
        smokingAllowed: z.boolean().default(false),
        petsAllowed: z.boolean().default(false),
        partyAllowed: z.boolean().default(false),
        singleGuestAllowed: z.boolean().default(false),
        privacyDocumentRequired: z.boolean().default(false),
    }).refine(
        (rules) => rules.smokingAllowed || rules.petsAllowed || rules.partyAllowed || rules.singleGuestAllowed || rules.privacyDocumentRequired,
        { message: "حداقل یک قانون اقامتگاه باید انتخاب شود" }
    ),
    // نقش در اقامتگاه
    ownerRole: z.enum(["owner", "lawyer", "agent"]).default("owner"),
    // مدارک پذیرش مهمان
    guestDocumentType: z.enum(["id-card", "marriage-certificate"]).default("id-card"),
    // آخرین روز نمایش تقویم
    calendarDisplayMonths: z.number().min(1).max(12).default(1),
    // رزرو آنی
    instantBooking: z.object({
        enabled: z.boolean().default(false),
        dates: z.array(z.string()).optional(), // آرایه‌ای از تاریخ‌ها به فرمت ISO
    }).optional(),
    // تخفیف لحظه آخری
    lastMinuteDiscount: z.object({
        enabled: z.boolean().default(false),
        discountPercent: z.number().min(0).max(100).default(0),
        dates: z.array(z.string()).optional(), // آرایه‌ای از تاریخ‌ها به فرمت ISO
    }).optional(),
    // مدیریت تقویم یکپارچه - برای ذخیره تنظیمات هر روز
    calendarSettings: z.array(z.object({
        date: z.string(), // تاریخ به فرمت ISO
        instantBooking: z.boolean().default(false), // رزرو آنی
        lastMinuteDiscount: z.number().min(0).max(100).default(0), // درصد تخفیف لحظه آخری
        blocked: z.boolean().default(false), // بلاک شده (غیرقابل رزرو)
        customPrice: z.number().optional(), // قیمت سفارشی برای این روز
        minimumNights: z.number().min(1).optional(), // حداقل تعداد شب برای رزرو
        available: z.boolean().default(true), // در دسترس بودن (پر یا خالی)
        peak: z.boolean().default(false), // روز پیک
    })).min(1, "حداقل یک روز باید در تقویم ثبت شود"),
    // بازه زمانی موجود بودن ملک
    availabilityStartDate: z.union([z.string(), z.date()]).refine(
        (val) => {
            if (!val) return false;
            const d = new Date(val);
            return !isNaN(d.getTime());
        },
        { message: "تاریخ شروع موجود بودن ملک الزامیست" }
    ),
    availabilityEndDate: z.union([z.string(), z.date()]).refine(
        (val) => {
            if (!val) return false;
            const d = new Date(val);
            return !isNaN(d.getTime());
        },
        { message: "تاریخ پایان موجود بودن ملک الزامیست" }
    ),
}).refine(
    (data) => {
        if (data.availabilityStartDate && data.availabilityEndDate) {
            return new Date(data.availabilityStartDate) <= new Date(data.availabilityEndDate);
        }
        return true;
    },
    { message: "تاریخ پایان باید بعد از تاریخ شروع باشد", path: ["availabilityEndDate"] }
);
