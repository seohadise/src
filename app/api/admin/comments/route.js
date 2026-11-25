import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import { getUser } from "@/lib/helpers";
import Property from "@/models/Property";
import Bus from "@/models/Bus";
import Food from "@/models/Food";

// GET: Fetch all comments (pending and approved) for admin
export async function GET(request) {
    try {
        await connectDB();
        const user = await getUser();

        if (!user || !user.isAdmin) {
            return NextResponse.json(
                { success: false, message: "دسترسی غیرمجاز" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const filter = searchParams.get("filter") || "all"; // all, pending, approved

        // Fetch comments from all three models
        const properties = await Property.find(
            { "comments.0": { $exists: true } },
            { name: 1, comments: 1 }
        ).lean();

        const buses = await Bus.find(
            { "comments.0": { $exists: true } },
            { title: 1, name: 1, comments: 1 }
        ).lean();

        const foods = await Food.find(
            { "comments.0": { $exists: true } },
            { name: 1, "staff.chef.name": 1, comments: 1 }
        ).lean();

        let allComments = [];

        // Process property comments
        properties.forEach((property) => {
            property.comments.forEach((comment) => {
                allComments.push({
                    ...comment,
                    itemType: "property",
                    itemId: property._id,
                    itemName: property.name || "ملک",
                });
            });
        });

        // Process bus comments
        buses.forEach((bus) => {
            bus.comments.forEach((comment) => {
                allComments.push({
                    ...comment,
                    itemType: "bus",
                    itemId: bus._id,
                    itemName: bus.title || bus.name || "اتوبوس",
                });
            });
        });

        // Process food comments
        foods.forEach((food) => {
            food.comments.forEach((comment) => {
                allComments.push({
                    ...comment,
                    itemType: "food",
                    itemId: food._id,
                    itemName: food.staff?.chef?.name ? `آشپزخانه ${food.staff.chef.name}` : (food.name || "غذا"),
                });
            });
        });

        // Apply filter
        if (filter === "pending") {
            allComments = allComments.filter((c) => !c.isApproved);
        } else if (filter === "approved") {
            allComments = allComments.filter((c) => c.isApproved);
        }

        // Sort by date (newest first)
        allComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return NextResponse.json({
            success: true,
            comments: allComments,
            total: allComments.length,
        });
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json(
            { success: false, message: "خطا در دریافت نظرات" },
            { status: 500 }
        );
    }
}

// PATCH: Approve or reject a comment
export async function PATCH(request) {
    try {
        await connectDB();
        const user = await getUser();

        if (!user || !user.isAdmin) {
            return NextResponse.json(
                { success: false, message: "دسترسی غیرمجاز" },
                { status: 403 }
            );
        }

        const { itemType, itemId, commentId, action } = await request.json();

        if (!itemType || !itemId || !commentId || !action) {
            return NextResponse.json(
                { success: false, message: "اطلاعات ناقص است" },
                { status: 400 }
            );
        }

        if (!["approve", "reject"].includes(action)) {
            return NextResponse.json(
                { success: false, message: "عملیات نامعتبر است" },
                { status: 400 }
            );
        }

        let Model;
        switch (itemType) {
            case "property":
                Model = Property;
                break;
            case "bus":
                Model = Bus;
                break;
            case "food":
                Model = Food;
                break;
            default:
                return NextResponse.json(
                    { success: false, message: "نوع آیتم نامعتبر است" },
                    { status: 400 }
                );
        }

        let result;
        if (action === "approve") {
            result = await Model.updateOne(
                { _id: itemId, "comments._id": commentId },
                { $set: { "comments.$.isApproved": true } }
            );
        } else {
            // reject = delete the comment
            result = await Model.updateOne(
                { _id: itemId },
                { $pull: { comments: { _id: commentId } } }
            );
        }

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, message: "نظر یافت نشد" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: action === "approve" ? "نظر تایید شد" : "نظر حذف شد",
        });
    } catch (error) {
        console.error("Error updating comment:", error);
        return NextResponse.json(
            { success: false, message: "خطا در بروزرسانی نظر" },
            { status: 500 }
        );
    }
}
