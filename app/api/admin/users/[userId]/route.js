import connectDB from "@/config/db";
import User from "@/models/User";
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

        const { userId } = params;
        const body = await request.json();
        const { fullName, email, number, type, isVerified, isBanned } = body;

        console.log("PUT /api/admin/users/[userId] - Request data:", {
            userId,
            body,
            fullName,
            email,
            number,
            type,
            isVerified,
            isBanned,
        });

        // بررسی وجود کاربر
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json(
                { success: false, message: "کاربر یافت نشد" },
                { status: 404 }
            );
        }

        // بروزرسانی اطلاعات کاربر - استفاده از مقادیر موجود اگر جدید ارسال نشده
        const updateData = {};
        if (fullName !== undefined) updateData.fullName = fullName;
        if (email !== undefined) updateData.email = email;
        if (number !== undefined) updateData.number = number;
        if (type !== undefined) updateData.type = type;
        if (isVerified !== undefined) updateData.isVerified = isVerified;
        if (isBanned !== undefined) updateData.isBanned = isBanned;

        console.log("Update data to be applied:", updateData);

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: false, // غیرفعال کردن validation برای جلوگیری از خطا
        });

        console.log("User updated successfully:", updatedUser);

        return NextResponse.json({
            success: true,
            message: "اطلاعات کاربر با موفقیت بروزرسانی شد",
            data: updatedUser,
        });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { success: false, message: "خطا در بروزرسانی کاربر", error: error.message },
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

        const { userId } = params;

        // بررسی وجود کاربر
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json(
                { success: false, message: "کاربر یافت نشد" },
                { status: 404 }
            );
        }

        // حذف کاربر
        await User.findByIdAndDelete(userId);

        return NextResponse.json({
            success: true,
            message: "کاربر با موفقیت حذف شد",
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ success: false, message: "خطا در حذف کاربر" }, { status: 500 });
    }
}
