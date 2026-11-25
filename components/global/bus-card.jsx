"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useMutation } from "@tanstack/react-query";

import { deleteBus } from "@/app/dashboard/bus-owners/buses/_actions";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

import { Card, CardContent, CardFooter } from "../ui/card";

import { Badge } from "../ui/badge";
import { Button, buttonVariants } from "../ui/button";

import {
  MapPin,
  Home,
  Calendar,
  Trash2,
  Wallet,
  Star,
  Users,
  Edit2,
} from "lucide-react";

import { toast } from "sonner";

const BusCard = ({ bus, isPanel = false }) => {
  const router = useRouter();
  const totalEarnings = bus.reservations?.reduce((sum, reservation) => {
    return reservation.paymentStatus === "paid"
      ? sum + reservation.totalPrice
      : sum;
  }, 0);

  const averageRating = bus.comments?.length
    ? Math.round(
        (bus.comments.reduce((sum, comment) => sum + comment.rating, 0) /
          bus.comments.length) *
          10
      ) / 10
    : 0;

  // وضعیت رزرو
  const getReservationStatus = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // اگر اتوبوس تایید نشده باشد
    if (bus.status !== 'approved') {
      return { status: "not-approved", label: "در انتظار تایید", color: "secondary" };
    }

    // بررسی تاریخ‌های موجود
    let hasAvailableDate = false;
    
    // اگر availableDates وجود دارد، بررسی کن که آیا تاریخ آینده‌ای موجود است
    if (bus.availableDates && bus.availableDates.length > 0) {
      hasAvailableDate = bus.availableDates.some(dateObj => {
        const date = new Date(dateObj.date);
        const remaining = dateObj.remainingCapacity ?? bus.vehicle?.capacity ?? bus.capacity ?? 0;
        return date >= now && !dateObj.isReserved && remaining > 0;
      });
    } else if (bus.date) {
      // اگر فقط تاریخ اصلی وجود دارد
      const busDate = new Date(bus.date);
      hasAvailableDate = busDate >= now && !bus.isReserved;
    }

    // اگر هیچ تاریخ موجودی نیست
    if (!hasAvailableDate) {
      return { status: "unavailable", label: "ناموجود", color: "destructive" };
    }

    // اگر موجود باشد
    return { status: "available", label: "موجود", color: "success" };
  };

  const reservationStatus = getReservationStatus();
  const totalCapacity = bus.vehicle?.capacity ?? bus.capacity ?? 0;
  
  // محاسبه ظرفیت باقیمانده از availableDates
  let remainingSeats = totalCapacity;
  if (bus.availableDates && bus.availableDates.length > 0) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // پیدا کردن اولین تاریخ آینده
    const nextAvailableDate = bus.availableDates
      .filter(d => new Date(d.date) >= now && !d.isReserved)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    
    if (nextAvailableDate) {
      remainingSeats = nextAvailableDate.remainingCapacity ?? totalCapacity;
    }
  }

  const { mutate, isPending } = useMutation({
    mutationFn: deleteBus,
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setTimeout(() => {
          location.reload();
        }, 1000);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || "خطایی رخ داده است");
    },
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleCardClick = () => {
    router.push(`/bus/${bus?._id}`);
  };

  return (
    <div className="block">
      <Card
        className="overflow-hidden group pt-0 cursor-pointer hover:shadow-lg transition-shadow"
        onClick={handleCardClick}
      >
        <div className="relative aspect-square">
            <Image
              src={bus?.images[0]}
              alt="اتوبوس"
              fill
              className="object-cover transition-all duration-300 group-hover:scale-105 rounded-b-xl hover:rounded-b-none cursor-pointer"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

          <div className="absolute top-2 px-2 w-full pointer-events-none">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Badge className="bg-white/80 text-black">
                  {bus?.vehicle.type === "bus"
                    ? "اتوبوس"
                    : bus?.vehicle.type === "minibus"
                    ? "مینی‌بوس"
                    : "ون"}
                </Badge>
                {!isPanel && (
                  <Badge
                    variant={reservationStatus.color}
                    className="bg-white/90 text-black"
                  >
                    {reservationStatus.label}
                  </Badge>
                )}
              </div>

              {isPanel && (
                <div className="flex items-center gap-2 pointer-events-auto">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); setDeleteDialogOpen(true); }}
                  >
                    <Trash2 />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/bus-owners/buses/edit/${bus?._id}`); }}
                  >
                    <Edit2 />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-2 space-y-3">
          <div className="flex items-center justify-between ">
            <h3 className="font-bold text-lg line-clamp-1">
              {bus?.vehicle.name}
            </h3>

            {isPanel && (
              <Badge
                variant={
                  bus?.status === "approved"
                    ? "success"
                    : bus?.status === "rejected"
                    ? "destructive"
                    : "outline"
                }
              >
                {bus?.status === "approved"
                  ? "تایید شده"
                  : bus?.status === "rejected"
                  ? "رد شده"
                  : "در انتظار تایید"}
              </Badge>
            )}
          </div>

          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>
                {bus.from.province} به {bus.to.province}
              </span>
            </div>

            {isPanel && (
              <div className="flex items-center gap-2 mt-3">
                <Wallet className="w-4 h-4" />
                <span className="font-medium text-green-600">
                  درآمد کل: {totalEarnings?.toLocaleString("fa-IR")} تومان
                </span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">
                {averageRating} ({bus.comments?.length || 0})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>
                ظرفیت: {totalCapacity} نفر
                {totalCapacity > 0 && (
                  <span className="text-foreground font-medium mr-2">
                    ({remainingSeats > 0 ? `${remainingSeats} نفر خالی` : "تکمیل ظرفیت"})
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {bus.departureTime} تا {bus.arrivalTime}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-2 flex items-center justify-between">
          <div className="text-left">
            <p className="text-lg font-bold">
              {bus.price.toLocaleString("fa-IR")} تومان
            </p>
          </div>
          <span className={buttonVariants({ variant: "outline" })}>
            مشاهده جزئیات
          </span>
        </CardFooter>
      </Card>

      {isPanel && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>حذف وسیله نقلیه</DialogTitle>
              <DialogDescription>
                آیا از حذف این وسیله نقلیه اطمینان دارید؟
                <br />
                این عملیات غیرقابل بازگشت است.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="!flex !flex-row items-center justify-center gap-2">
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() => mutate(bus?._id)}
              >
                حذف
              </Button>
              <DialogClose asChild>
                <Button variant="outline">انصراف</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default BusCard;
