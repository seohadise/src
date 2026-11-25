import { z } from "zod";

export const busSchema = z.object({
  vehicle: z.object({
    color: z
      .string({ required_error: "رنگ خودرو الزامی است" })
      .min(1, "لطفا رنگ خودرو را وارد کنید"),
    type: z.enum(["bus", "minibus", "van"], {
      required_error: "نوع خودرو الزامی است",
    }),
    plate: z
      .string({ required_error: "پلاک خودرو الزامی است" })
      .min(1, "لطفا پلاک خودرو را وارد کنید"),
    name: z
      .string({ required_error: "نام خودرو الزامی است" })
      .min(1, "لطفا نام خودرو را وارد کنید"),
    ownerName: z
      .string({ required_error: "نام صاحب خودرو الزامی است" })
      .min(1, "لطفا نام صاحب خودرو را وارد کنید"),
    model: z.number({ required_error: "مدل خودرو الزامی است" }),
    capacity: z
      .number({ required_error: "ظرفیت خودرو الزامی است" })
      .min(1, "حداقل ظرفیت ۱ نفر است"),
  }),

  amenities: z.object({
    heating: z.boolean(),
    cooling: z.boolean(),
  }),

  company: z.object({
    name: z
      .string({ required_error: "نام شرکت الزامی است" })
      .min(1, "لطفا نام شرکت را وارد کنید"),
  }),

  from: z.object({
    province: z
      .string({ required_error: "استان مبدا الزامی است" })
      .min(1, "لطفا استان مبدا را انتخاب کنید"),
    city: z
      .string({ required_error: "شهر مبدا الزامی است" })
      .min(1, "لطفا شهر مبدا را انتخاب کنید"),
  }),

  to: z.object({
    province: z
      .string({ required_error: "استان مقصد الزامی است" })
      .min(1, "لطفا استان مقصد را انتخاب کنید"),
    city: z
      .string({ required_error: "شهر مقصد الزامی است" })
      .min(1, "لطفا شهر مقصد را انتخاب کنید"),
  }),

  departureTime: z
    .string({ required_error: "ساعت حرکت الزامی است" })
    .min(1, "لطفا ساعت حرکت را وارد کنید"),

  arrivalTime: z
    .string({ required_error: "ساعت رسیدن الزامی است" })
    .min(1, "لطفا ساعت رسیدن را وارد کنید"),

  date: z.date({ required_error: "تاریخ سفر الزامی است" }),

  price: z
    .number({ required_error: "قیمت الزامی است" })
    .positive("قیمت باید عدد مثبت باشد"),

  images: z.array(z.string()).min(1, "حداقل یک تصویر الزامی است"),

  documents: z.object({
    driverLicense: z.string({ required_error: "بارگذاری گواهینامه الزامی است" }).min(1, "بارگذاری گواهینامه الزامی است"),
    insurance: z.string({ required_error: "بارگذاری بیمه‌نامه الزامی است" }).min(1, "بارگذاری بیمه‌نامه الزامی است"),
  }),
});
