import connectDB from "@/config/db";
import Food from "@/models/Food";
import Reservation from "@/models/Reservation";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        await connectDB();

        const foods = await Food.find({});
        let fixedCount = 0;

        for (const food of foods) {
            let hasChanges = false;

            if (food.availableDates && food.availableDates.length > 0) {
                // Get all confirmed reservations for this food
                const confirmedReservations = await Reservation.find({
                    itemId: food._id,
                    itemType: "food",
                    status: "confirmed"
                }).lean();

                // Calculate reserved quantity for each date
                const reservedByDate = {};
                confirmedReservations.forEach(res => {
                    if (res.dates && res.dates.length > 0) {
                        res.dates.forEach(date => {
                            const dateStr = new Date(date).toDateString();
                            const quantity = res.quantity || 1;
                            reservedByDate[dateStr] = (reservedByDate[dateStr] || 0) + quantity;
                        });
                    }
                });

                food.availableDates.forEach(dateObj => {
                    const dateStr = new Date(dateObj.date).toDateString();
                    const reservedQuantity = reservedByDate[dateStr] || 0;
                    const dailyCapacity = food.dailyCapacity || 0;
                    
                    // Calculate remaining capacity
                    const newRemainingCapacity = Math.max(0, dailyCapacity - reservedQuantity);
                    
                    // Update remainingCapacity
                    if (dateObj.remainingCapacity !== newRemainingCapacity) {
                        dateObj.remainingCapacity = newRemainingCapacity;
                        hasChanges = true;
                    }
                    
                    // Update isReserved based on remaining capacity
                    const shouldBeReserved = newRemainingCapacity <= 0;
                    if (dateObj.isReserved !== shouldBeReserved) {
                        dateObj.isReserved = shouldBeReserved;
                        hasChanges = true;
                    }
                });

                if (hasChanges) {
                    await food.save();
                    fixedCount++;
                    console.log(`Fixed food ${food._id}: dailyCapacity=${food.dailyCapacity}`);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Fixed ${fixedCount} foods with remainingCapacity`,
            totalFoods: foods.length,
            fixedCount,
        });
    } catch (error) {
        console.error("Error fixing food capacity:", error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
