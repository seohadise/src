import { NextResponse } from "next/server";
import locationsData from "@/data/iran-locations.json";

export async function GET() {
  try {
    const provinces = locationsData.provinces.map((p) => p.name);
    return NextResponse.json(provinces);
  } catch (error) {
    return NextResponse.json(
      { error: "خطا در دریافت لیست استان‌ها" },
      { status: 500 }
    );
  }
}
