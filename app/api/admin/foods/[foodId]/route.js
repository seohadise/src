import connectDB from "@/config/db";
import Food from "@/models/Food";
import { getUser } from "@/lib/helpers";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
    await connectDB();

    const currentUser = await getUser();
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const { foodId } = params;
    const body = await request.json();
    const { phone, dailyCapacity, description } = body;

    // بررسی وجود غذا
    const food = await Food.findById(foodId);
    if (!food) {
      return NextResponse.json(
        { success: false, message: "آشپزخانه یافت نشد" },
        { status: 404 }
      );
    }

    // بروزرسانی اطلاعات غذا
    const updatedFood = await Food.findByIdAndUpdate(
      foodId,
      {
        phone,
        dailyCapacity,
        description,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "اطلاعات آشپزخانه با موفقیت بروزرسانی شد",
      data: updatedFood,
    });
  } catch (error) {
    console.error("Error updating food:", error);
    return NextResponse.json(
      { success: false, message: "خطا در بروزرسانی آشپزخانه" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const currentUser = await getUser();
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const { foodId } = params;

    // بررسی وجود غذا
    const food = await Food.findById(foodId);
    if (!food) {
      return NextResponse.json(
        { success: false, message: "آشپزخانه یافت نشد" },
        { status: 404 }
      );
    }

    // حذف غذا
    await Food.findByIdAndDelete(foodId);

    return NextResponse.json({
      success: true,
      message: "آشپزخانه با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("Error deleting food:", error);
    return NextResponse.json(
      { success: false, message: "خطا در حذف آشپزخانه" },
      { status: 500 }
    );
  }
}
