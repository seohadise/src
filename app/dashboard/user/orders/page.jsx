import connectDB from "@/config/db";
import Orders from "@/components/user/orders";
import Reservation from "@/models/Reservation";

import { getUser } from "@/lib/helpers";
import { notFound } from "next/navigation";

export const metadata = {
  title: "سفارشات من",
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

    // ساده‌ترین روش ممکن برای واکشی رزروها
    let orders = [];
    try {
      // Import models
      const Property = (await import("@/models/Property")).default;
      const Bus = (await import("@/models/Bus")).default;
      const Food = (await import("@/models/Food")).default;

      // فقط رزروهای تایید شده یا در انتظار تایید را نمایش بده
      const reservations = await Reservation.find({
        user: user._id,
        status: { $in: ['pending', 'confirmed'] }
      })
        .sort({ createdAt: -1 })
        .select('_id itemType itemId checkInDate checkOutDate date dates guests amount status specialRequests createdAt')
        .lean();

      // Populate itemId manually based on itemType
      orders = await Promise.all(reservations.map(async (reservation) => {
        let itemDetails = null;
        try {
          if (reservation.itemType === 'property') {
            itemDetails = await Property.findById(reservation.itemId).select('name address').lean();
          } else if (reservation.itemType === 'bus') {
            itemDetails = await Bus.findById(reservation.itemId).select('vehicle from to departureTime arrivalTime price').lean();
          } else if (reservation.itemType === 'food') {
            itemDetails = await Food.findById(reservation.itemId).select('name foods price address').lean();
          }
        } catch (err) {
          console.log("Error fetching item details:", err);
        }
        
        return {
          ...reservation,
          itemDetails
        };
      }));
    } catch (error) {
      console.log("Error fetching reservations:", error);
      orders = [];
    }

    // تبدیل ObjectId به string برای JSON serialization
    const safeOrders = orders.map(order => {
      try {
        const isConfirmed = order.status === 'confirmed' || order.status === 'completed';
        let safeItemDetails = order.itemDetails ? { ...order.itemDetails } : null;
        if (safeItemDetails) {
          if (safeItemDetails._id) safeItemDetails._id = safeItemDetails._id.toString();
          // آدرس کامل فقط برای رزروهای تأیید شده
          if (safeItemDetails.address && isConfirmed) {
            safeItemDetails.fullAddress = safeItemDetails.address.fullAddress || null;
          } else {
            safeItemDetails.fullAddress = null;
          }
        }
        return {
          ...order,
          _id: order._id?.toString() || null,
          user: order.user?.toString() || null,
          itemId: order.itemId?.toString() || null,
          targetUser: order.targetUser?.toString() || null,
          itemDetails: safeItemDetails,
          // اطمینان از وجود فیلدهای ضروری
          guests: order.guests || { adults: 0, children: 0 },
          amount: order.amount || 0,
          status: order.status || 'pending',
          itemType: order.itemType || 'property'
        };
      } catch (error) {
        console.error("Error processing order:", error);
        return null;
      }
    }).filter(order => order !== null);
    
    return <Orders reservations={safeOrders} />;
  } catch (error) {
    console.log("Error in orders page:", error);
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">سفارشات من</h1>
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          خطایی در بارگذاری سفارشات رخ داده است. لطفا دوباره تلاش کنید.
        </div>
      </div>
    );
  }
};

export default Page;
