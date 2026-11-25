import { z } from "zod";

export const foodSchema = z.object({
    phone: z.string().min(11, "شماره تلفن باید حداقل ۱۱ رقم باشد"),

    address: z.object({
        province: z.string().min(1, "لطفا استان را وارد کنید"),
        city: z.string().min(1, "لطفا شهر را وارد کنید"),
        fullAddress: z.string().min(1, "لطفا آدرس کامل را وارد کنید"),
        location: z.object({
            lat: z.string().min(1, "لطفا موقعیت جغرافیایی را مشخص کنید"),
            lng: z.string().min(1, "لطفا موقعیت جغرافیایی را مشخص کنید"),
        }),
    }),

    dailyCapacity: z
        .number({ required_error: "ظرفیت پخت روزانه الزامی است" })
        .min(1, "حداقل ظرفیت ۱ پرس است"),

    foods: z
        .array(z.string().min(1, "نام غذا نمی‌تواند خالی باشد"))
        .min(1, "حداقل یک غذا باید انتخاب شود"),

    staff: z.object({
        chef: z.object({
            name: z.string().min(1, "لطفا نام سرآشپز را وارد کنید"),
        }),
        cooks: z
            .array(
                z.object({
                    name: z.string().min(1, "لطفا نام آشپز را وارد کنید"),
                })
            )
            .min(1, "حداقل یک آشپز باید وجود داشته باشد"),
    }),

    images: z.array(z.string()).min(1, "حداقل یک تصویر الزامی است"),

    pricing: z.object({
        basePrice: z
            .number({ required_error: "قیمت پایه الزامی است" })
            .min(1000, "حداقل قیمت ۱,۰۰۰ تومان است"),
        minimumOrder: z.number().min(1, "حداقل سفارش ۱ پرس است").default(1),
    }),

    workingHours: z.object({
        startTime: z.string().min(1, "ساعت شروع کار الزامی است"),
        endTime: z.string().min(1, "ساعت پایان کار الزامی است"),
        workingDays: z
            .array(
                z.enum([
                    "saturday",
                    "sunday",
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                ])
            )
            .min(1, "حداقل یک روز کاری انتخاب کنید"),
        isActive: z.boolean().default(true),
    }),

    availableDates: z
        .array(
            z.object({
                date: z.union([z.string(), z.date()]),
            })
        )
        .optional(),

    documents: z.object({
        healthCard: z.string({ required_error: "بارگذاری کارت سلامت الزامی است" }).min(1, "بارگذاری کارت سلامت الزامی است"),
    }),
});
