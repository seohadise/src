import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Food from "@/models/Food";
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
        const { foodId } = await params;

        if (!["approved", "rejected"].includes(status)) {
            return NextResponse.json({ success: false, message: "وضعیت نامعتبر" }, { status: 400 });
        }

        const food = await Food.findById(foodId);
        if (!food) {
            return NextResponse.json({ success: false, message: "غذا یافت نشد" }, { status: 404 });
        }

        food.status = status;
        food.reviewedBy = user._id;
        food.reviewedAt = new Date();

        await food.save();

        // Send SMS to owner
        try {
            const owner = await User.findById(food.owner);
            if (owner?.number) {
                const itemName = food.foods?.[0] || food.staff?.chef?.name || "غذا";
                if (status === "approved") {
                    await sendItemApprovedSMSToOwner(owner.number, "food", itemName);
                } else {
                    await sendItemRejectedSMSToOwner(owner.number, "food", itemName);
                }
            }
        } catch (smsError) {
            console.error("Error sending item status SMS:", smsError);
        }

        return NextResponse.json({
            success: true,
            message: `وضعیت غذا به ${status === "approved" ? "تایید شده" : "رد شده"} تغییر یافت`,
            data: food,
        });
    } catch (error) {
        console.error("Error updating food status:", error);
        return NextResponse.json(
            { success: false, message: "خطا در بروزرسانی وضعیت", error: error.message },
            { status: 500 }
        );
    }
}
