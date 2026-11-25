import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Reservation from "@/models/Reservation";
import { getUser } from "@/lib/helpers";

export async function GET(request) {
    try {
        await connectDB();
        
        // Check if user is admin
        const user = await getUser();
        if (!user || !user.isAdmin) {
            return NextResponse.json(
                { success: false, message: "دسترسی غیرمجاز" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 20;
        const status = searchParams.get("status");
        const itemType = searchParams.get("itemType");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        // Build query
        const query = {};
        if (status && status !== "all") {
            query.status = status;
        }
        if (itemType && itemType !== "all") {
            query.itemType = itemType;
        }
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        // Get total count
        const totalReservations = await Reservation.countDocuments(query);

        // Get paginated reservations
        let reservations = await Reservation.find(query)
            .populate("user", "fullName email number")
            .populate("targetUser", "fullName email number")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // Dynamic populate based on itemType
        for (let reservation of reservations) {
            const itemType = reservation.itemModel || reservation.itemType;
            if (itemType && reservation.itemId) {
                try {
                    if (itemType === "Property" || itemType === "property") {
                        const Property = (await import("@/models/Property")).default;
                        const prop = await Property.findById(reservation.itemId)
                            .select("name title address.city address.province")
                            .lean();
                        if (prop) reservation.itemId = prop;
                    } else if (itemType === "Bus" || itemType === "bus") {
                        const Bus = (await import("@/models/Bus")).default;
                        const bus = await Bus.findById(reservation.itemId)
                            .select("vehicle company from to")
                            .lean();
                        if (bus) reservation.itemId = bus;
                    } else if (itemType === "Food" || itemType === "food") {
                        const Food = (await import("@/models/Food")).default;
                        const food = await Food.findById(reservation.itemId)
                            .select("staff foods")
                            .lean();
                        if (food) reservation.itemId = food;
                    }
                } catch (error) {
                    console.error("Error populating item:", error);
                }
            }
        }

        // Calculate stats - only include confirmed/completed reservations
        // رزروهای pending تا زمان تایید مالک در آمار محاسبه نمی‌شوند
        const allReservations = await Reservation.find(query).lean();
        const confirmedReservations = allReservations.filter(r => r.status === "confirmed").length;
        const completedReservations = allReservations.filter(r => r.status === "completed").length;
        const validReservations = allReservations.filter(r => r.status === "confirmed" || r.status === "completed");
        const totalRevenue = validReservations.reduce((sum, r) => sum + (r.amount || 0), 0);
        const averageAmount = validReservations.length > 0
            ? totalRevenue / validReservations.length
            : 0;

        const stats = {
            // totalReservations فقط رزروهای تایید شده و تکمیل شده را محاسبه می‌کند
            totalReservations: validReservations.length,
            allReservationsCount: allReservations.length,
            confirmedReservations,
            totalRevenue,
            averageAmount,
        };

        const pagination = {
            currentPage: page,
            totalPages: Math.ceil(totalReservations / limit),
            totalItems: totalReservations,
            itemsPerPage: limit,
        };

        return NextResponse.json({
            success: true,
            data: {
                reservations,
                stats,
                pagination,
            },
        });
    } catch (error) {
        console.error("Error fetching reservations:", error);
        return NextResponse.json(
            { success: false, message: "خطا در دریافت رزروها", error: error.message },
            { status: 500 }
        );
    }
}
