import connectDB from "@/config/db";
import Reservation from "@/models/Reservation";
import Food from "@/models/Food";
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

        // دریافت تمام غذاهای کاربر
        const userFoods = await Food.find({ owner: user._id }).select("_id").lean();
        const foodIds = userFoods.map(food => food._id);

        // دریافت رزروهای مربوط به غذاهای کاربر
        const reservations = await Reservation.find({
            itemType: "food",
            itemId: { $in: foodIds }
        })
            .populate("user", "fullName email number")
            .sort({ createdAt: -1 })
            .lean();

        // Populate itemId manually - always fetch food details
        const populatedReservations = await Promise.all(
            reservations.map(async (reservation) => {
                if (!reservation.itemId) return reservation;
                
                // Get the food ID (could be ObjectId or string)
                const foodId = reservation.itemId._id || reservation.itemId;
                
                // Fetch the food details
                const food = await Food.findById(foodId).select('foods staff images address pricing').lean();
                if (food) {
                    const displayName = food.foods?.[0] || food.staff?.chef?.name || 'غذا';
                    return {
                        ...reservation,
                        itemId: {
                            ...food,
                            _id: food._id.toString(),
                            name: displayName
                        }
                    };
                }
                return {
                    ...reservation,
                    itemId: { name: 'غذای حذف شده' }
                };
            })
        );

        return NextResponse.json({
            success: true,
            data: populatedReservations
        });
    } catch (error) {
        console.error("Error fetching food reservations:", error);
        return NextResponse.json(
            { success: false, message: "خطا در دریافت رزروها" },
            { status: 500 }
        );
    }
}
