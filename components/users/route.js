import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import User from "@/models/User";
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
    const verified = searchParams.get("verified");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;

    const filter = {};
    if (verified === "false") {
      filter.isVerified = false;
      filter.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }; // آخرین 30 روز
    }

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .select("fullName email phone type isVerified createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "خطا در دریافت کاربران" },
      { status: 500 }
    );
  }
}
