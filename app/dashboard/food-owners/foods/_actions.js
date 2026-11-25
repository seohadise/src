"use server";

import connectDB from "@/config/db";
import Food from "@/models/Food";

import { getUser } from "@/lib/helpers";
import { foodSchema } from "@/schemas/food";

await connectDB();

export const createFood = async (data) => {
    const user = await getUser();

    if (!user || !user?.isVerified || user?.isBanned) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const safeData = foodSchema.parse(data);

        const newFood = await Food.create({
            ...safeData,
            owner: user._id,
        });

        user.foods.push(newFood._id);
        await user.save();

        return { success: true, message: "آشپزخانه با موفقیت ایجاد شد" };
    } catch (error) {
        return {
            success: false,
            message: error.message || "خطا در ایجاد آشپزخانه",
        };
    }
};

export const editFood = async (data, foodId) => {
    const user = await getUser();

    if (!user || !user?.isVerified || user?.isBanned) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const safeData = foodSchema.parse(data);

        const food = await Food.findById(foodId);

        if (!food) {
            return { success: false, message: "آشپزخانه مورد نظر یافت نشد" };
        }

        if (food.owner.toString() !== user._id.toString()) {
            return {
                success: false,
                message: "شما اجازه ویرایش این آشپزخانه را ندارید",
            };
        }

        if (food.reservations && food.reservations.length > 0) {
            return {
                success: false,
                message: `این آشپزخانه دارای ${food.reservations.length} سفارش است و قابل ویرایش نمی‌باشد`,
            };
        }

        await Food.findByIdAndUpdate(foodId, { ...safeData, status: "pending" }, { new: true });

        return {
            success: true,
            message: "آشپزخانه با موفقیت ویرایش شد",
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || "خطا در ویرایش آشپزخانه",
        };
    }
};

export const deleteFood = async (foodId) => {
    const user = await getUser();

    if (!user || !user?.isVerified || user?.isBanned) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const food = await Food.findById(foodId);

        if (!food) {
            return { success: false, message: "Not Found" };
        }

        if (food.owner.toString() !== user._id.toString()) {
            return { success: false, message: "Not Allowed" };
        }

        user.foods.pull(food._id);
        await user.save();

        await Food.findByIdAndDelete(food._id);

        return { success: true, message: "آشپزخانه با موفقیت حذف گردید" };
    } catch (error) {
        return {
            success: false,
            message: error.message || "خطایی رخ داده است",
        };
    }
};
