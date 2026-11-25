import connectDB from "@/config/db";
import Reservation from "@/models/Reservation";
import Property from "@/models/Property";
import Bus from "@/models/Bus";
import Food from "@/models/Food";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/helpers";

// دریافت اطلاعات رزرو با شناسه
export async function GET(request, { params }) {
    try {
        await connectDB();

        const { reservationId } = await params;

        // دریافت کاربر جاری
        const user = await getUser();
        if (!user) {
            return NextResponse.json(
                { success: false, message: "لطفا وارد حساب کاربری خود شوید" },
                { status: 401 }
            );
        }

        // دریافت رزرو با شناسه
        const reservation = await Reservation.findById(reservationId)
            .populate("user", "fullName email number")
            .lean();

        if (!reservation) {
            return NextResponse.json(
                { success: false, message: "رزرو مورد نظر یافت نشد" },
                { status: 404 }
            );
        }

        // بررسی دسترسی کاربر به این رزرو
        // فقط مالک رزرو یا مالک آیتم رزرو شده می‌توانند جزئیات را ببینند
        const isReservationOwner = reservation.user?._id?.toString() === user._id.toString();
        const isItemOwner = reservation.targetUser?.toString() === user._id.toString();
        const isAdmin = user.isAdmin;

        if (!isReservationOwner && !isItemOwner && !isAdmin) {
            return NextResponse.json(
                { success: false, message: "شما دسترسی به این رزرو ندارید" },
                { status: 403 }
            );
        }

        // Fetch item details based on itemType
        let itemDetails = null;
        if (reservation.itemId && reservation.itemType) {
            try {
                if (reservation.itemType === "property") {
                    const property = await Property.findById(reservation.itemId)
                        .select("name address images owner managerNumber")
                        .populate("owner", "fullName number")
                        .lean();
                    if (property) {
                        // Only show full address if reservation is confirmed or completed
                        const showFullAddress = reservation.status === "confirmed" || reservation.status === "completed";
                        
                        itemDetails = {
                            _id: property._id.toString(),
                            name: property.name,
                            address: showFullAddress ? property.address : {
                                province: property.address?.province,
                                city: property.address?.city,
                                // Don't show fullAddress until reservation is confirmed
                            },
                            // Show full address separately for confirmed reservations
                            fullAddress: showFullAddress ? property.address?.fullAddress : null,
                            images: property.images,
                            owner: property.owner ? {
                                _id: property.owner._id.toString(),
                                fullName: property.owner.fullName,
                                number: property.owner.number
                            } : null,
                            // Show manager number for confirmed reservations
                            managerNumber: showFullAddress ? property.managerNumber : null
                        };
                    }
                } else if (reservation.itemType === "bus") {
                    const bus = await Bus.findById(reservation.itemId)
                        .select("vehicle from to departureTime arrivalTime company images owner price")
                        .populate("owner", "fullName number")
                        .lean();
                    if (bus) {
                        itemDetails = {
                            _id: bus._id.toString(),
                            name: bus.vehicle?.name || `${bus.from?.city} - ${bus.to?.city}`,
                            vehicle: bus.vehicle,
                            from: bus.from,
                            to: bus.to,
                            departureTime: bus.departureTime,
                            arrivalTime: bus.arrivalTime,
                            company: bus.company,
                            images: bus.images,
                            price: bus.price,
                            owner: bus.owner ? {
                                _id: bus.owner._id.toString(),
                                fullName: bus.owner.fullName,
                                number: bus.owner.number
                            } : null
                        };
                    }
                } else if (reservation.itemType === "food") {
                    const food = await Food.findById(reservation.itemId)
                        .select("foods staff address images pricing owner")
                        .populate("owner", "fullName number")
                        .lean();
                    if (food) {
                        const displayName = food.foods?.[0] || food.staff?.chef?.name || "غذا";
                        const showFullAddress = reservation.status === "confirmed" || reservation.status === "completed";
                        itemDetails = {
                            _id: food._id.toString(),
                            name: displayName,
                            foods: food.foods,
                            staff: food.staff,
                            address: showFullAddress ? food.address : {
                                province: food.address?.province,
                                city: food.address?.city,
                            },
                            fullAddress: showFullAddress ? food.address?.fullAddress : null,
                            images: food.images,
                            pricing: food.pricing,
                            owner: food.owner ? {
                                _id: food.owner._id.toString(),
                                fullName: food.owner.fullName,
                                number: food.owner.number
                            } : null
                        };
                    }
                }
            } catch (itemError) {
                console.error("Error fetching item details:", itemError);
            }
        }

        // تبدیل ObjectId به string برای JSON serialization
        const safeReservation = {
            ...reservation,
            _id: reservation._id.toString(),
            user: reservation.user
                ? {
                      ...reservation.user,
                      _id: reservation.user._id.toString(),
                  }
                : null,
            itemId: itemDetails || reservation.itemId?.toString() || null,
            targetUser: reservation.targetUser?.toString() || null,
        };

        return NextResponse.json({
            success: true,
            data: safeReservation,
        });
    } catch (error) {
        console.error("API Reservation Error:", error);
        return NextResponse.json(
            { success: false, message: "خطا در دریافت اطلاعات رزرو" },
            { status: 500 }
        );
    }
}
