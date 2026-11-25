"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  CreditCard,
  FileText,
  Phone,
  User,
  Mail,
  Check,
  X,
} from "lucide-react";

const getStatusBadge = (status) => {
  const styles = {
    pending: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
    confirmed: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    cancelled: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
    completed: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  };

  const texts = {
    pending: "در انتظار تایید",
    confirmed: "تایید شده",
    cancelled: "لغو شده",
    completed: "تکمیل شده",
  };

  return (
    <Badge variant="outline" className={styles[status]}>
      {texts[status]}
    </Badge>
  );
};

const BusReservationDetailsPage = () => {
  const { reservationId } = useParams();
  const router = useRouter();
  const [reservation, setReservation] = useState(null);
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    const fetchReservation = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // دریافت اطلاعات رزرو
        const response = await axios.get(`/api/reservation/${reservationId}`);
        const reservationData = response.data.data;
        setReservation(reservationData);
        
        // دریافت اطلاعات اتوبوس
        if (reservationData.itemType === "bus" && reservationData.itemId) {
          try {
            const busResponse = await axios.get(`/api/bus/${reservationData.itemId}`);
            if (busResponse.data.data) {
              setBus(busResponse.data.data);
            }
          } catch (busError) {
            console.error("Error fetching bus details:", busError);
            // ادامه می‌دهیم حتی اگر جزئیات اتوبوس پیدا نشد
          }
        }
      } catch (error) {
        console.error("Error fetching reservation:", error);
        setError("خطا در دریافت اطلاعات رزرو. لطفاً دوباره تلاش کنید.");
        toast.error("خطا در دریافت اطلاعات رزرو");
      } finally {
        setLoading(false);
      }
    };

    if (reservationId) {
      fetchReservation();
    }
  }, [reservationId]);

  const handleStatusChange = async (newStatus) => {
    if (statusLoading || !reservation) return;
    
    setStatusLoading(true);
    try {
      const response = await axios.post(`/api/reservation/${reservationId}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        setReservation(prev => ({ ...prev, status: newStatus }));
        toast.success("وضعیت رزرو با موفقیت بروزرسانی شد");
      } else {
        toast.error(response.data.message || "خطا در بروزرسانی وضعیت");
      }
    } catch (error) {
      console.error("Error updating reservation status:", error);
      toast.error("خطا در بروزرسانی وضعیت رزرو");
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">در حال بارگذاری اطلاعات رزرو...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">
              <X className="w-12 h-12 mx-auto mb-4" />
              خطا در بارگزاری
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.refresh()}>تلاش مجدد</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">
              <FileText className="w-12 h-12 mx-auto mb-4" />
              رزرو یافت نشد
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">رزرو مورد نظر پیدا نشد.</p>
            <Button asChild>
              <Link href="/dashboard/bus-owners">بازگشت به داشبورد</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">جزئیات رزرو</h1>
          <Button asChild variant="outline">
            <Link href="/dashboard/bus-owners">بازگشت</Link>
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl mb-2">اطلاعات رزرو</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">شناسه رزرو:</span>
                  <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {reservation._id}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(reservation.status)}
                {reservation.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange("confirmed")}
                      disabled={statusLoading}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Check className="w-4 h-4 ml-2" />
                      تایید
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStatusChange("rejected")}
                      disabled={statusLoading}
                    >
                      <X className="w-4 h-4 ml-2" />
                      لغو
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">اطلاعات کلی</h3>
                
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">تاریخ رزرو</p>
                    <p className="font-medium">
                      {new Date(reservation.date).toLocaleDateString("fa-IR")}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">تعداد مسافران</p>
                    <p className="font-medium">
                      {(reservation.guests?.adults || 0) + (reservation.guests?.children || 0) || 1} نفر
                      {reservation.guests?.children > 0 && ` (${reservation.guests.adults} بزرگسال، ${reservation.guests.children} کودک)`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">مبلغ کل</p>
                    <p className="font-medium">
                      {(reservation.amount || reservation.totalAmount || reservation.totalPrice || 0).toLocaleString()} تومان
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">تاریخ ایجاد</p>
                    <p className="font-medium">
                      {new Date(reservation.createdAt).toLocaleDateString("fa-IR")}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">اطلاعات مسافر</h3>
                
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">نام مسافر</p>
                    <p className="font-medium">{reservation.user?.fullName || reservation.user?.name || "نامشخص"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">شماره تماس</p>
                    <p className="font-medium">{reservation.user?.number || reservation.user?.phone || "نامشخص"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">ایمیل</p>
                    <p className="font-medium">{reservation.user?.email || "نامشخص"}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {reservation.description && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-lg mb-2">توضیحات</h3>
                <p className="text-muted-foreground">{reservation.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {bus && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">اطلاعات اتوبوس</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">نام اتوبوس</p>
                      <p className="font-medium">{bus.vehicle?.name || "نامشخص"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">ظرفیت</p>
                      <p className="font-medium">{bus.vehicle?.capacity} نفر</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">مبدا</p>
                      <p className="font-medium">
                        {bus.from?.province} - {bus.from?.city}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">مقصد</p>
                      <p className="font-medium">
                        {bus.to?.province} - {bus.to?.city}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BusReservationDetailsPage;