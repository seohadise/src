"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Calendar, MapPin, Users, Clock, Package, Utensils, Home, Hash, Check, X } from "lucide-react";
import { formatReservationDate, formatDate, getItemTypeName, getReservationStatusText, getReservationStatusColor } from "@/lib/reservation-utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";

const getItemTypeIcon = (type) => {
  switch (type) {
    case "property":
      return <Home className="w-4 h-4" />;
    case "bus":
      return <Package className="w-4 h-4" />;
    case "food":
      return <Utensils className="w-4 h-4" />;
    default:
      return <Hash className="w-4 h-4" />;
  }
};

const formatAmount = (amount) => {
  if (amount === undefined || amount === null) return "0";
  return amount.toLocaleString("fa-IR");
};

const PropertyReservationDetails = ({ reservation }) => (
  <>
    <div className="flex items-center gap-2 text-sm">
      <MapPin className="w-4 h-4" />
      <span>
        {reservation.itemDetails?.name || reservation.item?.name || "نام ملک در دسترس نیست"}
      </span>
    </div>

    <div className="flex items-center gap-2 text-sm">
      <Calendar className="w-4 h-4" />
      <span>
        {formatReservationDate(reservation)}
      </span>
    </div>

    {reservation.guests && (
      <div className="flex items-center gap-2 text-sm">
        <Users className="w-4 h-4" />
        <span>
          {reservation.guests.adults || 0} بزرگسال و{" "}
          {reservation.guests.children || 0} کودک
        </span>
      </div>
    )}
  </>
);

const BusReservationDetails = ({ reservation }) => (
  <>
    <div className="flex items-center gap-2 text-sm">
      <Package className="w-4 h-4" />
      <span>
        {reservation.itemDetails?.name || reservation.item?.name || "اتوبوس"}
      </span>
    </div>

    {reservation.itemDetails?.from && reservation.itemDetails?.to && (
      <div className="flex items-center gap-2 text-sm">
        <MapPin className="w-4 h-4" />
        <span>
          مسیر: {reservation.itemDetails.from.city} به {reservation.itemDetails.to.city}
        </span>
      </div>
    )}

    <div className="flex items-center gap-2 text-sm">
      <Calendar className="w-4 h-4" />
      <span>
        {formatReservationDate(reservation)}
      </span>
    </div>
  </>
);

const FoodReservationDetails = ({ reservation }) => (
  <>
    <div className="flex items-center gap-2 text-sm">
      <Utensils className="w-4 h-4" />
      <span>
        {reservation.itemDetails?.name || reservation.item?.name || "غذا"}
      </span>
    </div>

    <div className="flex items-center gap-2 text-sm">
      <Calendar className="w-4 h-4" />
      <span>
        {formatReservationDate(reservation)}
      </span>
    </div>

    {reservation.quantity && (
      <div className="flex items-center gap-2 text-sm">
        <Hash className="w-4 h-4" />
        <span>
          تعداد: {reservation.quantity}
        </span>
      </div>
    )}
  </>
);

const ReservationCard = ({ reservation }) => {
  const router = useRouter();
  const [statusLoading, setStatusLoading] = useState(false);

  // اگر رزرو وجود نداشت، کارت خالی نمایش داده شود
  if (!reservation) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          اطلاعات رزرو در دسترس نیست
        </CardContent>
      </Card>
    );
  }

  const handleStatusChange = async (newStatus) => {
    if (statusLoading) return;

    setStatusLoading(true);
    try {
      const response = await axios.post(`/api/reservation/${reservation._id}/status`, {
        status: newStatus,
      });

      if (response.data.success) {
        toast.success(`وضعیت رزرو با موفقیت به ${newStatus === "confirmed" ? "تایید شده" : "لغو شده"} تغییر کرد`);
        // بروزرسانی صفحه
        router.refresh();
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

  const renderReservationDetails = () => {
    switch (reservation.itemType) {
      case "property":
        return <PropertyReservationDetails reservation={reservation} />;
      case "bus":
        return <BusReservationDetails reservation={reservation} />;
      case "food":
        return <FoodReservationDetails reservation={reservation} />;
      default:
        return (
          <div className="text-sm text-muted-foreground">
            جزئیات رزرو در دسترس نیست
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold flex items-center gap-1">
            {getItemTypeIcon(reservation.itemType)}
            رزرو {getItemTypeName(reservation.itemType)}
          </h3>
          <Badge className={getReservationStatusColor(reservation.status)}>
            {getReservationStatusText(reservation.status)}
          </Badge>
        </div>
        <span className="text-sm text-muted-foreground">
          {formatDate(reservation.createdAt)}
        </span>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          {renderReservationDetails()}
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              اطلاعات رزرو کننده:
            </span>
            <div className="text-sm text-right">
              <p>{reservation.user?.fullName || "نامشخص"}</p>
              <p className="text-muted-foreground">
                {reservation.user?.number || "نامشخص"}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="font-medium">مبلغ کل:</span>
            <span className="font-bold text-green-600">
              {formatAmount(reservation.amount || reservation.totalPrice)} تومان
            </span>
          </div>
          {(reservation.basePrice || reservation.commissionAmount) && (
            <div className="mt-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>قیمت پایه:</span>
                <span>{formatAmount(reservation.basePrice)} تومان</span>
              </div>
              <div className="flex justify-between">
                <span>کارمزد:</span>
                <span>{formatAmount(reservation.commissionAmount)} تومان</span>
              </div>
            </div>
          )}
        </div>

        {/* دکمه‌های تایید/رد برای رزروهای در انتظار */}
        {reservation.status === "pending" && (
          <div className="pt-4 border-t">
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-green-500 hover:bg-green-600"
                onClick={() => handleStatusChange("confirmed")}
                disabled={statusLoading}
              >
                <Check className="w-4 h-4 mr-2" />
                {statusLoading ? "در حال پردازش..." : "تایید رزرو"}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => handleStatusChange("rejected")}
                disabled={statusLoading}
              >
                <X className="w-4 h-4 mr-2" />
                {statusLoading ? "در حال پردازش..." : "رد رزرو"}
              </Button>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default ReservationCard;
