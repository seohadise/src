import connectDB from "@/config/db";
import Property from "@/models/Property";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const city = searchParams.get('city');
    const province = searchParams.get('province');
    const limit = parseInt(searchParams.get('limit')) || 4;
    const exclude = searchParams.get('exclude');

    const query = {
      status: "approved",
    };

    // فیلتر بر اساس نوع ملک
    if (type) {
      query.type = type;
    }

    // فیلتر بر اساس شهر یا استان
    if (city) {
      query["address.city"] = city;
    } else if (province) {
      query["address.province"] = province;
    }

    // حذف ملک فعلی از نتایج
    if (exclude) {
      query._id = { $ne: exclude };
    }

    let similarProperties = await Property.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("owner", "name")
      .lean();

    // اگر در شهر مورد نظر ملکی پیدا نشد، کل استان را جستجو کن
    if (similarProperties.length === 0 && province) {
      delete query["address.city"];
      similarProperties = await Property.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("owner", "name")
        .lean();
    }

    // اگر در استان هم ملکی پیدا نشد، فقط بر اساس نوع ملک جستجو کن
    if (similarProperties.length === 0 && type) {
      delete query["address.province"];
      similarProperties = await Property.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("owner", "name")
        .lean();
    }

    return NextResponse.json({
      success: true,
      data: similarProperties,
    });
  } catch (error) {
    console.error("Error fetching similar properties:", error);
    return NextResponse.json(
      {
        success: false,
        message: "خطا در دریافت اقامتگاه‌های مشابه",
      },
      { status: 500 }
    );
  }
}
