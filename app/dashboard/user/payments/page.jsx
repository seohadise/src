import Payments from "@/components/user/payments";

import connectDB from "@/config/db";
import Payment from "@/models/Payment";

import { getUser } from "@/lib/helpers";
import { notFound } from "next/navigation";

export const metadata = {
  title: "لیست پرداخت های من",
};

// اجبار به dynamic rendering برای استفاده از cookies
export const dynamic = 'force-dynamic';

const Page = async () => {
  try {
    await connectDB();
    
    const user = await getUser();
    
    if (!user || !user._id) {
      console.error("User not found or missing _id");
      return notFound();
    }

    const payments = await Payment.find({ user: user._id }).sort({
      createdAt: -1,
    }).lean();
    
    // اطمینان از اینکه داده‌ها قبل از سریالایز کردن معتبر هستند
    const safePayments = payments.filter(payment => payment !== null && payment !== undefined);
    
    return <Payments payments={JSON.parse(JSON.stringify(safePayments))} />;
  } catch (error) {
    console.error("Error in payments page:", error);
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">پرداخت‌های من</h1>
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          خطایی در بارگذاری پرداخت‌ها رخ داده است. لطفا دوباره تلاش کنید.
        </div>
      </div>
    );
  }
};

export default Page;
