import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Property from "@/models/Property";
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
        const { propertyId } = await params;

        if (!["approved", "rejected"].includes(status)) {
            return NextResponse.json({ success: false, message: "وضعیت نامعتبر" }, { status: 400 });
        }

        const property = await Property.findById(propertyId);
        if (!property) {
            return NextResponse.json({ success: false, message: "ملک یافت نشد" }, { status: 404 });
        }

        property.status = status;
        property.reviewedBy = user._id;
        property.reviewedAt = new Date();

        await property.save();

        // Send SMS to owner
        try {
            const owner = await User.findById(property.owner);
            if (owner?.number) {
                const itemName = property.name || property.address?.city || property.address?.fullAddress || "ملک";
                if (status === "approved") {
                    await sendItemApprovedSMSToOwner(owner.number, "property", itemName);
                } else {
                    await sendItemRejectedSMSToOwner(owner.number, "property", itemName);
                }
            }
        } catch (smsError) {
            console.error("Error sending item status SMS:", smsError);
        }

        return NextResponse.json({
            success: true,
            message: `وضعیت ملک به ${status === "approved" ? "تایید شده" : "رد شده"} تغییر یافت`,
            data: property,
        });
    } catch (error) {
        console.error("Error updating property status:", error);
        return NextResponse.json(
            { success: false, message: "خطا در بروزرسانی وضعیت", error: error.message },
            { status: 500 }
        );
    }
}
