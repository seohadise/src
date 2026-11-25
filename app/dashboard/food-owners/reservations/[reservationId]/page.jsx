"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign,
  ArrowLeft,
  Check,
  X,
  Package
} from "lucide-react";

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

const ReservationDetailPage = ({ params }) => {
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const router = useRouter();
  const { reservationId } = params;

  useEffect(() => {
    fetchReservation();
  }, [reservationId]);

  const fetchReservation = async () => {
    try {
      const response = await axios.get(`/api/reservation/${reservationId}`);
      if (response.data.success) {
        setReservation(response.data.data);
      } else {
        toast.error("خطا در دریافت اطلاعات رزرو");
      }
    } catch (error) {
      console.error("Error fetching reservation:", error);
      toast.error("خطا در دریافت اطلاعات رزرو");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (statusLoading || !reservation) return;
    
    setStatusLoading(true);
    try {
      const response = await axios.post(`/api/reservation/${reservationId}/status`, {
        status: newStatus,
      });
      
      if (response.data.success) {
        const statusLabel = newStatus === "confirmed" ? "تایید شده" : newStatus === "rejected" ? "رد شده" : "لغو شده";
        toast.success(`وضعیت رزرو با موفقیت به ${statusLabel} تغییر کرد`);
        // بروزرسانی وضعیت رزرو
        setReservation({
          ...reservation,
          status: newStatus
        });
      } else {
        toast.error(response.data.message || "خطا در تغییر وضعیت رزرو");
      }
    } catch (error) {
      console.error("Error changing reservation status:", error);
      toast.error("خطا در تغییر وضعیت رزرو. لطفاً دوباره تلاش کنید.");
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">رزرو مورد نظر یافت نشد</p>
        <Button onClick={() => router.back()} className="mt-4">
          بازگشت
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* هدر صفحه */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            بازگشت
          </Button>
          <h1 className="font-bold text-2xl">جزئیات رزرو غذا</h1>
        </div>
        {getStatusBadge(reservation.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* اطلاعات اصلی رزرو */}
        <div className="lg:col-span-2 space-y-6">
          {/* اطلاعات رزرو */}
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات رزرو</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">نام غذا</p>
                    <p className="font-medium">
                      {reservation.itemId?.name || 
                       reservation.itemId?.foods?.[0] || 
                       reservation.itemId?.staff?.chef?.name || 
                       "نامشخص"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">مبلغ کل</p>
                    <p className="font-medium">{reservation.amount?.toLocaleString("fa-IR")} تومان</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">تاریخ ثبت</p>
                    <p className="font-medium">
                      {new Date(reservation.createdAt).toLocaleDateString("fa-IR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>

                {reservation.quantity && (
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">تعداد</p>
                      <p className="font-medium">{reservation.quantity}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* تاریخ‌های رزرو */}
              {reservation.dates && reservation.dates.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">تاریخ‌های رزرو شده</h4>
                  <div className="flex flex-wrap gap-2">
                    {reservation.dates.map((date, index) => (
                      <Badge key={index} variant="outline">
                        {new Date(date).toLocaleDateString("fa-IR", {
                          month: "long",
                          day: "numeric",
                        })}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* اطلاعات مشتری */}
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات مشتری</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">نام و نام خانوادگی</p>
                    <p className="font-medium">{reservation.user?.fullName || "نامشخص"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">شماره تماس</p>
                    <p className="font-medium">{reservation.user?.number || "نامشخص"}</p>
                  </div>
                </div>

                {reservation.user?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">ایمیل</p>
                      <p className="font-medium">{reservation.user.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* پنل عملیات */}
        <div className="space-y-6">
          {/* عملیات رزرو */}
          {reservation.status === "pending" && (
            <Card>
              <CardHeader>
                <CardTitle>عملیات رزرو</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full bg-green-500 hover:bg-green-600"
                  onClick={() => handleStatusChange("confirmed")}
                  disabled={statusLoading}
                >
                  <Check className="w-4 h-4 mr-2" />
                  {statusLoading ? "در حال پردازش..." : "تایید رزرو"}
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleStatusChange("rejected")}
                  disabled={statusLoading}
                >
                  <X className="w-4 h-4 mr-2" />
                  {statusLoading ? "در حال پردازش..." : "رد رزرو"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* اطلاعات پرداخت */}
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات پرداخت</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">شناسه رزرو:</span>
                <span className="font-mono text-xs">{reservation._id}</span>
              </div>
              {reservation.payment && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">شناسه پرداخت:</span>
                  <span className="font-mono text-xs">{reservation.payment}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">مبلغ کل:</span>
                <span className="font-medium">{reservation.amount?.toLocaleString("fa-IR")} تومان</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReservationDetailPage;
