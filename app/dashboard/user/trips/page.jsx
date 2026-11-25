import connectDB from "@/config/db";
import TripCalendar from "@/components/user/trip-calendar";
import Reservation from "@/models/Reservation";
import { getUser } from "@/lib/helpers";
import { notFound } from "next/navigation";

export const metadata = {
  title: "تقویم سفرهای من",
};

export const dynamic = 'force-dynamic';

const TripsPage = async () => {
  try {
    await connectDB();

    const user = await getUser();
    
    if (!user || !user._id) {
      return notFound();
    }

    // Fetch user reservations
    const reservations = await Reservation.find({
      user: user._id,
      status: { $in: ['pending', 'confirmed'] }
    })
      .sort({ createdAt: -1 })
      .select('_id itemType itemId checkInDate checkOutDate date dates guests amount status createdAt')
      .lean();

    // Convert ObjectId to string for JSON serialization
    const safeReservations = reservations.map(reservation => ({
      ...reservation,
      _id: reservation._id?.toString() || null,
      user: reservation.user?.toString() || null,
      itemId: reservation.itemId?.toString() || null,
      targetUser: reservation.targetUser?.toString() || null,
      guests: reservation.guests || { adults: 0, children: 0 },
      amount: reservation.amount || 0,
      status: reservation.status || 'pending',
      itemType: reservation.itemType || 'property'
    }));

    return <TripCalendar reservations={safeReservations} />;
  } catch (error) {
    console.log("Error in trips page:", error);
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">تقویم سفرهای من</h1>
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          خطایی در بارگذاری تقویم سفرها رخ داده است. لطفا دوباره تلاش کنید.
        </div>
      </div>
    );
  }
};

export default TripsPage;
