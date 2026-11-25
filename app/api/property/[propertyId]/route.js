import connectDB from "@/config/db";
import Property from "@/models/Property";
import Reservation from "@/models/Reservation";
import { getUser } from "@/lib/helpers";
import { NextResponse } from "next/server";
import { getPolicyByKey, DEFAULT_CANCELLATION_POLICY } from "@/constants/cancellation-policies";

export async function GET(request, { params }) {
    try {
        await connectDB();

        const { propertyId } = await params;

        // دریافت کاربر جاری
        const currentUser = await getUser();

        // از propertyId برای پیدا کردن ملک استفاده می‌کنیم
        const property = await Property.findById(propertyId).populate(
            "owner",
            "fullName email number avatar"
        );

        if (!property) {
            return NextResponse.json(
                { success: false, message: "ملک مورد نظر یافت نشد" },
                { status: 404 }
            );
        }

        // بررسی وضعیت تایید شده بودن ملک
        if (
            property.status !== "approved" &&
            (!currentUser ||
                (currentUser._id.toString() !== property.owner._id.toString() &&
                    !currentUser.isAdmin))
        ) {
            return NextResponse.json(
                { success: false, message: "ملک مورد نظر یافت نشد" },
                { status: 404 }
            );
        }

        // بررسی وضعیت رزرو ملک برای تاریخ امروز
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // بررسی آیا تاریخ امروز در لیست تاریخ‌های بلاک شده calendarSettings وجود دارد
        const isDateReserved = property.calendarSettings.some(
            (date) => new Date(date.date).toDateString() === today.toDateString() && (date.blocked || date.available === false)
        );

        // بررسی آیا رزرو فعالی برای این ملک وجود دارد
        const activeReservation = await Reservation.findOne({
            itemType: "property",
            itemId: property._id,
            status: "confirmed",
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
        }).lean();

        // دریافت تمام رزروهای فعال (confirmed و pending) برای غیرفعال کردن در تقویم
        const activeReservations = await Reservation.find({
            itemType: "property",
            itemId: property._id,
            status: { $in: ["confirmed", "pending"] },
        }).lean();

        // ساخت لیست تاریخ‌های رزرو شده
        const reservedDateRanges = activeReservations.map((r) => ({
            checkInDate: r.checkInDate,
            checkOutDate: r.checkOutDate,
            status: r.status,
        }));

        // اضافه کردن وضعیت رزرو به پاسخ
        const propertyData = property.toObject();
        propertyData.isReserved = isDateReserved || !!activeReservation;
        propertyData.reservedDateRanges = reservedDateRanges;

        // Normalize cancellationRules if it's a legacy string
        if (typeof propertyData.cancellationRules === 'string' || !propertyData.cancellationRules?.penalties) {
            const policyKey = propertyData.cancellationPolicy || DEFAULT_CANCELLATION_POLICY;
            const policy = getPolicyByKey(policyKey);
            propertyData.cancellationRules = {
                penalties: policy.penalties.map((penalty) => ({ ...penalty })),
            };
        }

        // بررسی آیا کاربر جاری رزرو تایید شده برای این ملک دارد
        let hasConfirmedReservation = false;
        if (currentUser) {
            const userReservation = await Reservation.findOne({
                itemType: "property",
                itemId: property._id,
                user: currentUser._id,
                status: "confirmed",
            }).lean();
            hasConfirmedReservation = !!userReservation;
        }

        // اگر کاربر رزرو تایید شده ندارد، اطلاعات تماس مالک و آدرس کامل را مخفی کن
        if (!hasConfirmedReservation) {
            if (propertyData.owner) {
                propertyData.owner = {
                    _id: propertyData.owner._id,
                    fullName: propertyData.owner.fullName,
                    avatar: propertyData.owner.avatar,
                    email: null,
                    number: null,
                };
            }

            // آدرس کامل مخفی می‌شود
            if (propertyData.address) {
                propertyData.address = {
                    ...propertyData.address,
                    fullAddress: null,
                };
            }
        }

        return NextResponse.json({
            success: true,
            data: propertyData,
        });
    } catch (error) {
        console.error("API Property Error:", error);
        return NextResponse.json(
            { success: false, message: "خطا در دریافت اطلاعات ملک" },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const user = await getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, message: "لطفا وارد حساب کاربری خود شوید" },
                { status: 401 }
            );
        }

        const { propertyId } = await params;

        const property = await Property.findById(propertyId);

        if (!property) {
            return NextResponse.json(
                { success: false, message: "ملک مورد نظر یافت نشد" },
                { status: 404 }
            );
        }

        // بررسی دسترسی - فقط مالک یا ادمین می‌تواند ملک را حذف کند
        if (property.owner.toString() !== user._id.toString() && !user.isAdmin) {
            return NextResponse.json(
                { success: false, message: "شما دسترسی به حذف این ملک را ندارید" },
                { status: 403 }
            );
        }

        // بررسی رزروهای فعال
        const activeReservations = await Reservation.countDocuments({
            itemType: "property",
            itemId: propertyId,
            status: { $in: ["pending", "confirmed"] }
        });

        if (activeReservations > 0) {
            return NextResponse.json(
                { success: false, message: "امکان حذف ملک با رزروهای فعال وجود ندارد" },
                { status: 400 }
            );
        }

        await Property.findByIdAndDelete(propertyId);

        return NextResponse.json({
            success: true,
            message: "ملک با موفقیت حذف شد"
        });
    } catch (error) {
        console.error("Delete Property Error:", error);
        return NextResponse.json(
            { success: false, message: "خطا در حذف ملک" },
            { status: 500 }
        );
    }
}
