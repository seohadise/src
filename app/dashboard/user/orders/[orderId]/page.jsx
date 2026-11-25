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
import { Calendar, MapPin, Users, Clock, CreditCard, FileText, Phone, User } from "lucide-react";

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

const getItemTypeTitle = (type) => {
  const titles = {
    property: "رزرو ملک",
    bus: "رزرو اتوبوس",
    food: "سفارش غذا",
  };

  return titles[type] || "نامشخص";
};

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const router = useRouter();
  const [reservation, setReservation] = useState(null);
  const [itemDetails, setItemDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReservation = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("Fetching reservation with ID:", orderId);

        // دریافت اطلاعات رزرو - اطلاعات آیتم هم همراه رزرو برمی‌گردد
        const response = await axios.get(`/api/reservation/${orderId}`);
        console.log("Reservation response:", response.data);

        if (!response.data.success) {
          throw new Error(response.data.message || "خطا در دریافت اطلاعات رزرو");
        }

        const reservationData = response.data.data;
        setReservation(reservationData);

        // اطلاعات آیتم مستقیماً در itemId برگردانده می‌شود
        if (reservationData.itemId && typeof reservationData.itemId === 'object') {
          console.log("Item details from reservation:", reservationData.itemId);
          setItemDetails(reservationData.itemId);
        }
      } catch (error) {
        console.error("Error fetching reservation:", error);
        console.log("Full error details:", error.response?.data);

        const errorMessage = error.response?.data?.message || error.message || "خطا در دریافت اطلاعات رزرو";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchReservation();
    }
  }, [orderId]);

  const handleCancelReservation = async () => {
    if (!reservation || reservation.status !== "pending") return;
    
    if (!confirm("آیا از لغو این رزرو اطمینان دارید؟")) return;
    
    try {
      const response = await axios.post(`/api/reservation/${orderId}/cancel`);
      if (response.data.success) {
        toast.success("رزرو با موفقیت لغو شد");
        // بروزرسانی وضعیت رزرو
        setReservation({
          ...reservation,
          status: "cancelled"
        });
      } else {
        toast.error(response.data.message || "خطا در لغو رزرو");
      }
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      toast.error("خطا در لغو رزرو. لطفاً دوباره تلاش کنید.");
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
                <span>نوع رزرو: {getItemTypeTitle(reservation.itemType)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">کد رزرو: </span>
                <span className="font-mono">{reservation._id}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <span>
                {(() => {
                  try {
                    if (reservation.itemType === "property" && reservation.checkInDate) {
                      return `از ${new Date(reservation.checkInDate).toLocaleDateString("fa-IR")} تا ${new Date(reservation.checkOutDate || reservation.checkInDate).toLocaleDateString("fa-IR")}`;
                    } else if (reservation.itemType === "bus" && reservation.date) {
                      return `تاریخ سفر: ${new Date(reservation.date).toLocaleDateString("fa-IR")}`;
                    } else if (reservation.itemType === "food" && reservation.dates && reservation.dates.length > 0) {
                      if (reservation.dates.length === 1) {
                        return `تاریخ سفارش: ${new Date(reservation.dates[0]).toLocaleDateString("fa-IR")}`;
                      } else {
                        const sortedDates = reservation.dates.sort((a, b) => new Date(a) - new Date(b));
                        const firstDate = new Date(sortedDates[0]).toLocaleDateString("fa-IR");
                        const lastDate = new Date(sortedDates[sortedDates.length - 1]).toLocaleDateString("fa-IR");
                        return `${reservation.dates.length} روز انتخاب شده (از ${firstDate} تا ${lastDate})`;
                      }
                    } else if (reservation.startDate && reservation.endDate) {
                      return `از ${new Date(reservation.startDate).toLocaleDateString("fa-IR")} تا ${new Date(reservation.endDate).toLocaleDateString("fa-IR")}`;
                    } else {
                      return "تاریخ مشخص نشده";
                    }
                  } catch (error) {
                    console.error("Error formatting reservation dates:", error);
                    return "تاریخ نامعتبر";
                  }
                })()}
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
                تاریخ ثبت رزرو: {(() => {
                  try {
                    return new Date(reservation.createdAt).toLocaleDateString("fa-IR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    });
                  } catch (error) {
                    console.error("Error formatting createdAt:", error);
                    return "تاریخ نامعتبر";
                  }
                })()}
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
                {(reservation.totalPrice || reservation.amount || 0).toLocaleString("fa-IR")} تومان
              </span>
            </div>

            {reservation.status === "pending" && (
              <Button
                variant="destructive"
                className="w-full mt-4"
                onClick={handleCancelReservation}
              >
                لغو رزرو
              </Button>
            )}
          </CardContent>
        </Card>

        {/* اطلاعات آیتم رزرو شده */}
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات {getItemTypeTitle(reservation.itemType)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {itemDetails ? (
              <>
                <div className="text-center mb-4">
                  <h3 className="font-bold text-lg">
                    {reservation.itemType === "bus" 
                      ? (itemDetails.vehicle?.name || `${itemDetails.from?.city} - ${itemDetails.to?.city}`)
                      : reservation.itemType === "food"
                      ? (itemDetails.foods?.[0] || itemDetails.staff?.chef?.name || "غذا")
                      : (itemDetails.name || `${getItemTypeTitle(reservation.itemType)} #${reservation.itemId?.slice(-6)}`)}
                  </h3>
                </div>

                {/* مسیر برای اتوبوس */}
                {reservation.itemType === "bus" && itemDetails.from && itemDetails.to && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <span>مسیر: {itemDetails.from.city} به {itemDetails.to.city}</span>
                  </div>
                )}

                {/* ساعت حرکت و رسیدن برای اتوبوس */}
                {reservation.itemType === "bus" && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <span>ساعت حرکت: {itemDetails.departureTime} - رسیدن: {itemDetails.arrivalTime}</span>
                  </div>
                )}

                {/* شرکت برای اتوبوس */}
                {reservation.itemType === "bus" && itemDetails.company?.name && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <span>شرکت: {itemDetails.company.name}</span>
                  </div>
                )}

                {/* آدرس برای ملک و غذا */}
                {reservation.itemType !== "bus" && itemDetails.address && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <span>{itemDetails.address.province}, {itemDetails.address.city}</span>
                    </div>
                    {/* نمایش آدرس کامل فقط برای رزروهای تایید شده */}
                    {itemDetails.fullAddress && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-800 mb-1">آدرس کامل:</p>
                        <p className="text-sm text-green-700">{itemDetails.fullAddress}</p>
                      </div>
                    )}
                    {!itemDetails.fullAddress && reservation.status === "pending" && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-700">
                          آدرس کامل پس از تایید رزرو توسط مالک نمایش داده می‌شود.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {itemDetails.owner && (
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <span>مالک: {itemDetails.owner.fullName || itemDetails.owner.name || "نامشخص"}</span>
                  </div>
                )}

                {/* شماره تماس مدیر ملک - فقط برای رزروهای تایید شده */}
                {reservation.itemType === "property" && itemDetails.managerNumber && reservation.status === "confirmed" && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">شماره تماس مدیر ملک: </span>
                      <span className="text-sm text-blue-700 font-bold" dir="ltr">{itemDetails.managerNumber}</span>
                    </div>
                  </div>
                )}

                {(itemDetails.contactPhone || itemDetails.phone || itemDetails.owner?.number) && reservation.status === "confirmed" && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <span>تلفن مالک: {itemDetails.contactPhone || itemDetails.phone || itemDetails.owner?.number}</span>
                  </div>
                )}

                <Link 
                  href={`/${reservation.itemType === "property" ? "property" : 
                         reservation.itemType === "bus" ? "bus" : 
                         reservation.itemType === "food" ? "food" : ""}/${itemDetails._id || reservation.itemId}`}
                >
                  <Button variant="outline" className="w-full mt-4">
                    مشاهده صفحه {getItemTypeTitle(reservation.itemType)}
                  </Button>
                </Link>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                اطلاعات تکمیلی در دسترس نیست
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
