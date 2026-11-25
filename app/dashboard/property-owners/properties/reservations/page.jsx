import mongoose from "mongoose";

import connectDB from "@/config/db";
import PropertyReservations from "@/components/property-owners/property-reservations";
import Reservation from "@/models/Reservation";
import Property from "@/models/Property";

import { getUser } from "@/lib/helpers";
import { notFound } from "next/navigation";

export const metadata = {
  title: "مدیریت رزروها",
};

const Page = async () => {
  try {
    await connectDB();

    const user = await getUser();
    
    if (!user || !user._id || user.type !== "property-owner") {
      return notFound();
    }

    // دریافت لیست املاک کاربر
    const properties = await Property.find({ owner: user._id })
      .select("_id name")
      .lean();
    
    const propertyIds = properties.map(property => property._id);

    // دریافت رزروهای مربوط به املاک کاربر
    let reservations = [];
    try {
      reservations = await Reservation.find({
        itemType: "property",
        itemId: { $in: propertyIds },
      })
        .sort({ createdAt: -1 })
        .populate("user", "name email phone")
        .select("_id itemId startDate endDate guests totalPrice status specialRequests createdAt user")
        .lean();
    } catch (error) {
      console.log("Error fetching property reservations:", error);
      reservations = [];
    }

    // تبدیل ObjectId به string برای JSON serialization
    const safeReservations = reservations.map(reservation => ({
      ...reservation,
      _id: reservation._id.toString(),
      itemId: reservation.itemId?.toString(),
      user: reservation.user ? {
        ...reservation.user,
        _id: reservation.user._id.toString()
      } : null
    }));
    
    // تبدیل اطلاعات املاک به فرمت مناسب برای نمایش
    const safeProperties = properties.map(property => ({
      ...property,
      _id: property._id.toString()
    }));
    
    return <PropertyReservations reservations={safeReservations} properties={safeProperties} />;
  } catch (error) {
    console.log("Error in property reservations page:", error);
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">مدیریت رزروها</h1>
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          خطایی در بارگذاری رزروها رخ داده است. لطفا دوباره تلاش کنید.
        </div>
      </div>
    );
  }
};

export default Page;
