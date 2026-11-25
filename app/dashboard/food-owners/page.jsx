import Link from "next/link";

import connectDB from "@/config/db";
import Food from "@/models/Food";
import Reservation from "@/models/Reservation";
import WithdrawalRequest from "@/models/WithdrawalRequest";

import FoodCard from "@/components/global/food-card";
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
  UtensilsCrossed,
  Wallet,
  AlertCircle
} from "lucide-react";

export const metadata = {
  title: "آشپزخانه‌های من",
};

const Page = async () => {
  const user = await getUser();

  await connectDB();

  const foods = await Food.find({ owner: user?._id })
    .populate("reservations")
    .populate("comments")
    .sort({ createdAt: -1 })
    .lean();

  // محاسبه درآمد از رزروهای تایید شده یا تکمیل شده (نه رد شده یا لغو شده)
  const validReservations = await Reservation.find({
    targetUser: user._id,
    status: { $in: ["confirmed", "completed"] }
  }).lean();

  // آمار کلی
  const totalFoods = foods.length;
  const approvedFoods = foods.filter(f => f.status === 'approved').length;
  const totalOrders = validReservations.length;
  const totalEarnings = validReservations.reduce((sum, reservation) => {
    return sum + (reservation.amount || 0);
  }, 0);

  // آمار نظرات
  const allComments = foods.flatMap(f => f.comments || []);
  const averageRating = allComments.length > 0
    ? (allComments.reduce((sum, comment) => sum + comment.rating, 0) / allComments.length).toFixed(1)
    : 0;

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
        <h1 className="font-bold text-2xl">پنل مدیریت آشپزخانه‌ها</h1>

        <div className="flex gap-3">
          <Link
            href="/dashboard/food-owners/reservations"
            className={buttonVariants({ variant: "outline" })}
          >
            مدیریت رزروها
          </Link>
          <Link
            href="/dashboard/food-owners/foods/new"
            className={buttonVariants({})}
          >
            ایجاد آشپزخانه جدید
          </Link>
        </div>
      </div>

      {/* آمار کلی */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل آشپزخانه‌ها</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFoods}</div>
            <p className="text-xs text-muted-foreground">
              {approvedFoods} تایید شده
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل سفارشات</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              سفارش تایید شده
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
            <p className="text-xs text-muted-foreground">تومان</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">میانگین امتیاز</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRating}</div>
            <p className="text-xs text-muted-foreground">
              از {allComments.length} نظر
            </p>
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

      {/* لیست آشپزخانه‌ها */}
      <Card>
        <CardHeader>
          <CardTitle>آشپزخانه‌های من</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {foods?.length ? (
              foods.map((food) => (
                <FoodCard
                  key={food._id}
                  isPanel={true}
                  food={JSON.parse(JSON.stringify(food))}
                />
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground py-8">
                هیچ آشپزخانه‌ای یافت نشد.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;