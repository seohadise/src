"use server";

// NOTE: shared actions goes here

import connectDB from "@/config/db";
import Transaction from "@/models/Transaction";
import Food from "@/models/Food";
import Bus from "@/models/Bus";
import Property from "@/models/Property";
import WithdrawalRequest from "@/models/WithdrawalRequest";
import User from "@/models/User";

import { getUser } from "@/lib/helpers";
import { profileSchema } from "@/schemas/user";
import { sendWithdrawalNotificationToAdmin } from "@/lib/sms-service";

await connectDB();

export const createComment = async (data, type) => {
    const user = await getUser();

    if (!user || !user.isVerified || user?.isBanned) {
        return { success: false, message: "Not allowed" };
    }

    try {
        let model;

        switch (type) {
            case "bus":
                model = await Bus.findById(data.itemId);
                break;
            case "property":
                model = await Property.findById(data.itemId);
                break;
            case "food":
                model = await Food.findById(data.itemId);
                break;
            default:
                return { success: false, message: "Invalid type" };
        }

        if (!model) {
            return { success: false, message: "Item not found" };
        }

        // اضافه کردن نظر جدید به آرایه نظرات
        // نظر پیش‌فرض تایید نشده است و باید توسط مدیر تایید شود
        const newComment = {
            name: data.name,
            text: data.text,
            rating: data.rating,
            isApproved: false,
            createdAt: new Date(),
        };

        // بروزرسانی مستقیم فیلد comments بدون validation کل مدل
        let updateResult;
        switch (type) {
            case "bus":
                updateResult = await Bus.updateOne(
                    { _id: data.itemId },
                    { $push: { comments: newComment } }
                );
                break;
            case "property":
                updateResult = await Property.updateOne(
                    { _id: data.itemId },
                    { $push: { comments: newComment } }
                );
                break;
            case "food":
                updateResult = await Food.updateOne(
                    { _id: data.itemId },
                    { $push: { comments: newComment } }
                );
                break;
        }

        return {
            success: true,
            message: "نظر شما با موفقیت ثبت شد و پس از تایید مدیر نمایش داده خواهد شد",
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || "خطا در ثبت نظر",
        };
    }
};

export const createCommentReply = async (data, type) => {
    const user = await getUser();

    if (!user || !user.isVerified || user?.isBanned) {
        return { success: false, message: "Not allowed" };
    }

    try {
        let model;

        switch (type) {
            case "bus":
                model = await Bus.findById(data.itemId);
                break;
            case "property":
                model = await Property.findById(data.itemId);
                break;
            case "food":
                model = await Food.findById(data.itemId);
                break;
            default:
                return { success: false, message: "Invalid type" };
        }

        if (!model) {
            return { success: false, message: "Item not found" };
        }

        // پیدا کردن نظر و بروزرسانی پاسخ آن
        const replyData = {
            name: user.fullName,
            text: data.replyText,
        };

        // بروزرسانی مستقیم پاسخ نظر بدون validation کل مدل
        let updateResult;
        switch (type) {
            case "bus":
                updateResult = await Bus.updateOne(
                    { _id: data.itemId, "comments._id": data.commentId },
                    { $set: { "comments.$.reply": replyData } }
                );
                break;
            case "property":
                updateResult = await Property.updateOne(
                    { _id: data.itemId, "comments._id": data.commentId },
                    { $set: { "comments.$.reply": replyData } }
                );
                break;
            case "food":
                updateResult = await Food.updateOne(
                    { _id: data.itemId, "comments._id": data.commentId },
                    { $set: { "comments.$.reply": replyData } }
                );
                break;
        }

        if (updateResult.matchedCount === 0) {
            return { success: false, message: "Comment not found" };
        }

        return {
            success: true,
            message: "پاسخ شما با موفقیت ثبت شد",
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || "خطا در ثبت پاسخ",
        };
    }
};

export const createWithdrawalRequest = async (amount = null) => {
    try {
        await connectDB();
        const user = await getUser();

        if (!user || user?.isBanned || !user?.isVerified) {
            return { success: false, message: "دسترسی غیر مجاز" };
        }

        // بررسی اطلاعات بانکی
        const bankInfo = user.bankInfo || {};
        if (
            !bankInfo.accountNumber ||
            !bankInfo.shebaNumber ||
            !bankInfo.cardNumber ||
            !bankInfo.ownerName
        ) {
            return {
                success: false,
                message: "لطفا ابتدا اطلاعات بانکی خود را در صفحه پروفایل تکمیل کنید",
            };
        }

        const userBalance = user.wallet?.balance || 0;

        // اگر موجودی کاربر کمتر از 1000 تومان است
        if (userBalance < 1000) {
            return {
                success: false,
                message: "حداقل میزان برداشت 1 هزار تومان میباشد",
            };
        }

        const requestAmount = amount || userBalance;

        if (requestAmount < 1000) {
            return {
                success: false,
                message: "حداقل میزان برداشت 1 هزار تومان میباشد",
            };
        }

        if (requestAmount > userBalance) {
            return {
                success: false,
                message: "مبلغ درخواستی بیشتر از موجودی شما است",
            };
        }

        // بررسی درخواست‌های در انتظار
        const pendingRequest = await WithdrawalRequest.findOne({
            user: user._id,
            status: "pending",
        });

        if (pendingRequest) {
            return {
                success: false,
                message: "شما یک درخواست برداشت در انتظار دارید",
            };
        }

        // ایجاد درخواست برداشت جدید
        const withdrawalRequest = await WithdrawalRequest.create({
            user: user._id,
            amount: requestAmount,
            bankInfo: {
                shebaNumber: bankInfo.shebaNumber,
                accountNumber: bankInfo.accountNumber,
                cardNumber: bankInfo.cardNumber,
                ownerName: bankInfo.ownerName,
            },
            status: "pending",
        });

        // کسر فوری موجودی از کیف پول کاربر (hold)
        await User.findByIdAndUpdate(user._id, {
            $inc: { "wallet.balance": -requestAmount },
        });

        // ایجاد تراکنش در حالت pending
        await Transaction.create({
            user: user._id,
            amount: requestAmount,
            type: "withdraw",
            description: `درخواست برداشت وجه - ${requestAmount.toLocaleString("fa-IR")} تومان`,
            status: "pending",
            relatedModel: "WithdrawalRequest",
            relatedId: withdrawalRequest._id,
        });

        // اطلاع‌رسانی به مدیر از طریق پیامک
        sendWithdrawalNotificationToAdmin(
            user.fullName || user.username || "کاربر",
            requestAmount,
            user.type
        ).catch((err) => console.error("[withdrawal] SMS notification failed:", err.message));

        return {
            success: true,
            message: "درخواست برداشت شما با موفقیت ثبت شد و در انتظار بررسی است",
            data: withdrawalRequest,
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || "خطا در ایجاد درخواست برداشت",
        };
    }
};

export const updateProfile = async (data) => {
    const user = await getUser();

    if (!user || !user.isVerified) {
        return { success: false, message: "Not allowed" };
    }

    try {
        const safeData = profileSchema.parse(data);

        user.fullName = safeData.fullName;
        user.email = safeData.email || undefined;
        user.gender = safeData.gender;
        user.phone = safeData.phone;
        user.birthDate = safeData.birthDate;
        user.province = safeData.province;
        user.city = safeData.city;
        if (safeData.avatar !== undefined) {
            user.avatar = safeData.avatar;
        }
        user.bankInfo = {
            accountNumber: safeData.bankInfo.accountNumber,
            shebaNumber: safeData.bankInfo.shebaNumber,
            cardNumber: safeData.bankInfo.cardNumber,
            ownerName: safeData.bankInfo.ownerName,
        };

        await user.save();

        return {
            success: true,
            message: "اطلاعات پروفایل با موفقیت بروزرسانی شد",
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || "خطا در بروزرسانی اطلاعات",
        };
    }
};

export const changePassword = async (data) => {
    const user = await getUser();

    if (!user) {
        return { success: false, message: "دسترسی غیر مجاز" };
    }

    try {
        const isValid = await user.comparePassword(data.currentPassword);

        if (!isValid) {
            return { success: false, message: "رمز عبور فعلی اشتباه است" };
        }

        user.password = data.newPassword;

        await user.save();

        return { success: true, message: "رمز عبور با موفقیت تغییر کرد" };
    } catch (error) {
        return {
            success: false,
            message: error.message || "خطا در تغییر رمز عبور",
        };
    }
};
