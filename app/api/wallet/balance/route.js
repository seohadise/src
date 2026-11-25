import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import { getUser } from "@/lib/helpers";

export async function GET() {
    try {
        await connectDB();

        const user = await getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, message: "لطفاً وارد حساب کاربری خود شوید", balance: 0 },
                { status: 401 }
            );
        }

        const balance = user.wallet?.balance || 0;

        return NextResponse.json({
            success: true,
            balance: balance,
        });
    } catch (error) {
        console.error("Error fetching wallet balance:", error);
        return NextResponse.json(
            { success: false, message: "خطا در دریافت موجودی کیف پول", balance: 0 },
            { status: 500 }
        );
    }
}
