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
    rejected: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
    completed: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  };

  const texts = {
    pending: "در انتظار تایید",
    confirmed: "تایید شده",
    cancelled: "لغو شده",
    rejected: "رد شده",
    completed: "تکمیل شده",
  };

  return (
    <Badge variant="outline" className={styles[status]}>
      {texts[status]}
    </Badge>
  );
};

const ReservationDetailsPage = () => {
  const { reservationId } = useParams();
  const router = useRouter();
  const [reservation, setReservation] = useState(null);
  const [property, setProperty] = useState(null);
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
        
        // دریافت اطلاعات ملک
        if (reservationData.itemType === "property" && reservationData.itemId) {
          try {
            const propertyResponse = await axios.get(`/api/property/${reservationData.itemId}`);
            if (propertyResponse.data.data) {
              setProperty(propertyResponse.data.data);
            }
          } catch (propertyError) {
            console.error("Error fetching property details:", propertyError);
            // ادامه می‌دهیم حتی اگر جزئیات ملک پیدا نشد
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
      <div className="p-8 flex justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">در حال بارگذاری اطلاعات رزرو...</p>
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-red-600">خطا در بارگذاری</h2>
              <p>{error || "اطلاعات رزرو یافت نشد"}</p>
              <Button onClick={() => router.back()}>بازگشت</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">جزئیات رزرو</h1>
        <Button variant="outline" onClick={() => router.back()}>
          بازگشت به لیست رزروها
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* اطلاعات اصلی رزرو */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>اطلاعات رزرو</CardTitle>
              {getStatusBadge(reservation.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <span>نوع رزرو: رزرو ملک</span>
              </div>
              <div>
                <span className="text-muted-foreground">کد رزرو: </span>
                <span className="font-mono">{reservation._id}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <span>
                از {new Date(reservation.startDate).toLocaleDateString("fa-IR")} تا{" "}
                {new Date(reservation.endDate).toLocaleDateString("fa-IR")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <span>
                {reservation.guests?.adults || 0} بزرگسال و {reservation.guests?.children || 0} کودک
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span>
                تاریخ ثبت رزرو: {new Date(reservation.createdAt).toLocaleDateString("fa-IR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
            </div>

            {reservation.specialRequests &&
             reservation.specialRequests.trim() &&
             reservation.specialRequests.length > 10 &&
             !reservation.specialRequests.includes("الان رزرو کردم") &&
             !reservation.specialRequests.includes("از کجا میشه تایید کرد") && (
              <div className="p-4 bg-muted rounded-md">
                <h3 className="font-medium mb-2">درخواست‌های ویژه:</h3>
                <p>{reservation.specialRequests}</p>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <span className="font-medium">مبلغ کل:</span>
              <span className="font-bold text-green-600 text-lg">
                {reservation.totalPrice?.toLocaleString("fa-IR")} تومان
              </span>
            </div>

            {reservation.status === "pending" && (
              <div className="flex items-center gap-4 mt-4">
                <Button
                  variant="default"
                  className="w-full"
                  disabled={statusLoading}
                  onClick={() => handleStatusChange("confirmed")}
                >
                  <Check className="w-4 h-4 mr-2" />
                  تایید رزرو
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={statusLoading}
                  onClick={() => handleStatusChange("rejected")}
                >
                  <X className="w-4 h-4 mr-2" />
                  رد رزرو
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* اطلاعات کاربر و ملک */}
        <div className="space-y-6">
          {/* اطلاعات کاربر */}
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات مهمان</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reservation.user ? (
                <>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <span>{reservation.user.name || "کاربر ناشناس"}</span>
                  </div>

                  {reservation.user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <span>{reservation.user.phone}</span>
                    </div>
                  )}

                  {reservation.user.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <span>{reservation.user.email}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  اطلاعات کاربر در دسترس نیست
                </div>
              )}
            </CardContent>
          </Card>

          {/* اطلاعات ملک */}
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات ملک</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {property ? (
                <>
                  <div className="text-center mb-4">
                    <h3 className="font-bold text-lg">{property.name || `ملک شناسه ${reservation.itemId?.slice(-6)}`}</h3>
                  </div>

                  {property.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <span>{property.location}</span>
                    </div>
                  )}

                  <Link href={`/dashboard/property-owners/properties/edit/${property._id}`}>
                    <Button variant="outline" className="w-full mt-4">
                      مشاهده صفحه ملک
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  اطلاعات تکمیلی ملک در دسترس نیست
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReservationDetailsPage;
