import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Property from "@/models/Property";
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

    const property = await Property.findById(params.propertyId);
    if (!property) {
      return NextResponse.json(
        { success: false, message: "ملک یافت نشد" },
        { status: 404 }
      );
    }

    property.status = status;
    property.reviewedBy = user._id;
    property.reviewedAt = new Date();
    
    await property.save();

    return NextResponse.json({
      success: true,
      message: `وضعیت ملک به ${status === 'approved' ? 'تایید شده' : 'رد شده'} تغییر یافت`,
      data: property
    });

  } catch (error) {
    console.error("Error updating property status:", error);
    return NextResponse.json(
      { success: false, message: "خطا در بروزرسانی وضعیت" },
      { status: 500 }
    );
  }
}
