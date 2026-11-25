import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Food from "@/models/Food";
import { getUser } from "@/lib/helpers";

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    
    const user = await getUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const { status } = await request.json();
    
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, message: "وضعیت نامعتبر" },
        { status: 400 }
      );
    }

    const food = await Food.findById(params.foodId);
    if (!food) {
      return NextResponse.json(
        { success: false, message: "غذا یافت نشد" },
        { status: 404 }
      );
    }

    food.status = status;
    food.reviewedBy = user._id;
    food.reviewedAt = new Date();
    
    await food.save();

    return NextResponse.json({
      success: true,
      message: `وضعیت غذا به ${status === 'approved' ? 'تایید شده' : 'رد شده'} تغییر یافت`,
      data: food
    });

  } catch (error) {
    console.error("Error updating food status:", error);
    return NextResponse.json(
      { success: false, message: "خطا در بروزرسانی وضعیت" },
      { status: 500 }
    );
  }
}
