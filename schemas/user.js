import { z } from "zod";

export const profileSchema = z.object({
  image: z.string().optional(),

  avatar: z.string().optional(),

  fullName: z
    .string()
    .min(3, "نام و نام خانوادگی باید حداقل ۳ حرف باشد")
    .max(50, "نام و نام خانوادگی نمیتواند بیشتر از ۵۰ حرف باشد"),

  email: z
    .string()
    .email("لطفاً یک ایمیل معتبر وارد کنید")
    .toLowerCase()
    .trim()
    .optional()
    .or(z.literal("")),

  province: z.string({ required_error: "انتخاب استان الزامی است" }),
  city: z.string({ required_error: "انتخاب شهر الزامی است" }),

  gender: z.enum(["male", "female"], {
    required_error: "انتخاب جنسیت الزامی است",
  }),

  phone: z
    .string()
    .min(8, "شماره تلفن باید حداقل ۸ رقم باشد")
    .max(11, "شماره تلفن نمیتواند بیشتر از ۱۱ رقم باشد")
    .regex(/^[0-9]+$/, "شماره تلفن فقط میتواند شامل اعداد باشد"),

  birthDate: z.date({
    required_error: "انتخاب تاریخ تولد الزامی است",
  }),

  bankInfo: z.object({
    shebaNumber: z.string().length(24, "شماره شبا باید ۲۴ رقم باشد"),
    accountNumber: z
      .string()
      .min(5, "شماره حساب باید حداقل ۵ رقم باشد")
      .max(16, "شماره حساب نمیتواند بیشتر از ۱۶ رقم باشد")
      .regex(/^[0-9]+$/, "شماره حساب فقط میتواند شامل اعداد باشد"),
    cardNumber: z
      .string()
      .length(16, "شماره کارت باید ۱۶ رقم باشد")
      .regex(/^[0-9]{16}$/, "شماره کارت فقط میتواند شامل اعداد باشد"),
    ownerName: z
      .string()
      .min(5, "نام و نام خانوادگی صاحب حساب حداقل 5 کلمه باید باشد"),
  }),
});
