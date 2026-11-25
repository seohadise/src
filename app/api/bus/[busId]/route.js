import connectDB from "@/config/db";
import Food from "@/models/Food";
import Reservation from "@/models/Reservation";
import { getUser } from "@/lib/helpers";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
    try {
        await connectDB();

        const { foodId } = await params;

        // دریافت کاربر جاری
        const currentUser = await getUser();

        // دریافت اطلاعات غذا با شناسه
        const food = await Food.findById(foodId).populate("owner", "fullName email number").lean();

        if (!food) {
            return NextResponse.json(
                { success: false, message: "غذای مورد نظر یافت نشد" },
                { status: 404 }
            );
        }

        // بررسی آیا کاربر جاری رزرو تایید شده برای این غذا دارد
        let hasConfirmedReservation = false;
        if (currentUser) {
            const userReservation = await Reservation.findOne({
                itemType: "food",
                itemId: food._id,
                user: currentUser._id,
                status: "confirmed",
            }).lean();
            hasConfirmedReservation = !!userReservation;
        }

        // تبدیل ObjectId به string برای JSON serialization
        const safeFood = {
            ...food,
            _id: food._id.toString(),
            owner: food.owner
                ? {
                      ...food.owner,
                      _id: food.owner._id.toString(),
                      fullName: food.owner.fullName,
                      // اگر کاربر رزرو تایید شده ندارد، اطلاعات تماس مخفی می‌شود
                      email: hasConfirmedReservation ? food.owner.email : null,
                      number: hasConfirmedReservation ? food.owner.number : null,
                  }
                : null,
        };

        return NextResponse.json({
            success: true,
            data: safeFood,
        });
    } catch (error) {
        console.error("API Food Error:", error);
        return NextResponse.json(
            { success: false, message: "خطا در دریافت اطلاعات غذا" },
            { status: 500 }
        );
    }
}
