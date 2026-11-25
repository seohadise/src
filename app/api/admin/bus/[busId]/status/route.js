import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Bus from "@/models/Bus";
import User from "@/models/User";
import { getUser } from "@/lib/helpers";
import { sendItemApprovedSMSToOwner, sendItemRejectedSMSToOwner } from "@/lib/sms-service";

export async function PATCH(request, { params }) {
    try {
        await connectDB();

        const user = await getUser();
        if (!user || !user.isAdmin) {
            return NextResponse.json(
                { success: false, message: "دسترسی غیرمجاز" },
                { status: 403 }
            );
        }

        const { status } = await request.json();
        const { busId } = await params;

        if (!["approved", "rejected"].includes(status)) {
            return NextResponse.json({ success: false, message: "وضعیت نامعتبر" }, { status: 400 });
        }

        const bus = await Bus.findById(busId);
        if (!bus) {
            return NextResponse.json(
                { success: false, message: "اتوبوس یافت نشد" },
                { status: 404 }
            );
        }

        bus.status = status;
        bus.reviewedBy = user._id;
        bus.reviewedAt = new Date();

        await bus.save();

        // Send SMS to owner
        try {
            const owner = await User.findById(bus.owner);
            if (owner?.number) {
                const itemName = bus.vehicle?.name || "اتوبوس";
                if (status === "approved") {
                    await sendItemApprovedSMSToOwner(owner.number, "bus", itemName);
                } else {
                    await sendItemRejectedSMSToOwner(owner.number, "bus", itemName);
                }
            }
        } catch (smsError) {
            console.error("Error sending item status SMS:", smsError);
        }

        return NextResponse.json({
            success: true,
            message: `وضعیت اتوبوس به ${status === "approved" ? "تایید شده" : "رد شده"} تغییر یافت`,
            data: bus,
        });
    } catch (error) {
        console.error("Error updating bus status:", error);
        return NextResponse.json(
            { success: false, message: "خطا در بروزرسانی وضعیت", error: error.message },
            { status: 500 }
        );
    }
}
