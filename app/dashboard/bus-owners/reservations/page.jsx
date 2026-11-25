"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  DollarSign,
  Eye,
  Check,
  X,
  Bus as BusIcon
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";

// export const metadata = {
//   title: "رزروهای اتوبوس",
// };

// تابع برای نمایش وضعیت رزرو
const getStatusBadge = (status) => {
  const statusConfig = {
    pending: { label: "در انتظار تایید", variant: "secondary" },
    confirmed: { label: "تایید شده", variant: "default" },
    cancelled: { label: "لغو شده", variant: "destructive" },
    completed: { label: "تکمیل شده", variant: "outline" },
  };

  const config = statusConfig[status] || statusConfig.pending;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const Page = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState({});

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await axios.get("/api/bus-reservations");
      if (response.data.success) {
        setReservations(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast.error("خطا در دریافت رزروها");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reservationId, newStatus) => {
    if (statusLoading[reservationId]) return;

    setStatusLoading(prev => ({ ...prev, [reservationId]: true }));
    try {
      const response = await axios.post(`/api/reservation/${reservationId}/status`, {
        status: newStatus,
      });

      if (response.data.success) {
        const statusLabel = newStatus === "confirmed" ? "تایید شده" : newStatus === "rejected" ? "رد شده" : "لغو شده";
        toast.success(`وضعیت رزرو با موفقیت به ${statusLabel} تغییر کرد`);
        // بروزرسانی لیست رزروها
        setReservations(prev =>
          prev.map(reservation =>
            reservation._id === reservationId
              ? { ...reservation, status: newStatus }
              : reservation
          )
        );
      } else {
        toast.error(response.data.message || "خطا در تغییر وضعیت رزرو");
      }
    } catch (error) {
      console.error("Error changing reservation status:", error);
      toast.error("خطا در تغییر وضعیت رزرو. لطفاً دوباره تلاش کنید.");
    } finally {
      setStatusLoading(prev => ({ ...prev, [reservationId]: false }));
    }
  };

  if (loading) {
    return <div className="p-4">در حال بارگذاری...</div>;
  }

  // آمار کلی
  const stats = {
    total: reservations.length,
    pending: reservations.filter(r => r.status === "pending").length,
    confirmed: reservations.filter(r => r.status === "confirmed").length,
    cancelled: reservations.filter(r => r.status === "cancelled").length,
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">رزروهای اتوبوس</h1>
        <Link href="/dashboard/bus-owners">
          <Button variant="outline">بازگشت به داشبورد</Button>
        </Link>
      </div>

      {/* آمار کلی */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل رزروها</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">در انتظار تایید</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تایید شده</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.confirmed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">لغو شده</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* لیست رزروها */}
      <div className="space-y-4">
        {reservations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">هیچ رزروی یافت نشد</p>
            </CardContent>
          </Card>
        ) : (
          reservations.map((reservation) => (
            <Card key={reservation._id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {reservation.itemId?.title || reservation.itemId?.vehicle?.name || 
                       (reservation.itemId?.from?.city && reservation.itemId?.to?.city 
                         ? `${reservation.itemId.from.city} - ${reservation.itemId.to.city}` 
                         : "اتوبوس")}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {reservation.date 
                            ? new Date(reservation.date).toLocaleDateString("fa-IR")
                            : "تاریخ نامشخص"
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>{reservation.amount?.toLocaleString("fa-IR")} تومان</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(reservation.status)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* اطلاعات مشتری */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">اطلاعات مشتری</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{reservation.user?.fullName || "نام نامشخص"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{reservation.user?.number || "شماره نامشخص"}</span>
                    </div>
                  </div>
                </div>

                {/* اطلاعات مسیر */}
                {(reservation.itemId?.from || reservation.itemId?.to) && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">اطلاعات مسیر</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>از {reservation.itemId.from?.city || "نامشخص"} به {reservation.itemId.to?.city || "نامشخص"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>ساعت {reservation.itemId.departureTime || "نامشخص"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* دکمه‌های عملیات */}
                <div className="flex items-center justify-between gap-2 pt-4 border-t">
                  <Link
                    href={`/dashboard/bus-owners/reservations/${reservation._id}`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      مشاهده جزئیات
                    </Button>
                  </Link>
                  {reservation.status === "pending" && (
                    <div className="flex gap-2 flex-1">
                      <Button
                        variant="default"
                        className="w-full bg-green-500 hover:bg-green-600"
                        disabled={statusLoading[reservation._id]}
                        onClick={() => handleStatusChange(reservation._id, "confirmed")}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {statusLoading[reservation._id] ? "..." : "تایید"}
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full"
                        disabled={statusLoading[reservation._id]}
                        onClick={() => handleStatusChange(reservation._id, "rejected")}
                      >
                        <X className="w-4 h-4 mr-2" />
                        {statusLoading[reservation._id] ? "..." : "رد"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Page;
