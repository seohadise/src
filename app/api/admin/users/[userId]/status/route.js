import connectDB from "@/config/db";
import User from "@/models/User";
import { getUser } from "@/lib/helpers";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  try {
    await connectDB();

    const currentUser = await getUser();
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const { userId } = params;
    const body = await request.json();
    const { action } = body; // 'approve' or 'reject'

    console.log("PATCH /api/admin/users/[userId]/status - Request data:", {
      userId,
      action,
      body
    });

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, message: "عملیات نامعتبر است" },
        { status: 400 }
      );
    }

    // بررسی وجود کاربر
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // بروزرسانی وضعیت کاربر
    const updateData = {
      isVerified: action === 'approve',
      isBanned: action === 'reject'
    };

    console.log("Update data to be applied:", updateData);

    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      updateData, 
      { 
        new: true,
        runValidators: false
      }
    );

    console.log("User status updated successfully:", {
      userId: updatedUser._id,
      isVerified: updatedUser.isVerified,
      isBanned: updatedUser.isBanned
    });

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? "کاربر با موفقیت تایید شد" : "کاربر با موفقیت رد شد",
      data: {
        _id: updatedUser._id,
        isVerified: updatedUser.isVerified,
        isBanned: updatedUser.isBanned
      },
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "خطا در بروزرسانی وضعیت کاربر", 
        error: error.message 
      },
      { status: 500 }
    );
  }
}
