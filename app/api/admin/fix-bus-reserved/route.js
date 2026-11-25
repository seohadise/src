import connectDB from "@/config/db";
import Bus from "@/models/Bus";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        await connectDB();

        const buses = await Bus.find({});
        let fixedCount = 0;

        for (const bus of buses) {
            let needsSave = false;

            if (bus.availableDates && bus.availableDates.length > 0) {
                for (const dateObj of bus.availableDates) {
                    const capacity = bus.vehicle?.capacity || 0;
                    const remaining = dateObj.remainingCapacity ?? capacity;

                    // If isReserved is true but there's still capacity, fix it
                    if (dateObj.isReserved && remaining > 0) {
                        dateObj.isReserved = false;
                        needsSave = true;
                        fixedCount++;
                    }

                    // If remainingCapacity is not set, initialize it
                    if (dateObj.remainingCapacity === undefined || dateObj.remainingCapacity === null) {
                        dateObj.remainingCapacity = capacity;
                        needsSave = true;
                    }
                }
            }

            if (needsSave) {
                await bus.save();
            }
        }

        return NextResponse.json({
            success: true,
            message: `${fixedCount} bus dates fixed`,
            totalBuses: buses.length,
        });
    } catch (error) {
        console.error("Error fixing bus reserved status:", error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
