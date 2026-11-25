"use server";

import connectDB from "@/config/db";
import { getUser } from "@/lib/helpers";
import Bus from "@/models/Bus";
import { busSchema } from "@/schemas/bus";

await connectDB();

export const createBus = async (data) => {
    const user = await getUser();

    if (!user || !user?.isVerified || user?.isBanned) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const safeData = busSchema.parse(data);
        
        console.log("Bus creation data:", JSON.stringify(safeData, null, 2));

        // اگر availableDates خالی است، از تاریخ اصلی یک availableDate بساز
        let availableDates = safeData.availableDates || [];
        if (availableDates.length === 0 && safeData.date) {
            availableDates = [
                {
                    date: safeData.date,
                    isReserved: false,
                    isPeakSeason: false,
                    remainingCapacity: safeData.vehicle?.capacity || 0,
                },
            ];
        } else {
            // اطمینان از اینکه همه تاریخ‌ها remainingCapacity دارند
            availableDates = availableDates.map(dateObj => ({
                ...dateObj,
                remainingCapacity: dateObj.remainingCapacity ?? safeData.vehicle?.capacity ?? 0
            }));
        }

        const newBus = await Bus.create({
            ...safeData,
            availableDates,
            owner: user._id,
        });

        user.buses.push(newBus._id);

        await user.save();

        return { success: true, message: "اتوبوس با موفقیت ایجاد شد" };
    } catch (error) {
        return {
            success: false,
            message: error.message || "خطا در ایجاد اتوبوس",
        };
    }
};

export const editBus = async (data, busId) => {
    const user = await getUser();

    if (!user || !user?.isVerified || user?.isBanned) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const safeData = busSchema.parse(data);

        const bus = await Bus.findById(busId);

        if (!bus) {
            return { success: false, message: "اتوبوس مورد نظر یافت نشد" };
        }

        if (bus.owner.toString() !== user._id.toString()) {
            return {
                success: false,
                message: "شما اجازه ویرایش این اتوبوس را ندارید",
            };
        }

        if (bus.reservations.length > 0) {
            return {
                success: false,
                message: "این اتوبوس دارای رزرو است و قابل ویرایش نمی‌باشد",
            };
        }

        // اگر availableDates خالی است، از تاریخ اصلی یک availableDate بساز
        let availableDates = safeData.availableDates || [];
        if (availableDates.length === 0 && safeData.date) {
            availableDates = [
                {
                    date: safeData.date,
                    isReserved: false,
                    isPeakSeason: false,
                    remainingCapacity: safeData.vehicle?.capacity || 0,
                },
            ];
        } else {
            // اطمینان از اینکه همه تاریخ‌ها remainingCapacity دارند
            availableDates = availableDates.map(dateObj => ({
                ...dateObj,
                remainingCapacity: dateObj.remainingCapacity ?? safeData.vehicle?.capacity ?? 0
            }));
        }

        await Bus.findByIdAndUpdate(
            busId,
            { ...safeData, availableDates, status: "pending" },
            { new: true }
        );

        return {
            success: true,
            message: "اتوبوس با موفقیت ویرایش شد",
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || "خطا در ویرایش اتوبوس",
        };
    }
};

export const deleteBus = async (busId) => {
    const user = await getUser();

    if (!user || !user?.isVerified || user?.isBanned) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const bus = await Bus.findById(busId);

        if (!bus) {
            return { success: false, message: "Not Found" };
        }

        if (bus.owner.toString() !== user._id.toString()) {
            return { success: false, message: "Not Allowed" };
        }

        user.buses.pull(bus._id);
        await user.save();

        await Bus.findByIdAndDelete(bus._id);

        return { success: true, message: "اتوبوس با موفقیت حذف گردید" };
    } catch (error) {
        return {
            success: false,
            message: error.message || "خطایی رخ داده است",
        };
    }
};
