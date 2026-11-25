import connectDB from "@/config/db";
import Property from "@/models/Property";
import Payment from "@/models/Payment";
import Reservation from "@/models/Reservation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getUser } from "@/lib/helpers";
import { notFound } from "next/navigation";
import Link from "next/link";

import { ArrowLeft, DollarSign, Calendar, CreditCard, TrendingUp } from "lucide-react";

export const metadata = {
  title: "گزارش مالی آگهی",
};

const Page = async ({ params }) => {
  const { propertyId } = params;
  
  await connectDB();
  
  const user = await getUser();
  
  // بررسی وجود ملک و مالکیت آن
  const property = await Property.findOne({
    _id: propertyId,
    owner: user._id
  }).lean();
  
  if (!property) {
    return notFound();
  }
  
  // دریافت رزروهای مربوط به این ملک
  const reservations = await Reservation.find({ 
    itemType: "property",
    itemId: propertyId 
  }).lean();
  
  // دریافت پرداخت‌های مربوط به این ملک
  // Payment از propertyId یا itemId استفاده می‌کند، نه reservation
  const payments = await Payment.find({
    $or: [
      { propertyId: propertyId },
      { itemId: propertyId, itemType: "property" }
    ],
    status: { $in: ["paid", "success"] } // وضعیت‌های موفق
  })
  .sort({ createdAt: -1 })
  .lean();
  
  // محاسبه آمار مالی
  const totalPayments = payments.length;
  const totalEarnings = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const totalCommission = payments.reduce((sum, payment) => sum + (payment.commissionAmount || payment.commission || 0), 0);
  const netEarnings = totalEarnings - totalCommission;
  
  // گروه‌بندی پرداخت‌ها بر اساس ماه
  const paymentsByMonth = payments.reduce((acc, payment) => {
    const date = new Date(payment.createdAt);
    const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!acc[monthYear]) {
      acc[monthYear] = {
        month: new Date(date.getFullYear(), date.getMonth(), 1),
        count: 0,
        amount: 0,
        commission: 0
      };
    }
    
    acc[monthYear].count += 1;
    acc[monthYear].amount += (payment.amount || 0);
    acc[monthYear].commission += (payment.commissionAmount || payment.commission || 0);
    
    return acc;
  }, {});
  
  // تبدیل به آرایه و مرتب‌سازی بر اساس تاریخ (نزولی)
  const monthlyStats = Object.values(paymentsByMonth).sort((a, b) => b.month - a.month);
  
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">گزارش مالی آگهی</h1>
        
        <Link href={`/dashboard/property-owners/properties/edit/${propertyId}`}>
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            بازگشت به مدیریت ملک
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            اطلاعات ملک
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">نام ملک:</span>
            <span>{property.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">شهر:</span>
            <span>{property.address?.city}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">وضعیت:</span>
            <Badge variant={property.status === "approved" ? "success" : "warning"}>
              {property.status === "approved" ? "تایید شده" : "در انتظار تایید"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">قیمت پایه:</span>
            <span>{(property.pricing?.regularPrice || property.price || 0).toLocaleString("fa-IR")} تومان / شب</span>
          </div>
        </CardContent>
      </Card>
      
      {/* آمار مالی */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تعداد پرداخت‌ها</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayments}</div>
            <p className="text-xs text-muted-foreground">
              پرداخت موفق
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">درآمد ناخالص</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalEarnings.toLocaleString("fa-IR")}
            </div>
            <p className="text-xs text-muted-foreground">
              تومان
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کمیسیون سایت</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalCommission.toLocaleString("fa-IR")}</div>
            <p className="text-xs text-muted-foreground">
              تومان
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">درآمد خالص</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{netEarnings.toLocaleString("fa-IR")}</div>
            <p className="text-xs text-muted-foreground">
              تومان
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* آمار ماهانه */}
      <Card>
        <CardHeader>
          <CardTitle>آمار ماهانه</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyStats.length > 0 ? (
            <Table>
              <TableCaption>گزارش مالی ماهانه آگهی</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ماه</TableHead>
                  <TableHead>تعداد پرداخت</TableHead>
                  <TableHead>درآمد ناخالص (تومان)</TableHead>
                  <TableHead>کمیسیون (تومان)</TableHead>
                  <TableHead>درآمد خالص (تومان)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyStats.map((stat, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long' }).format(stat.month)}
                    </TableCell>
                    <TableCell>{stat.count}</TableCell>
                    <TableCell>{stat.amount.toLocaleString("fa-IR")}</TableCell>
                    <TableCell>{stat.commission.toLocaleString("fa-IR")}</TableCell>
                    <TableCell>{(stat.amount - stat.commission).toLocaleString("fa-IR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              هنوز هیچ پرداختی برای این آگهی ثبت نشده است.
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* لیست پرداخت‌ها */}
      <Card>
        <CardHeader>
          <CardTitle>جزئیات پرداخت‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <Table>
              <TableCaption>لیست پرداخت‌های موفق</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>تاریخ</TableHead>
                  <TableHead>شناسه پرداخت</TableHead>
                  <TableHead>مبلغ (تومان)</TableHead>
                  <TableHead>کمیسیون (تومان)</TableHead>
                  <TableHead>خالص (تومان)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment._id.toString()}>
                    <TableCell>
                      {new Date(payment.createdAt).toLocaleDateString("fa-IR")}
                    </TableCell>
                    <TableCell className="font-mono">{payment.transactionId || payment._id.toString().substring(0, 8)}</TableCell>
                    <TableCell>{(payment.amount || 0).toLocaleString("fa-IR")}</TableCell>
                    <TableCell>{(payment.commissionAmount || payment.commission || 0).toLocaleString("fa-IR")}</TableCell>
                    <TableCell>{((payment.amount || 0) - (payment.commissionAmount || payment.commission || 0)).toLocaleString("fa-IR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              هنوز هیچ پرداختی برای این آگهی ثبت نشده است.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
