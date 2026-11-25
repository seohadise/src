"use server";

import connectDB from "@/config/db";
import Food from "@/models/Food";

import { getUser } from "@/lib/helpers";

export const updateFoodStatus = async ({ foodId, status, rejectReason }) => {
  const user = await getUser();

  if (!user?.isAdmin) {
    return { success: false, message: "Not allowed" };
  }

  try {
    await connectDB();

    const food = await Food.findById(foodId);

    if (!food) {
      return { success: false, message: "آشپزخانه یافت نشد" };
    }

    food.status = status;
    
    if (status === "rejected") {
      food.rejectReason = rejectReason;
    }

    await food.save();

    return {
      success: true,
      message: "وضعیت آشپزخانه با موفقیت بروزرسانی شد",
    };
  } catch (error) {
    console.error("Error updating food status:", error);
    return {
      success: false,
      message: "خطا در بروزرسانی وضعیت آشپزخانه",
    };
  }
};
