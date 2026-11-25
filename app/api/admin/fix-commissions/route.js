import connectDB from "@/config/db";
import Commission from "@/models/Commission";
import Reservation from "@/models/Reservation";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        await connectDB();

        // Find all commissions
        const commissions = await Commission.find({});
        let fixedCount = 0;
        let refundedCount = 0;

        for (const commission of commissions) {
            // Find the related reservation
            const reservation = await Reservation.findById(commission.reservation);
            
            if (!reservation) {
                // If reservation not found, mark commission as refunded
                if (commission.status !== "refunded") {
                    commission.status = "refunded";
                    commission.refundedAt = new Date();
                    await commission.save();
                    refundedCount++;
                }
                continue;
            }

            // If reservation is cancelled, mark commission as refunded
            if (reservation.status === "cancelled") {
                if (commission.status !== "refunded") {
                    commission.status = "refunded";
                    commission.refundedAt = new Date();
                    await commission.save();
                    refundedCount++;
                }
            }
            // If reservation is confirmed, mark commission as collected
            else if (reservation.status === "confirmed" || reservation.status === "completed") {
                if (commission.status !== "collected") {
                    commission.status = "collected";
                    commission.collectedAt = new Date();
                    await commission.save();
                    fixedCount++;
                }
            }
            // If reservation is pending, mark commission as pending
            else if (reservation.status === "pending") {
                if (commission.status !== "pending") {
                    commission.status = "pending";
                    await commission.save();
                    fixedCount++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Fixed ${fixedCount} commissions, refunded ${refundedCount} commissions`,
            totalCommissions: commissions.length,
            fixedCount,
            refundedCount,
        });
    } catch (error) {
        console.error("Error fixing commissions:", error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
