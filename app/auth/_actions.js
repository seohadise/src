"use server";

import connectDB from "@/config/db";
import User from "@/models/User";

import nodemailer from "nodemailer";
import meliPayamak from "@/lib/melipayamak";
import sendBaleOtp from "@/lib/bale-otp";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { sign } from "jsonwebtoken";

import { setCookieWithBrowserSupport, clearCookieWithBrowserSupport } from "@/lib/cookie-helper";

import { registerSchema, phoneSchema, completeRegistrationSchema } from "@/schemas/auth";
import { getUser } from "@/lib/helpers";

await connectDB();

export const sendOtp = async (data) => {
    try {
        const safeData = phoneSchema.parse(data);

        const existingUser = await User.findOne({ number: safeData.number });

        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        try {
            const sms = meliPayamak.sms();
            await sms.sendByBaseNumber(otp, safeData.number, 314582);
        } catch {
            return { success: false, message: "خطا در ارسال کد تایید" };
        }

        sendBaleOtp(otp, safeData.number).catch(() => {});

        if (existingUser) {
            existingUser.otp = otp;
            await existingUser.save();
        } else {
            const usersCount = await User.countDocuments();
            await User.create({
                number: safeData.number,
                otp,
                type: "customer",
                isAdmin: usersCount === 0,
            });
        }

        return {
            success: true,
            message: "کد تایید به شماره موبایل شما ارسال شد",
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || "خطایی رخ داده است",
        };
    }
};

export const verifyOtpAndLogin = async (data) => {
    try {
        const { number, otp } = data;

        const user = await User.findOne({ number, otp });

        if (!user) {
            return { success: false, message: "کد تایید نامعتبر است" };
        }

        if (!user.isVerified) {
            user.isVerified = true;
        }

        user.otp = "";
        await user.save();

        const isNewUser = !user.fullName || user.fullName.length < 3;

        const cookiesStore = await cookies();
        const token = sign(
            { id: user?._id, type: user?.type, isAdmin: user?.isAdmin || false, reg: isNewUser },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );
        setCookieWithBrowserSupport(cookiesStore, "token", token);
        revalidatePath("/", "layout");

        return {
            success: true,
            message: isNewUser
                ? "کد تایید شد. لطفا اطلاعات خود را تکمیل کنید"
                : "با موفقیت وارد شدید",
            isNewUser,
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || "خطایی رخ داده است",
        };
    }
};

export const completeRegistration = async (data) => {
    try {
        const user = await getUser();

        if (!user) {
            return { success: false, message: "کاربری یافت نشد" };
        }

        const safeData = completeRegistrationSchema.parse(data);

        user.fullName = safeData.fullName;
        user.type = safeData.type;
        await user.save();

        const cookiesStore = await cookies();
        const token = sign(
            { id: user?._id, type: user?.type, isAdmin: user?.isAdmin || false },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );
        setCookieWithBrowserSupport(cookiesStore, "token", token);
        revalidatePath("/", "layout");

        return {
            success: true,
            message: "ثبت نام شما با موفقیت تکمیل شد",
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || "خطایی رخ داده است",
        };
    }
};

export const register = async (data) => {
    try {
        const safeData = registerSchema.parse(data);

        const existingUser = await User.findOne({
            $or: [
                { email: safeData.email },
                { username: safeData.username },
                { number: safeData.number },
            ],
        });

        if (existingUser) {
            if (existingUser.email === safeData.email) {
                return { success: false, message: "این ایمیل قبلا ثبت شده است" };
            }
            if (existingUser.username === safeData.username) {
                return { success: false, message: "این نام کاربری قبلا ثبت شده است" };
            }
            if (existingUser.number === safeData.number) {
                return { success: false, message: "این شماره تلفن قبلا ثبت شده است" };
            }
        }

        // random 4 digit number
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        try {
            const sms = meliPayamak.sms();
            await sms.sendByBaseNumber(otp, safeData.number, 314582);
        } catch {
            return { success: false, message: "خطا در ارسال کد تایید " };
        }

        sendBaleOtp(otp, safeData.number).catch(() => {});

        const usersCount = await User.countDocuments();

        // making first user as an admin
        await User.create({
            ...safeData,
            otp,
            isAdmin: usersCount === 0,
        });

        return {
            success: true,
            message: "کد تایید به شماره تلفن شما ارسال شد",
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || "خطایی رخ داده است",
        };
    }
};

export const login = async (data) => {
    const cookiesStore = await cookies();

    try {
        await connectDB();

        const { identifier, password } = data;

        console.log("Login attempt for:", identifier);

        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }, { number: identifier }],
        });

        if (!user) {
            console.log("User not found");
            return { success: false, message: "کاربر یافت نشد" };
        }

        if (!user.isVerified) {
            console.log("User not verified");
            return { success: false, message: "حساب کاربری شما هنوز تایید نشده است" };
        }

        if (user.isBanned) {
            console.log("User is banned");
            return { success: false, message: "حساب کاربری مسدود گردیده است" };
        }

        const isValidPassword = await user.comparePassword(password);

        if (!isValidPassword) {
            console.log("Invalid password");
            return { success: false, message: "نام کاربری یا رمز عبور اشتباه است" };
        }

        const token = sign({ id: user?._id, type: user?.type, isAdmin: user?.isAdmin || false }, process.env.JWT_SECRET, {
            expiresIn: "30d",
        });

        console.log("Token generated, setting cookie...");

        // استفاده از تابع کمکی برای تنظیم کوکی با سازگاری بالا با تمام مرورگرها
        setCookieWithBrowserSupport(cookiesStore, "token", token);

        console.log("Cookie set successfully");

        // Invalidate all cached RSC pages so the new user's data is fetched fresh
        revalidatePath("/", "layout");

        return {
            success: true,
            message: "با موفقیت وارد شدید",
        };
    } catch (error) {
        console.error("Login error:", error);
        return {
            success: false,
            message: error.message || "خطایی رخ داده است",
        };
    }
};

export const forgotPassword = async (data) => {
    try {
        const { identifier } = data;

        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }, { number: identifier }],
        });

        if (!user) {
            return { success: false, message: "کاربری یافت نشد" };
        }

        if (!user.isVerified) {
            return { success: false, message: "حساب کاربری شما هنوز تایید نشده است" };
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        try {
            const sms = meliPayamak.sms();

            await sms.sendByBaseNumber(otp, user.number, 314582);
        } catch (error) {
            return { success: false, message: "خطا در ارسال کد" };
        }

        sendBaleOtp(otp, user.number).catch(() => {});

        user.otp = otp;
        await user.save();

        return {
            success: true,
            message: "کد با موفقیت ارسال شد",
            number: user.number,
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || "خطایی رخ داده است",
        };
    }
};

export const verifyOtp = async (data) => {
    try {
        const { identifier, otp } = data;

        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }, { number: identifier }],
            otp,
        });

        if (!user) {
            return { success: false, message: "کد تایید نامعتبر است" };
        }

        if (!user.isVerified) {
            user.isVerified = true;
        }

        user.otp = "";

        await user.save();

        const cookiesStore = await cookies();
        const token = sign({ id: user?._id, type: user?.type, isAdmin: user?.isAdmin || false }, process.env.JWT_SECRET, {
            expiresIn: "30d",
        });
        setCookieWithBrowserSupport(cookiesStore, "token", token);
        revalidatePath("/", "layout");

        return {
            success: true,
            message: "حساب کاربری شما با موفقیت تایید شد",
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || "خطایی رخ داده است",
        };
    }
};

export const resetPassword = async (data) => {
    try {
        const { identifier, password } = data;
        console.log("[resetPassword] Called with:", { identifier, passwordLength: password?.length });

        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }, { number: identifier }],
        });

        console.log("[resetPassword] User found:", user ? user._id : "null");

        if (!user) {
            return { success: false, message: "کد تایید نامعتبر است" };
        }

        if (!user.isVerified) {
            return { success: false, message: "حساب کاربری شما هنوز تایید نشده است" };
        }

        user.password = password;
        user.otp = "";
        await user.save();

        console.log("[resetPassword] Password saved successfully");

        return {
            success: true,
            message: "رمز عبور با موفقیت تغییر کرد",
        };
    } catch (error) {
        console.error("[resetPassword] Error:", error.message, error.stack);
        return {
            success: false,
            message: error.message || "خطایی رخ داده است",
        };
    }
};

export const verifyEmail = async () => {
    const user = await getUser();

    if (!user) {
        return { success: false, message: "کاربری یافت نشد" };
    }

    if (user.emailVerifiedAt) {
        return { success: true, message: "ایمیل کاربر از قبل تایید شده است" };
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            secure: process.env.MAIL_PORT == 465, // true برای پورت 465
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASSWORD,
            },
            tls: {
                // این گزینه به صورت موقت برای رد شدن از خطاهای SSL اضافه شده است.
                // هشدار: این گزینه نباید در حالت نهایی روی سرور باقی بماند.
                rejectUnauthorized: false,
            },
            debug: true, // این گزینه تمام مکالمات با سرور ایمیل را لاگ می‌کند
        });

        const token = sign({ email: user.email }, process.env.JWT_SECRET, {
            expiresIn: "10m",
        });

        await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to: user.email,
            subject: "تایید ایمیل کاربری",
            html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>تایید ایمیل</h2>
          <p>سلام ${user.fullName}،</p>
          <p>برای تایید ایمیل خود روی لینک زیر کلیک کنید:</p>
          <a 
            href="${process.env.BASE_URL}/auth/verify-email?token=${token}" 
            style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;"
          >
            تایید ایمیل
          </a>
          <p>این لینک تا ۱۰ دقیقه معتبر است.</p>
        </div>
      `,
        });

        return { success: true, message: "ایمیل تایید با موفقیت ارسال شد" };
    } catch (error) {
        console.error("خطا در ارسال ایمیل:", error);
        return {
            success: false,
            message: error.message || "خطا در ارسال ایمیل",
        };
    }
};

export const logout = async () => {
    const cookiesStore = await cookies();

    // استفاده از تابع کمکی برای حذف کوکی با تنظیمات صحیح
    clearCookieWithBrowserSupport(cookiesStore, "token");

    // Invalidate all cached RSC pages so the previous user's data is purged
    revalidatePath("/", "layout");

    return { success: true, message: "عملیات با موفقیت انجام شد" };
};
