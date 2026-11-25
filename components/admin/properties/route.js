import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Property from "@/models/Property";
import { getUser } from "@/lib/helpers";

export async function GET(request) {
  try {
    await connectDB();
    
    const user = await getUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;

    const filter = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const properties = await Property.find(filter)
      .populate("owner", "fullName email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Property.countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: properties,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { success: false, message: "خطا در دریافت املاک" },
      { status: 500 }
    );
  }
}
