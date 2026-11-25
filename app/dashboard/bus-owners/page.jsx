import Link from "next/link";

import connectDB from "@/config/db";
import Bus from "@/models/Bus";
import Reservation from "@/models/Reservation";
import WithdrawalRequest from "@/models/WithdrawalRequest";

import BusCard from "@/components/global/bus-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


import { getUser } from "@/lib/helpers";

import { buttonVariants } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Star,
  Eye,
  Bus as BusIcon,
  Wallet,
  AlertCircle,
  MapPin,
  Users
} from "lucide-react";

export const metadata = {
  title: "اتوبوس های من",
};

const Page = async () => {
  const user = await getUser();

  if (!user) {
    return (
      <div className="p-4">
        <p className="text-red-600">لطفاً وارد حساب کاربری خود شوید</p>
      </div>
    );
  }

  await connectDB();

  const buses = await Bus.find({ owner: user._id })
    .populate("reservations")
    .populate("comments")
    .sort({ createdAt: -1 })
    .lean();

  // آمار کلی
  const totalBuses = buses.length;
  const approvedBuses = buses.filter(b => b.status === 'approved').length;

  // آمار رزروها - فقط رزروهای معتبر (تایید شده یا تکمیل شده)
  const allReservations = await Reservation.find({
    itemType: "bus",
    itemId: { $in: buses.map(b => b._id) },
    status: { $in: ["confirmed", "completed"] }
  }).lean();

  const totalReservations = allReservations.length;

  // محاسبه درآمد - روش ساده
  let totalEarnings = 0;
  let userPayments = [];
  let paidPayments = [];

  // فقط اگر اتوبوسی وجود داشت
  if (buses.length > 0) {
    try {
      const Payment = (await import("@/models/Payment")).default;

      // تمام Payment‌های مربوط به این کاربر
      userPayments = await Payment.find({
        targetUser: user._id,
        status: "paid"
      }).lean();

      totalEarnings = userPayments.reduce((sum, payment) => {
        return sum + (payment.amount || 0);
      }, 0);

      paidPayments = userPayments; // برای نمایش

    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  }



  // آمار نظرات
  const allComments = buses.flatMap(b => b.comments || []);
  const averageRating = allComments.length > 0
    ? (allComments.reduce((sum, comment) => sum + comment.rating, 0) / allComments.length).toFixed(1)
    : 0;

  // گروه‌بندی اتوبوس‌ها بر اساس مسیر - شامل همه اتوبوس‌ها حتی بدون رزرو
  const routesByBuses = {};

  // اول همه اتوبوس‌ها را به مسیرها اضافه کن
  buses.forEach(bus => {
    if (bus.from?.city && bus.to?.city) {
      const route = `${bus.from.city} - ${bus.to.city}`;
      if (!routesByBuses[route]) {
        routesByBuses[route] = {
          route,
          count: 0,
          earnings: 0,
          buses: new Set()
        };
      }
      routesByBuses[route].buses.add(bus._id.toString());
    }
  });

  // بعد رزروها را اضافه کن
  allReservations.forEach(reservation => {
    if (reservation.itemId) {
      const busData = buses.find(b => b._id.toString() === reservation.itemId.toString());
      if (busData && busData.from?.city && busData.to?.city) {
        const route = `${busData.from.city} - ${busData.to.city}`;
        if (routesByBuses[route]) {
          routesByBuses[route].count++;
          routesByBuses[route].earnings += (reservation.amount || reservation.basePrice || 0);
        }
      }
    }
  });

  const routeStats = Object.values(routesByBuses).map(route => ({
    ...route,
    buses: route.buses.size
  }));

  // درخواست‌های برداشت
  const pendingWithdrawals = await WithdrawalRequest.countDocuments({
    user: user._id,
    status: "pending"
  });

  const totalWithdrawalsResult = await WithdrawalRequest.aggregate([
    { $match: { user: user._id, status: "completed" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);
  const totalWithdrawals = totalWithdrawalsResult[0]?.total || 0;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">پنل مدیریت اتوبوس‌ها</h1>

        <div className="flex gap-3">
          <Link
            href="/dashboard/bus-owners/reservations"
            className={buttonVariants({ variant: "outline" })}
          >
            مدیریت رزروها
          </Link>
          <Link
            href="/dashboard/bus-owners/buses/new"
            className={buttonVariants({})}
          >
            ایجاد وسیله جدید
          </Link>
        </div>
      </div>





      {/* آمار کلی */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل اتوبوس‌ها</CardTitle>
            <BusIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBuses}</div>
            <p className="text-xs text-muted-foreground">
              {approvedBuses} تایید شده
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل رزروها</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReservations}</div>
            <p className="text-xs text-muted-foreground">
              رزرو انجام شده
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل درآمد</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalEarnings.toLocaleString("fa-IR")}
            </div>
            <p className="text-xs text-muted-foreground">
              تومان ({paidPayments.length} پرداخت موفق)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">امتیاز میانگین</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {averageRating > 0 ? averageRating : "بدون امتیاز"}
            </div>
            <p className="text-xs text-muted-foreground">
              از {allComments.length} نظر
            </p>
          </CardContent>
        </Card>
      </div>

      {/* آمار مسیرها */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              آمار مسیرها
            </CardTitle>
          </CardHeader>
          <CardContent>
            {routeStats.length > 0 ? (
              <div className="space-y-3">
                {routeStats.slice(0, 5).map((route, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{route.route}</span>
                      <p className="text-xs text-muted-foreground">
                        {route.count} رزرو • {route.buses} اتوبوس
                      </p>
                    </div>
                    <span className="font-medium text-green-600">
                      {route.earnings.toLocaleString("fa-IR")} تومان
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">هنوز رزروی ثبت نشده است</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              وضعیت مالی
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">موجودی کیف پول:</span>
              <span className="font-medium text-green-600">
                {(user.wallet?.balance || 0).toLocaleString("fa-IR")} تومان
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">کل برداشت‌ها:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-red-600">{totalWithdrawals.toLocaleString("fa-IR")} تومان</span>
                {pendingWithdrawals > 0 && (
                  <Badge variant="secondary">{pendingWithdrawals} در انتظار</Badge>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">حساب بانکی:</span>
              <div className="flex items-center gap-2">
                {user.bankInfo?.shebaNumber ? (
                  <Badge variant="default">تکمیل شده</Badge>
                ) : (
                  <Badge variant="destructive">ناقص</Badge>
                )}
              </div>
            </div>
            <div className="pt-3 border-t">
              <Link
                href="/dashboard/financial"
                className={buttonVariants({ variant: "default", className: "w-full" })}
              >
                <Wallet className="w-4 h-4 mr-2" />
                مدیریت مالی و درخواست برداشت
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* هشدارها */}
      {(!user.bankInfo?.shebaNumber || pendingWithdrawals > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              نکات مهم
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!user.bankInfo?.shebaNumber && (
              <p className="text-orange-700">
                • لطفاً اطلاعات حساب بانکی خود را در بخش پروفایل تکمیل کنید.
              </p>
            )}
            {pendingWithdrawals > 0 && (
              <p className="text-orange-700">
                • شما {pendingWithdrawals} درخواست برداشت در انتظار دارید.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* لیست اتوبوس‌ها */}
      <Card>
        <CardHeader>
          <CardTitle>اتوبوس‌های من</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {buses?.length ? (
              buses.map((bus) => (
                <BusCard
                  key={bus._id}
                  isPanel={true}
                  bus={JSON.parse(JSON.stringify(bus))}
                />
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground py-8">
                هیچ وسیله نقلیه‌ای یافت نشد.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
