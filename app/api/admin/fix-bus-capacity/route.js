import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Bus from "@/models/Bus";
import Reservation from "@/models/Reservation";

export async function POST(request) {
    try {
        await connectDB();

        const buses = await Bus.find({});
        let fixedCount = 0;

        for (const bus of buses) {
            let hasChanges = false;

            if (bus.availableDates && bus.availableDates.length > 0) {
                const vehicleCapacity = bus.vehicle?.capacity || bus.capacity || 0;
                
                // Get all confirmed reservations for this bus
                const confirmedReservations = await Reservation.find({
                    itemId: bus._id,
                    itemType: "bus",
                    status: "confirmed"
                }).lean();

                // Calculate reserved seats for each date
                const reservedByDate = {};
                confirmedReservations.forEach(res => {
                    if (res.date) {
                        const dateStr = new Date(res.date).toDateString();
                        const guestCount = (res.guests?.adults || 1) + (res.guests?.children || 0);
                        reservedByDate[dateStr] = (reservedByDate[dateStr] || 0) + guestCount;
                    }
                });

                bus.availableDates.forEach(dateObj => {
                    const dateStr = new Date(dateObj.date).toDateString();
                    const reservedSeats = reservedByDate[dateStr] || 0;
                    
                    // Calculate remaining capacity
                    const newRemainingCapacity = Math.max(0, vehicleCapacity - reservedSeats);
                    
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
                    await bus.save();
                    fixedCount++;
                    console.log(`Fixed bus ${bus._id}: capacity=${vehicleCapacity}`);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Fixed ${fixedCount} buses with remainingCapacity`,
            totalBuses: buses.length,
            fixedCount,
        });
    } catch (error) {
        console.error("Error fixing bus capacity:", error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
