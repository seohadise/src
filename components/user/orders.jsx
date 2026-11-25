"use client";

import { useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { toast } from "sonner";

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

const getItemTypeDetails = (type) => {
  const details = {
    property: {
      title: "رزرو ملک",
      path: "/properties",
    },
    bus: {
      title: "رزرو اتوبوس",
      path: "/buses",
    },
    food: {
      title: "سفارش غذا",
      path: "/foods",
    },
  };

  return details[type] || { title: "نامشخص", path: "/" };
};

const Orders = ({ reservations = [] }) => {
  const [cancellingId, setCancellingId] = useState(null);

  const handleCancel = async (reservationId) => {
    if (!confirm("آیا از لغو این رزرو اطمینان دارید؟")) return;

    setCancellingId(reservationId);
    try {
      const response = await fetch(`/api/reservation/${reservationId}/cancel`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("رزرو با موفقیت لغو شد");
        window.location.reload();
      } else {
        toast.error(data.message || "خطا در لغو رزرو");
      }
    } catch (error) {
      toast.error("خطا در لغو رزرو. لطفاً دوباره تلاش کنید.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">سفارشات من</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reservations && reservations.length > 0 ? (
          reservations.map((reservation) => {
            if (!reservation || !reservation._id) return null;
            return (
            <Card key={reservation._id} className="overflow-hidden">
              <CardHeader className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {getItemTypeDetails(reservation.itemType).title}
                  </span>
                  {getStatusBadge(reservation.status)}
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {(() => {
                      try {
                        return new Date(reservation.createdAt).toLocaleDateString(
                          "fa-IR",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        );
                      } catch (error) {
                        console.error("Error formatting createdAt:", error);
                        return "تاریخ نامعتبر";
                      }
                    })()}
                  </div>
                  <span>کد سفارش: {reservation._id?.substring(0, 8) || "نامشخص"}</span>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-0 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {reservation.itemType === "property" && reservation.itemDetails
                        ? `رزرو ملک (${reservation.itemDetails.name || 'نامشخص'})`
                        : reservation.itemType === "bus" && reservation.itemDetails
                        ? `${reservation.itemDetails.from?.city || 'نامشخص'} به ${reservation.itemDetails.to?.city || 'نامشخص'} - ${reservation.itemDetails.vehicle?.name || 'اتوبوس'}`
                        : reservation.itemType === "food" && reservation.itemDetails
                        ? `سفارش غذا (${reservation.itemDetails.name || reservation.itemDetails.foods?.[0] || 'نامشخص'})`
                        : reservation.itemType === "property"
                        ? `رزرو ملک`
                        : reservation.itemType === "bus"
                        ? `رزرو اتوبوس`
                        : reservation.itemType === "food"
                        ? `سفارش غذا`
                        : "نامشخص"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {(() => {
                        try {
                          if (reservation.itemType === "property" && reservation.checkInDate) {
                            return `از ${new Date(reservation.checkInDate).toLocaleDateString("fa-IR")} تا ${new Date(reservation.checkOutDate || reservation.checkInDate).toLocaleDateString("fa-IR")}`;
                          } else if (reservation.itemType === "bus" && reservation.date) {
                            return new Date(reservation.date).toLocaleDateString("fa-IR");
                          } else if (reservation.itemType === "food" && reservation.dates && reservation.dates.length > 0) {
                            if (reservation.dates.length === 1) {
                              return `تاریخ: ${new Date(reservation.dates[0]).toLocaleDateString("fa-IR")}`;
                            } else {
                              const sortedDates = reservation.dates.sort((a, b) => new Date(a) - new Date(b));
                              const firstDate = new Date(sortedDates[0]).toLocaleDateString("fa-IR");
                              const lastDate = new Date(sortedDates[sortedDates.length - 1]).toLocaleDateString("fa-IR");
                              return `${reservation.dates.length} روز (${firstDate} تا ${lastDate})`;
                            }
                          } else {
                            return "تاریخ مشخص نشده";
                          }
                        } catch (error) {
                          console.error("Error formatting date:", error);
                          return "تاریخ نامعتبر";
                        }
                      })()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {reservation.guests?.adults || 0} بزرگسال و{" "}
                      {reservation.guests?.children || 0} کودک
                    </span>
                  </div>

                  {reservation.itemType !== "bus" && reservation.itemDetails?.address && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {reservation.itemDetails.address.province}، {reservation.itemDetails.address.city}
                        </span>
                      </div>
                      {reservation.itemDetails.fullAddress && (
                        <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-xs font-medium text-green-800">آدرس دقیق:</p>
                          <p className="text-xs text-green-700">{reservation.itemDetails.fullAddress}</p>
                        </div>
                      )}
                      {!reservation.itemDetails.fullAddress && reservation.status === "pending" && (
                        <p className="text-xs text-orange-600">آدرس دقیق پس از تایید رزرو نمایش داده می‌شود</p>
                      )}
                    </div>
                  )}
                </div>

                {reservation.specialRequests && reservation.specialRequests.trim() && (
                  <p className="text-sm text-muted-foreground border-t pt-2">
                    درخواست ویژه: {reservation.specialRequests}
                  </p>
                )}

                <div className="flex items-center justify-between border-t pt-4">
                  <span className="font-medium">مبلغ کل:</span>
                  <span className="font-bold text-green-600">
                    {(reservation.amount || 0).toLocaleString("fa-IR")} تومان
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/dashboard/user/orders/${reservation._id}`}
                    className="w-full"
                  >
                    <Button variant="outline" className="w-full">
                      مشاهده جزئیات رزرو
                    </Button>
                  </Link>
                  {reservation.status === "pending" && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleCancel(reservation._id)}
                      disabled={cancellingId === reservation._id}
                    >
                      {cancellingId === reservation._id ? "در حال لغو..." : "لغو رزرو"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            );
          }).filter(item => item !== null)
        ) : (
          <p className="col-span-full text-center text-muted-foreground py-8">
            شما هنوز هیچ سفارشی ثبت نکرده‌اید
          </p>
        )}
      </div>
    </div>
  );
};

export default Orders;
