"use server";

import connectDB from "@/config/db";
import Property from "@/models/Property";

import { getUser } from "@/lib/helpers";

export const updatePropertyStatus = async ({
  propertyId,
  status,
  rejectReason,
}) => {
  const user = await getUser();

  if (!user?.isAdmin) {
    return { success: false, message: "Not allowed" };
  }

  try {
    await connectDB();

    const property = await Property.findById(propertyId);

    if (!property) {
      return { success: false, message: "ملک یافت نشد" };
    }

    const updateData = { status };
    if (status === "rejected") {
      updateData.rejectReason = rejectReason;
    }

    await Property.findByIdAndUpdate(propertyId, updateData);

    return {
      success: true,
      message: "وضعیت ملک با موفقیت بروزرسانی شد",
    };
  } catch (error) {
    console.error("Error updating property status:", error);
    return {
      success: false,
      message: "خطا در بروزرسانی وضعیت ملک",
    };
  }
};
