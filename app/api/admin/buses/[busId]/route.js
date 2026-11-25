import connectDB from "@/config/db";
import Bus from "@/models/Bus";
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

    const { busId } = params;
    const body = await request.json();
    const { vehicle, company, price } = body;

    // بررسی وجود اتوبوس
    const bus = await Bus.findById(busId);
    if (!bus) {
      return NextResponse.json(
        { success: false, message: "اتوبوس یافت نشد" },
        { status: 404 }
      );
    }

    // بروزرسانی اطلاعات اتوبوس
    const updatedBus = await Bus.findByIdAndUpdate(
      busId,
      {
        vehicle: {
          ...bus.vehicle,
          ...vehicle,
        },
        company: {
          ...bus.company,
          ...company,
        },
        price,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "اطلاعات اتوبوس با موفقیت بروزرسانی شد",
      data: updatedBus,
    });
  } catch (error) {
    console.error("Error updating bus:", error);
    return NextResponse.json(
      { success: false, message: "خطا در بروزرسانی اتوبوس" },
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

    const { busId } = params;

    // بررسی وجود اتوبوس
    const bus = await Bus.findById(busId);
    if (!bus) {
      return NextResponse.json(
        { success: false, message: "اتوبوس یافت نشد" },
        { status: 404 }
      );
    }

    // حذف اتوبوس
    await Bus.findByIdAndDelete(busId);

    return NextResponse.json({
      success: true,
      message: "اتوبوس با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("Error deleting bus:", error);
    return NextResponse.json(
      { success: false, message: "خطا در حذف اتوبوس" },
      { status: 500 }
    );
  }
}
