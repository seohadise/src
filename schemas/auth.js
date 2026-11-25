import { z } from "zod";

export const phoneSchema = z.object({
  number: z
    .string({ required_error: "شماره موبایل ضروری است" })
    .min(1, "شماره موبایل ضروری است")
    .regex(/^09[0-9]{9}$/, "شماره موبایل باید با 09 شروع شده و ۱۱ رقم باشد"),
});

export const otpSchema = z.object({
  number: z
    .string()
    .regex(/^09[0-9]{9}$/, "شماره موبایل نامعتبر است"),
  otp: z
    .string()
    .min(4, "کد تایید باید ۴ رقم باشد")
    .max(4, "کد تایید باید ۴ رقم باشد"),
});

export const completeRegistrationSchema = z.object({
  fullName: z
    .string({ required_error: "نام و نام خانوادگی ضروری است" })
    .min(3, "نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد")
    .trim(),
  type: z.enum(["property-owner", "bus-owner", "food-owner", "customer"], {
    invalid_type_error: "نوع کاربری نامعتبر است",
  }),
});

export const registerSchema = z
  .object({
    fullName: z
      .string({ required_error: "نام و نام خانوادگی ضروری است" })
      .min(3, "نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد")
      .trim(),

    username: z
      .string({ required_error: "نام کاربری ضروری است" })
      .min(3, "نام کاربری باید حداقل ۳ کاراکتر باشد")
      .max(15, "نام کاربری باید کمتر از ۱۵ کاراکتر باشد")
      .regex(
        /^[a-z0-9_-]{3,15}$/,
        "نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد، خط تیره و زیرخط باشد"
      )
      .toLowerCase()
      .trim(),

    number: z
      .string({ required_error: "شماره تلفن ضروری است" })
      .min(1, "شماره تلفن ضروری است")
      .regex(/^([0-9\s\-\+\(\)]*)$/, "شماره تلفن معتبر نمیباشد"),

    email: z
      .string()
      .email("لطفاً یک ایمیل معتبر وارد کنید")
      .toLowerCase()
      .trim(),

    type: z.enum(["property-owner", "bus-owner", "food-owner", "customer"], {
      invalid_type_error: "نوع کاربری نامعتبر است",
    }),

    password: z
      .string({ required_error: "رمز عبور ضروری است" })
      .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")
      .regex(
        /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/,
        "رمز عبور باید شامل حداقل یک حرف بزرگ، یک حرف کوچک، یک عدد و یک کاراکتر خاص باشد"
      ),

    confirmPassword: z.string({
      required_error: "تکرار رمز عبور ضروری است",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "رمز عبور و تکرار آن یکسان نیستند",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "شماره تلفن ، نام کاربری یا ایمیل ضروریست")
    .trim(),

  password: z
    .string({ required_error: "رمز عبور ضروری است" })
    .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")
    .regex(
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/,
      "رمز عبور باید شامل حداقل یک حرف بزرگ، یک حرف کوچک، یک عدد و یک کاراکتر خاص باشد"
    ),
});

export const forgotSchema = z.object({
  identifier: z
    .string()
    .min(1, "شماره تلفن ، نام کاربری یا ایمیل ضروریست")
    .trim(),
});

export const resetSchema = z
  .object({
    password: z
      .string({ required_error: "رمز عبور ضروری است" })
      .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")
      .regex(
        /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/,
        "رمز عبور باید شامل حداقل یک حرف بزرگ، یک حرف کوچک، یک عدد و یک کاراکتر خاص باشد"
      ),
    confirmPassword: z.string({
      required_error: "تکرار رمز عبور ضروری است",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "رمز عبور و تکرار آن یکسان نیستند",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "رمز عبور فعلی الزامی است")
      .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد"),
    newPassword: z
      .string()
      .min(1, "رمز عبور جدید الزامی است")
      .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد"),
    confirmPassword: z.string().min(1, "تکرار رمز عبور الزامی است"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "رمز عبور و تکرار آن یکسان نیستند",
    path: ["confirmPassword"],
  });
