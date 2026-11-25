import { NextResponse } from "next/server";
import locationsData from "@/data/iran-locations.json";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const provinceName = searchParams.get("province");

    if (!provinceName) {
      return NextResponse.json(
        { error: "نام استان الزامی است" },
        { status: 400 }
      );
    }

    const province = locationsData.provinces.find(
      (p) => p.name === provinceName
    );

    if (!province) {
      return NextResponse.json(
        { error: "استان یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json(province.cities);
  } catch (error) {
    return NextResponse.json(
      { error: "خطا در دریافت لیست شهرها" },
      { status: 500 }
    );
  }
}
