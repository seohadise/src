import mongoose from "mongoose";

import connectDB from "@/config/db";
import Reservation from "@/models/Reservation";
import Property from "@/models/Property";
import Bus from "@/models/Bus";
import Food from "@/models/Food";
import ReservationCard from "@/components/reservations/reservation-card";

import { getUser } from "@/lib/helpers";
import { notFound } from "next/navigation";

export const metadata = {
  title: "رزرو‌ های دریافتی",
};

// اجبار به dynamic rendering برای استفاده از cookies
export const dynamic = 'force-dynamic';

const Page = async () => {
  try {
    await connectDB();

    const user = await getUser();
    
    if (!user || !user._id) {
      return notFound();
    }

    // واکشی رزروهای دریافتی با مدیریت خطای بهتر
    let reservations = [];
    try {
      reservations = await Reservation.find({ targetUser: user._id })
        .populate("user", "fullName number")
        .sort({ createdAt: -1 })
        .lean();
    } catch (error) {
      console.log("Error fetching reservations:", error);
      reservations = [];
    }

    // واکشی اطلاعات تکمیلی برای هر آیتم رزرو شده
    const populatedReservations = await Promise.all(
      reservations.map(async (reservation) => {
        try {
          let itemDetails = null;
          
          // واکشی اطلاعات آیتم بر اساس نوع
          if (reservation.itemType === "property" && reservation.itemId) {
            const property = await Property.findById(reservation.itemId).select("name address").lean();
            if (property) {
              itemDetails = {
                name: property.name,
                address: property.address
              };
            }
          } else if (reservation.itemType === "bus" && reservation.itemId) {
            const bus = await Bus.findById(reservation.itemId).select("vehicle from to").lean();
            if (bus) {
              itemDetails = {
                name: bus.vehicle?.name || `${bus.from?.city} - ${bus.to?.city}`,
                from: bus.from,
                to: bus.to
              };
            }
          } else if (reservation.itemType === "food" && reservation.itemId) {
            const food = await Food.findById(reservation.itemId).select("foods staff address").lean();
            if (food) {
              itemDetails = {
                name: food.foods?.[0] || food.staff?.chef?.name || "غذا",
                address: food.address
              };
            }
          }
          
          return {
            ...reservation,
            itemDetails: itemDetails || { name: "نامشخص" }
          };
        } catch (error) {
          console.log(`Error fetching details for reservation ${reservation._id}:`, error);
          return {
            ...reservation,
            itemDetails: { name: "نامشخص" }
          };
        }
      })
    );

    // تبدیل ObjectId به string برای JSON serialization
    const safeReservations = populatedReservations.map(reservation => ({
      ...reservation,
      _id: reservation._id.toString(),
      itemId: reservation.itemId ? reservation.itemId.toString() : null,
      targetUser: reservation.targetUser ? reservation.targetUser.toString() : null,
      user: reservation.user ? {
        ...reservation.user,
        _id: reservation.user._id.toString()
      } : null,
      // اطمینان از وجود contactInfo
      contactInfo: reservation.contactInfo || {
        name: reservation.user?.fullName || "نامشخص",
        phone: reservation.user?.number || "نامشخص",
        email: ""
      }
    }));

    return (
      <div className="space-y-4 p-4">
        <h1 className="text-2xl font-bold">رزرو‌های دریافتی</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {safeReservations.length > 0 ? (
            safeReservations.map((reservation) => (
              <ReservationCard
                key={reservation._id}
                reservation={reservation}
              />
            ))
          ) : (
            <p className="col-span-full text-center text-muted-foreground py-8">
              هنوز هیچ رزروی دریافت نکرده‌اید
            </p>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.log("Error in reservations page:", error);
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">رزرو‌های دریافتی</h1>
        <p className="text-red-500">خطا در بارگذاری رزروها. لطفاً دوباره تلاش کنید.</p>
      </div>
    );
  }
};

export default Page;
