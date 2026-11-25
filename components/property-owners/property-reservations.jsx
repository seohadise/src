"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Calendar, MapPin, Users, Clock, Phone, Mail, User } from "lucide-react";
import { formatReservationDate } from "@/lib/reservation-utils";

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

const PropertyReservations = ({ reservations, properties }) => {
  const router = useRouter();
  const [selectedProperty, setSelectedProperty] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [loading, setLoading] = useState({});

  // فیلتر کردن رزروها بر اساس ملک و وضعیت انتخاب شده
  const filteredReservations = reservations.filter((reservation) => {
    const matchProperty = selectedProperty === "all" || reservation.itemId === selectedProperty;
    const matchStatus = selectedStatus === "all" || reservation.status === selectedStatus;
    return matchProperty && matchStatus;
  });

  // تغییر وضعیت رزرو
  const handleStatusChange = async (reservationId, newStatus) => {
    if (loading[reservationId]) return;

    setLoading((prev) => ({ ...prev, [reservationId]: true }));
    try {
      const response = await axios.post(`/api/reservation/${reservationId}/status`, {
        status: newStatus,
      });

      if (response.data.success) {
        const statusLabel = newStatus === "confirmed" ? "تایید شده" : newStatus === "rejected" ? "رد شده" : "لغو شده";
        toast.success(`وضعیت رزرو با موفقیت به ${statusLabel} تغییر کرد`);
        router.refresh();
      } else {
        toast.error(response.data.message || "خطا در تغییر وضعیت رزرو");
      }
    } catch (error) {
      console.error("Error changing reservation status:", error);
      toast.error("خطا در تغییر وضعیت رزرو. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading((prev) => ({ ...prev, [reservationId]: false }));
    }
  };

  // یافتن نام ملک بر اساس شناسه
  const getPropertyName = (propertyId) => {
    const property = properties.find((p) => p._id === propertyId);
    return property ? property.name : `ملک شناسه ${propertyId.slice(-6)}`;
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">مدیریت رزروها</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-1/2">
          <label className="block text-sm font-medium mb-1">فیلتر بر اساس ملک</label>
          <Select value={selectedProperty} onValueChange={setSelectedProperty}>
            <SelectTrigger>
              <SelectValue placeholder="همه املاک" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه املاک</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property._id} value={property._id}>
                  {property.name || `ملک شناسه ${property._id.slice(-6)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-1/2">
          <label className="block text-sm font-medium mb-1">فیلتر بر اساس وضعیت</label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="همه وضعیت‌ها" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه وضعیت‌ها</SelectItem>
              <SelectItem value="pending">در انتظار تایید</SelectItem>
              <SelectItem value="confirmed">تایید شده</SelectItem>
              <SelectItem value="cancelled">لغو شده</SelectItem>
              <SelectItem value="completed">تکمیل شده</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredReservations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReservations.map((reservation) => (
            <Card key={reservation._id} className="overflow-hidden">
              <CardHeader className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {getPropertyName(reservation.itemId)}
                  </span>
                  {getStatusBadge(reservation.status)}
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(reservation.createdAt).toLocaleDateString(
                      "fa-IR",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </div>
                  <span>کد رزرو: {reservation._id.substring(0, 8)}</span>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-0 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {formatReservationDate(reservation)}
                    </span>
                  </div>

                  {/* نمایش تعداد شب‌ها برای رزرو ملک */}
                  {reservation.itemType === "property" && reservation.checkInDate && reservation.checkOutDate && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {(() => {
                          const checkIn = new Date(reservation.checkInDate);
                          const checkOut = new Date(reservation.checkOutDate);
                          const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
                          return `${nights} شب اقامت`;
                        })()}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {reservation.guests?.adults || 0} بزرگسال و{" "}
                      {reservation.guests?.children || 0} کودک
                    </span>
                  </div>

                  {reservation.user && (
                    <>
                      <Separator className="my-2" />
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{reservation.user.name || "کاربر ناشناس"}</span>
                      </div>
                      {reservation.user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{reservation.user.phone}</span>
                        </div>
                      )}
                      {reservation.user.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{reservation.user.email}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {reservation.specialRequests && (
                  <p className="text-sm text-muted-foreground border-t pt-2">
                    درخواست ویژه: {reservation.specialRequests}
                  </p>
                )}

                {/* اطلاعات مالی */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">مبلغ پرداخت شده:</span>
                    <span className="font-medium">
                      {reservation.amount?.toLocaleString("fa-IR")} تومان
                    </span>
                  </div>
                  {reservation.totalPrice && reservation.totalPrice !== reservation.amount && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">مبلغ کل:</span>
                      <span className="font-bold text-green-600">
                        {reservation.totalPrice?.toLocaleString("fa-IR")} تومان
                      </span>
                    </div>
                  )}
                  {reservation.basePrice && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">درآمد شما:</span>
                      <span className="font-medium text-blue-600">
                        {reservation.basePrice?.toLocaleString("fa-IR")} تومان
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/dashboard/property-owners/properties/reservations/${reservation._id}`}
                    className="w-full"
                  >
                    <Button variant="outline" className="w-full">
                      مشاهده جزئیات
                    </Button>
                  </Link>
                  {reservation.status === "pending" && (
                    <div className="flex gap-2 w-full">
                      <Button
                        variant="default"
                        className="w-full"
                        disabled={loading[reservation._id]}
                        onClick={() => handleStatusChange(reservation._id, "confirmed")}
                      >
                        {loading[reservation._id] ? "..." : "تایید"}
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full"
                        disabled={loading[reservation._id]}
                        onClick={() => handleStatusChange(reservation._id, "rejected")}
                      >
                        {loading[reservation._id] ? "..." : "رد"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-muted rounded-md">
          <p className="text-muted-foreground">هیچ رزروی با فیلترهای انتخابی یافت نشد</p>
        </div>
      )}
    </div>
  );
};

export default PropertyReservations;
