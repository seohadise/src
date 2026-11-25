import { NextResponse } from "next/server";
import { sendOtp } from "@/app/auth/_actions";

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await sendOtp(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "خطایی رخ داده است" },
      { status: 500 }
    );
  }
}
