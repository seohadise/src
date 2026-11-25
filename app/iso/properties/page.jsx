import connectDB from "@/config/db";
import Property from "@/models/Property";
import Reservation from "@/models/Reservation";
import Payment from "@/models/Payment";

import { columns } from "@/components/admin/properties/columns";
import { DataTable } from "@/components/admin/properties/data-table";

export const metadata = {
  title: "ملک های های وبسایت",
};

const Page = async () => {
  await connectDB();

  const properties = await Property.find({})
    .populate("owner")
    .sort({ createdAt: -1 })
    .lean();

  // محاسبه رزروها و درآمدها برای هر ملک
  const propertiesWithStats = await Promise.all(
    properties.map(async (property) => {
      // تعداد رزروهای تایید شده
      const reservationsCount = await Reservation.countDocuments({
        itemType: "property",
        itemId: property._id,
        status: "confirmed"
      });

      // کل درآمد از رزروهای تایید شده
      const reservations = await Reservation.find({
        itemType: "property",
        itemId: property._id,
        status: "confirmed"
      }).lean();

      const totalEarnings = reservations.reduce((sum, reservation) => {
        return sum + (reservation.amount || 0);
      }, 0);

      // پرداخت‌های موفق برای این ملک
      const successfulPayments = await Payment.find({
        propertyId: property._id,
        status: "paid"
      }).lean();

      const totalPayments = successfulPayments.reduce((sum, payment) => {
        return sum + (payment.amount || 0);
      }, 0);

      return {
        ...property,
        reservationsCount,
        totalEarnings: Math.max(totalEarnings, totalPayments), // بیشترین مقدار
        successfulPaymentsCount: successfulPayments.length
      };
    })
  );

  return (
    <div className="p-3 space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-xl ">ملک ها</h2>
      </div>
      <DataTable
        columns={columns}
        data={JSON.parse(JSON.stringify(propertiesWithStats))}
      />
    </div>
  );
};

export default Page;
