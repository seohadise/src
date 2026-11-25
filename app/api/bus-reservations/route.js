import connectDB from "@/config/db";
import Reservation from "@/models/Reservation";
import Bus from "@/models/Bus";
import { getUser } from "@/lib/helpers";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await connectDB();
        
        const user = await getUser();
        if (!user) {
            return NextResponse.json(
                { success: false, message: "لطفا وارد حساب کاربری خود شوید" },
                { status: 401 }
            );
        }

        // دریافت تمام اتوبوس‌های کاربر
        const userBuses = await Bus.find({ owner: user._id }).select("_id").lean();
        const busIds = userBuses.map(bus => bus._id);

        // دریافت رزروهای مربوط به اتوبوس‌های کاربر
        const reservations = await Reservation.find({
            itemType: "bus",
            itemId: { $in: busIds }
        })
            .populate("user", "fullName email number")
            .populate("itemId", "title images from to departureTime arrivalTime vehicle")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            data: reservations
        });
    } catch (error) {
        console.error("Error fetching bus reservations:", error);
        return NextResponse.json(
            { success: false, message: "خطا در دریافت رزروها" },
            { status: 500 }
        );
    }
}
