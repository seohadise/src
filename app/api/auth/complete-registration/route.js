import { NextResponse } from "next/server";
import { completeRegistration } from "@/app/auth/_actions";

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await completeRegistration(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "خطایی رخ داده است" },
      { status: 500 }
    );
  }
}
