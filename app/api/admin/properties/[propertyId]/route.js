import connectDB from "@/config/db";
import Property from "@/models/Property";
import { getUser } from "@/lib/helpers";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
    try {
        await connectDB();

        const currentUser = await getUser();
        if (!currentUser || !currentUser.isAdmin) {
            return NextResponse.json(
                { success: false, message: "دسترسی غیرمجاز" },
                { status: 403 }
            );
        }

        const { propertyId } = params;
        const body = await request.json();
        const { name, managerName, capacity, pricing } = body;

        // بررسی وجود ملک
        const property = await Property.findById(propertyId);
        if (!property) {
            return NextResponse.json({ success: false, message: "ملک یافت نشد" }, { status: 404 });
        }

        // آماده‌سازی داده‌های آپدیت
        const updateData = {};

        if (name !== undefined) updateData.name = name;
        if (managerName !== undefined) updateData.managerName = managerName;
        if (capacity !== undefined) updateData.capacity = Number(capacity);

        // آپدیت قیمت‌گذاری با حفظ مقادیر قبلی
        if (pricing) {
            updateData.pricing = {
                regularPrice:
                    pricing.regularPrice !== undefined
                        ? Number(pricing.regularPrice)
                        : property.pricing?.regularPrice || 0,
                peakPrice:
                    pricing.peakPrice !== undefined
                        ? Number(pricing.peakPrice)
                        : property.pricing?.peakPrice || 0,
                discount:
                    pricing.discount !== undefined
                        ? Number(pricing.discount)
                        : property.pricing?.discount || 0,
                deposit:
                    pricing.deposit !== undefined
                        ? Number(pricing.deposit)
                        : property.pricing?.deposit || 10,
            };
        }

        // بروزرسانی اطلاعات ملک
        const updatedProperty = await Property.findByIdAndUpdate(propertyId, updateData, {
            new: true,
            runValidators: true,
        });

        return NextResponse.json({
            success: true,
            message: "اطلاعات ملک با موفقیت بروزرسانی شد",
            data: updatedProperty,
        });
    } catch (error) {
        console.error("Error updating property:", error);
        return NextResponse.json(
            { success: false, message: error.message || "خطا در بروزرسانی ملک" },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        await connectDB();

        const currentUser = await getUser();
        if (!currentUser || !currentUser.isAdmin) {
            return NextResponse.json(
                { success: false, message: "دسترسی غیرمجاز" },
                { status: 403 }
            );
        }

        const { propertyId } = params;

        // بررسی وجود ملک
        const property = await Property.findById(propertyId);
        if (!property) {
            return NextResponse.json({ success: false, message: "ملک یافت نشد" }, { status: 404 });
        }

        // حذف ملک
        await Property.findByIdAndDelete(propertyId);

        return NextResponse.json({
            success: true,
            message: "ملک با موفقیت حذف شد",
        });
    } catch (error) {
        console.error("Error deleting property:", error);
        return NextResponse.json({ success: false, message: "خطا در حذف ملک" }, { status: 500 });
    }
}
