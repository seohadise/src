import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import connectDB from "@/config/db";
import User from "@/models/User";
import Property from "@/models/Property";
import Bus from "@/models/Bus";
import Food from "@/models/Food";
import Commission from "@/models/Commission";
import Reservation from "@/models/Reservation";
import Visit from "@/models/Visit";
import WithdrawalRequest from "@/models/WithdrawalRequest";
import {
  Users,
  Building,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Bus as BusIcon,
  UtensilsCrossed,
  UserCheck,
  Wallet,
  PieChart,
  Eye,
  BarChart3
} from "lucide-react";

const AdminDashboard = async () => {
  await connectDB();

  // آمار کاربران
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isVerified: true, isBanned: false });
  const newUsersThisMonth = await User.countDocuments({
    createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
  });

  // آمار املاک
  const totalProperties = await Property.countDocuments();
  const approvedProperties = await Property.countDocuments({ status: "approved" });
  const pendingProperties = await Property.countDocuments({ status: "pending" });

  // آمار اتوبوس‌ها
  const totalBuses = await Bus.countDocuments();
  const approvedBuses = await Bus.countDocuments({ status: "approved" });
  const pendingBuses = await Bus.countDocuments({ status: "pending" });
  const activeBusOwners = await User.countDocuments({
    buses: { $exists: true, $not: { $size: 0 } },
    isVerified: true,
    isBanned: false
  });

  // آمار غذاهای خانگی
  const totalFoods = await Food.countDocuments();
  const approvedFoods = await Food.countDocuments({ status: "approved" });
  const pendingFoods = await Food.countDocuments({ status: "pending" });

  // آمار درخواست‌های برداشت
  const pendingWithdrawals = await WithdrawalRequest.countDocuments({ status: "pending" });
  const activeFoodOwners = await User.countDocuments({
    foods: { $exists: true, $not: { $size: 0 } },
    isVerified: true,
    isBanned: false
  });

  // آمار کارمزدها
  const commissionStats = await Commission.getCommissionStats();
  const thisMonthCommissions = await Commission.getCommissionStats(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    new Date().toISOString()
  );

  // آمار رزروها - فقط رزروهای تایید شده و تکمیل شده در آمار لحاظ می‌شوند
  // رزروهای pending (در انتظار تایید مالک) در آمار مالی محاسبه نمی‌شوند
  const totalReservations = await Reservation.countDocuments({
    status: { $in: ["confirmed", "completed"] }
  });
  const confirmedReservations = await Reservation.countDocuments({ status: "confirmed" });
  const pendingReservations = await Reservation.countDocuments({ status: "pending" });

  // آمار رزروها بر اساس نوع - فقط رزروهای معتبر (تایید شده یا تکمیل شده)
  const propertyReservations = await Reservation.countDocuments({
    itemType: "property",
    status: { $in: ["confirmed", "completed"] }
  });
  const busReservations = await Reservation.countDocuments({
    itemType: "bus",
    status: { $in: ["confirmed", "completed"] }
  });
  const foodReservations = await Reservation.countDocuments({
    itemType: "food",
    status: { $in: ["confirmed", "completed"] }
  });

  // آمار بازدید
  const todayVisitStats = await Visit.getTodayStats();
  const dailyVisitStats = await Visit.getDailyStats(7);
  const pageTypeStats = await Visit.getPageTypeStats(7);
  const totalVisits = await Visit.countDocuments();

  // آمار کارمزدهای امروز
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayCommissions = await Commission.aggregate([
    {
      $match: {
        status: "collected",
        collectedAt: { $gte: todayStart, $lte: todayEnd }
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$commissionAmount" },
        count: { $sum: 1 }
      }
    }
  ]);

  const todayCommissionData = todayCommissions[0] || { totalAmount: 0, count: 0 };

  // آمار مالی کل
  const totalRevenue = await Reservation.aggregate([
    { $match: { paymentStatus: "paid" } },
    { $group: { _id: null, total: { $sum: "$totalPrice" } } }
  ]);
  const totalRevenueAmount = totalRevenue[0]?.total || 0;

  // آمار واریز وجه (کل مبلغ پرداخت شده به مالکان)
  const totalWithdrawals = await Commission.aggregate([
    { $match: { status: "paid" } },
    { $group: { _id: null, total: { $sum: "$baseAmount" } } }
  ]);
  const totalWithdrawalAmount = totalWithdrawals[0]?.total || 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " تومان";
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat("fa-IR").format(number);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">داشبورد مدیریت</h1>
        <Badge variant="outline" className="text-sm">
          آخرین بروزرسانی: {new Intl.DateTimeFormat("fa-IR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          }).format(new Date())}
        </Badge>
      </div>

      {/* آمار بازدید روزانه */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">بازدید امروز</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{formatNumber(todayVisitStats.totalVisits)}</div>
            <p className="text-xs text-blue-600">
              {formatNumber(todayVisitStats.uniqueVisitors)} بازدیدکننده یکتا
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل بازدیدها</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{formatNumber(totalVisits)}</div>
            <p className="text-xs text-green-600">
              از ابتدا تاکنون
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل کاربران</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalUsers)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(activeUsers)} کاربر فعال
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل املاک</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalProperties)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(approvedProperties)} تایید شده
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل اتوبوس‌ها</CardTitle>
            <BusIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalBuses)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(approvedBuses)} تایید شده
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل غذاهای خانگی</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalFoods)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(approvedFoods)} تایید شده
            </p>
          </CardContent>
        </Card>
      </div>

      {/* آمار کاربران و رزروها */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کاربران فعال</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatNumber(activeUsers)}</div>
            <p className="text-xs text-muted-foreground">
              از {formatNumber(totalUsers)} کاربر کل
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">اتوبوس‌داران فعال</CardTitle>
            <BusIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatNumber(activeBusOwners)}</div>
            <p className="text-xs text-muted-foreground">
              دارای اتوبوس فعال
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">آشپزهای خانگی</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatNumber(activeFoodOwners)}</div>
            <p className="text-xs text-muted-foreground">
              دارای غذای فعال
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل رزروها</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalReservations)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(confirmedReservations)} تایید شده
            </p>
          </CardContent>
        </Card>
      </div>

      {/* آمار مالی */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل سود</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(commissionStats.totalCommissions)}
            </div>
            <p className="text-xs text-muted-foreground">
              از {formatNumber(commissionStats.totalTransactions)} تراکنش
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل عود وجه</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalRevenueAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              کل درآمد سایت
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">واریز وجه</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(totalWithdrawalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              پرداخت شده به مالکان
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کارمزد امروز</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(todayCommissionData.totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(todayCommissionData.count)} تراکنش
            </p>
          </CardContent>
        </Card>
      </div>

      {/* آمار کارمزدها */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              آمار کارمزدهای کل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">کل کارمزدهای دریافتی:</span>
              <span className="font-bold text-green-600">
                {formatCurrency(commissionStats.totalCommissions)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">تعداد تراکنش‌ها:</span>
              <span className="font-medium">
                {formatNumber(commissionStats.totalTransactions)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">میانگین کارمزد:</span>
              <span className="font-medium">
                {formatCurrency(Math.round(commissionStats.averageCommission))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">کل مبلغ رزروها:</span>
              <span className="font-medium">
                {formatCurrency(commissionStats.totalBaseAmount)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              آمار این ماه
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">کارمزد این ماه:</span>
              <span className="font-bold text-blue-600">
                {formatCurrency(thisMonthCommissions.totalCommissions)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">تراکنش‌های این ماه:</span>
              <span className="font-medium">
                {formatNumber(thisMonthCommissions.totalTransactions)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">کاربران جدید:</span>
              <span className="font-medium">
                {formatNumber(newUsersThisMonth)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* آمار تفکیکی رزروها */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-500" />
              رزروهای ملک
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatNumber(propertyReservations)}
            </div>
            <p className="text-sm text-muted-foreground">
              رزرو املاک
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BusIcon className="h-5 w-5 text-green-500" />
              رزروهای اتوبوس
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatNumber(busReservations)}
            </div>
            <p className="text-sm text-muted-foreground">
              رزرو اتوبوس‌ها
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-orange-500" />
              سفارشات غذا
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {formatNumber(foodReservations)}
            </div>
            <p className="text-sm text-muted-foreground">
              سفارش غذاهای خانگی
            </p>
          </CardContent>
        </Card>
      </div>

      {/* وضعیت‌های مختلف */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              در انتظار تایید
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">املاک:</span>
              <span className="font-bold text-yellow-600">{formatNumber(pendingProperties)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">اتوبوس‌ها:</span>
              <span className="font-bold text-yellow-600">{formatNumber(pendingBuses)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">غذاها:</span>
              <span className="font-bold text-yellow-600">{formatNumber(pendingFoods)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">رزروها:</span>
              <span className="font-bold text-yellow-600">{formatNumber(pendingReservations)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">درخواست‌های برداشت:</span>
              <span className="font-bold text-yellow-600">{formatNumber(pendingWithdrawals)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              تایید شده‌ها
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">املاک:</span>
              <span className="font-bold text-green-600">{formatNumber(approvedProperties)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">اتوبوس‌ها:</span>
              <span className="font-bold text-green-600">{formatNumber(approvedBuses)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">غذاها:</span>
              <span className="font-bold text-green-600">{formatNumber(approvedFoods)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">رزروها:</span>
              <span className="font-bold text-green-600">{formatNumber(confirmedReservations)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-500" />
              نمایش میزان کل سود
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(commissionStats.totalCommissions)}
            </div>
            <div className="flex justify-between text-sm">
              <span>درآمد کل:</span>
              <span className="font-medium">{formatCurrency(totalRevenueAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>پرداخت به مالکان:</span>
              <span className="font-medium">{formatCurrency(totalWithdrawalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>سود خالص:</span>
              <span className="font-bold text-green-600">
                {formatCurrency(totalRevenueAmount - totalWithdrawalAmount)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نمودار بازدید روزانه */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              آمار بازدید ۷ روز اخیر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailyVisitStats.length > 0 ? (
                dailyVisitStats.map((day, index) => {
                  const maxVisits = Math.max(...dailyVisitStats.map(d => d.totalVisits));
                  const percentage = maxVisits > 0 ? (day.totalVisits / maxVisits) * 100 : 0;
                  const dateStr = new Intl.DateTimeFormat("fa-IR", {
                    weekday: "short",
                    month: "short",
                    day: "numeric"
                  }).format(new Date(day.date));
                  
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{dateStr}</span>
                        <span className="font-medium">
                          {formatNumber(day.totalVisits)} بازدید ({formatNumber(day.uniqueVisitors)} یکتا)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  هنوز بازدیدی ثبت نشده است
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-500" />
              بازدید بر اساس نوع صفحه
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pageTypeStats.length > 0 ? (
                pageTypeStats.map((stat, index) => {
                  const pageTypeLabels = {
                    home: "صفحه اصلی",
                    property: "صفحات ملک",
                    bus: "صفحات اتوبوس",
                    food: "صفحات غذا",
                    search: "جستجو",
                    other: "سایر"
                  };
                  const pageTypeColors = {
                    home: "bg-blue-500",
                    property: "bg-green-500",
                    bus: "bg-purple-500",
                    food: "bg-orange-500",
                    search: "bg-yellow-500",
                    other: "bg-gray-500"
                  };
                  const totalPageVisits = pageTypeStats.reduce((sum, s) => sum + s.count, 0);
                  const percentage = totalPageVisits > 0 ? (stat.count / totalPageVisits) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${pageTypeColors[stat._id] || "bg-gray-500"}`} />
                        <span className="text-sm">{pageTypeLabels[stat._id] || stat._id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatNumber(stat.count)}</span>
                        <span className="text-xs text-muted-foreground">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  هنوز بازدیدی ثبت نشده است
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جزئیات تکمیلی */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              جزئیات ملک، اتوبوس، غذا
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">املاک:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>کل:</span>
                  <span className="font-medium">{formatNumber(totalProperties)}</span>
                </div>
                <div className="flex justify-between">
                  <span>تایید شده:</span>
                  <span className="font-medium text-green-600">{formatNumber(approvedProperties)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm">اتوبوس‌ها:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>کل:</span>
                  <span className="font-medium">{formatNumber(totalBuses)}</span>
                </div>
                <div className="flex justify-between">
                  <span>تایید شده:</span>
                  <span className="font-medium text-green-600">{formatNumber(approvedBuses)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm">غذاهای خانگی:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>کل:</span>
                  <span className="font-medium">{formatNumber(totalFoods)}</span>
                </div>
                <div className="flex justify-between">
                  <span>تایید شده:</span>
                  <span className="font-medium text-green-600">{formatNumber(approvedFoods)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              قابلیت واریز وجه
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">کل درآمد سایت:</span>
                <span className="font-bold text-blue-600">{formatCurrency(totalRevenueAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">واریز شده به مالکان:</span>
                <span className="font-bold text-purple-600">{formatCurrency(totalWithdrawalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">کارمزد دریافتی:</span>
                <span className="font-bold text-green-600">{formatCurrency(commissionStats.totalCommissions)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-semibold">سود خالص:</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(totalRevenueAmount - totalWithdrawalAmount)}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                قابلیت واریز وجه به حساب خودم و مابقی قیمت و کارت شناسایی نیست.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
