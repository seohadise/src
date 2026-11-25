  import Financial from "@/components/user/financial";

  import connectDB from "@/config/db";
  import Transaction from "@/models/Transaction";
  import Payment from "@/models/Payment";
  import Commission from "@/models/Commission";
  import Reservation from "@/models/Reservation";

  import { getUser } from "@/lib/helpers";
  import { redirect } from "next/navigation";

  export const metadata = {
    title: "مالی",
  };

  // اجبار به dynamic rendering برای استفاده از cookies
  export const dynamic = 'force-dynamic';

  const FinancialPage = async () => {
    const user = await getUser();

    if (!user?._id) {
      redirect("/auth");
    }

    await connectDB();

    // دریافت تراکنش‌ها
    const transactions = await Transaction.find({ user: user._id })
      .sort({ createdAt: -1 })
      .lean();

    // دریافت پرداخت‌های موفق کاربر (پرداخت‌هایی که خودش انجام داده)
    const successfulPayments = await Payment.find({
      user: user._id,
      status: "paid"
    })
      .populate('propertyId', 'name')
      .populate('busId', 'title')
      .populate('foodId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // محاسبه درآمد - مانند داشبورد اتوبوس‌دار
    let totalEarnings = 0;
    let userPayments = [];
    let paidPayments = [];

    // دریافت غذاها، اتوبوس‌ها و املاک کاربر
    const Food = (await import("@/models/Food")).default;
    const Bus = (await import("@/models/Bus")).default;
    const Property = (await import("@/models/Property")).default;

    const foods = await Food.find({ owner: user._id }).lean();
    const buses = await Bus.find({ owner: user._id }).lean();
    const properties = await Property.find({ owner: user._id }).lean();

    const allItemIds = [
      ...foods.map(f => f._id),
      ...buses.map(b => b._id),
      ...properties.map(p => p._id)
    ];



    if (allItemIds.length > 0) {
      try {
        // تمام Payment‌های مربوط به این کاربر
        userPayments = await Payment.find({
          targetUser: user._id,
          status: { $in: ["paid", "success"] }
        }).lean();

        // اگر targetUser خالی بود، از foodId/busId/propertyId استفاده کن
        if (userPayments.length === 0) {
          userPayments = await Payment.find({
            $or: [
              { foodId: { $in: foods.map(f => f._id) } },
              { busId: { $in: buses.map(b => b._id) } },
              { propertyId: { $in: properties.map(p => p._id) } }
            ],
            status: { $in: ["paid", "success"] }
          }).lean();
        }

        totalEarnings = userPayments.reduce((sum, payment) => {
          return sum + (payment.amount || 0);
        }, 0);

        paidPayments = userPayments; // برای نمایش

      } catch (error) {
        console.error("Error fetching payments:", error);
      }
    }

    // دریافت کارمزدهای واقعی از دیتابیس - فقط collected (تایید شده)
    const realCommissions = await Commission.find({ 
      user: user._id,
      status: "collected" // فقط کارمزدهای تایید شده (پس از تایید رزرو)
    })
      .populate('itemId', 'name title')
      .sort({ createdAt: -1 })
      .lean();

    // اگر کارمزد واقعی نبود، از Payment بساز
    let commissions = realCommissions;
    if (realCommissions.length === 0 && userPayments.length > 0) {
      commissions = userPayments.map(payment => ({
        _id: payment._id,
        user: payment.targetUser || user._id,
        itemType: payment.busId ? 'bus' : payment.propertyId ? 'property' : payment.foodId ? 'food' : 'unknown',
        itemId: payment.busId || payment.propertyId || payment.foodId,
        baseAmount: payment.basePrice || payment.amount || 0,
        commissionAmount: payment.commissionAmount || Math.round((payment.amount || 0) * 0.06),
        commissionRate: payment.commissionRate || 6,
        status: 'collected',
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      }));
    }

    // دریافت رزروهای کاربر (رزروهایی که خودش انجام داده)
    const userReservations = await Reservation.find({
      user: user._id
    })
      .populate('itemId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // دریافت رزروهای دریافتی (رزروهایی که برای املاک/اتوبوس/غذای او انجام شده)
    const receivedReservations = await Reservation.find({
      targetUser: user._id
    })
      .populate('itemId', 'name title')
      .populate('user', 'fullName')
      .sort({ createdAt: -1 })
      .lean();



    // ترکیب رزروها
    const allReservations = [...userReservations, ...receivedReservations];

    return (
      <Financial
        user={JSON.parse(JSON.stringify(user))}
        transactions={JSON.parse(JSON.stringify(transactions))}
        payments={JSON.parse(JSON.stringify(successfulPayments))}
        commissions={JSON.parse(JSON.stringify(commissions))}
        reservations={JSON.parse(JSON.stringify(allReservations))}
      />
    );
  };

  export default FinancialPage;
