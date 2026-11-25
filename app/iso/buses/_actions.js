"use server";

import connectDB from "@/config/db";
import Bus from "@/models/Bus";

import { getUser } from "@/lib/helpers";

export const updateBusStatus = async ({ busId, status, rejectReason }) => {
  const user = await getUser();

  if (!user?.isAdmin) {
    return { success: false, message: "Not allowed" };
  }

  try {
    await connectDB();

    const bus = await Bus.findById(busId);

    if (!bus) {
      return { success: false, message: "وسیله نقلیه یافت نشد" };
    }

    bus.status = status;

    if (status === "rejected") {
      bus.rejectReason = rejectReason;
    }

    await bus.save();

    return {
      success: true,
      message: "وضعیت وسیله نقلیه با موفقیت بروزرسانی شد",
    };
  } catch (error) {
    console.error("Error updating bus status:", error);
    return {
      success: false,
      message: "خطا در بروزرسانی وضعیت وسیله نقلیه",
    };
  }
};
