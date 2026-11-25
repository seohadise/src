"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useMutation } from "@tanstack/react-query";
import { deleteFood } from "@/app/dashboard/food-owners/foods/_actions";

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

import { Button, buttonVariants } from "../ui/button";
import { Badge } from "../ui/badge";

import { toast } from "sonner";

import {
  MapPin,
  Trash2,
  Wallet,
  Star,
  Users,
  Edit2,
  UtensilsCrossed,
} from "lucide-react";

const FoodCard = ({ food, isPanel = false }) => {
  const router = useRouter();
  const totalEarnings = food.reservations?.reduce((sum, reservation) => {
    return reservation.paymentStatus === "paid"
      ? sum + reservation.totalPrice
      : sum;
  }, 0);

  const averageRating = food.comments?.length
    ? Math.round(
        (food.comments.reduce((sum, comment) => sum + comment.rating, 0) /
          food.comments.length) *
          10
      ) / 10
    : 0;

  // وضعیت رزرو
  const getReservationStatus = () => {
    const now = new Date();
    const availableDates = food.availableDates || [];

    // اگر غذا تایید نشده باشد
    if (food.status !== 'approved') {
      return { status: "not-approved", label: "در انتظار تایید", color: "secondary" };
    }

    // اگر هیچ تاریخی تعریف نشده باشد
    if (availableDates.length === 0) {
      return { status: "not-started", label: "شروع نشده", color: "secondary" };
    }

    // بررسی تاریخ‌های آینده
    const futureDates = availableDates.filter(dateObj => {
      const date = new Date(dateObj.date);
      return date >= now;
    });

    // بررسی تاریخ‌های آینده که ظرفیت دارند
    const futureAvailableDates = futureDates.filter(dateObj => {
      // اگر remainingCapacity تعریف شده، از آن استفاده کن
      if (dateObj.remainingCapacity !== undefined && dateObj.remainingCapacity !== null) {
        return dateObj.remainingCapacity > 0;
      }
      // در غیر این صورت از isReserved استفاده کن
      return !dateObj.isReserved;
    });

    // بررسی تاریخ‌های گذشته
    const pastDates = availableDates.filter(dateObj => {
      const date = new Date(dateObj.date);
      return date < now;
    });

    // اگر تاریخ‌های آزاد موجود باشد
    if (futureAvailableDates.length > 0) {
      return { status: "available", label: "موجود", color: "success" };
    }

    // اگر تاریخ آینده وجود دارد اما همه رزرو شده‌اند
    if (futureDates.length > 0 && futureAvailableDates.length === 0) {
      return { status: "sold-out", label: "رزرو شده", color: "destructive" };
    }

    // اگر فقط تاریخ‌های گذشته وجود دارد
    if (pastDates.length > 0 && futureDates.length === 0) {
      return { status: "sold-out", label: "تمام شده", color: "destructive" };
    }

    return { status: "not-started", label: "شروع نشده", color: "secondary" };
  };

  const reservationStatus = getReservationStatus();

  const { mutate, isPending } = useMutation({
    mutationFn: deleteFood,
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setTimeout(() => {
          location.href = "/dashboard/food-owners";
        }, 700);
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
    router.push(`/food/${food?._id}`);
  };

  return (
    <div className="block">
      <Card
        className="overflow-hidden group pt-0 cursor-pointer hover:shadow-lg transition-shadow"
        onClick={handleCardClick}
      >
        <div className="relative aspect-square">
            <Image
              src={food?.images[0]}
              alt="آشپزخانه"
              fill
              className="object-cover transition-all duration-300 group-hover:scale-105 rounded-b-xl hover:rounded-b-none cursor-pointer"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

          <div className="absolute top-2 px-2 w-full pointer-events-none">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Badge className="bg-white/80 text-black">
                  آشپزخانه {food?.staff?.chef?.name}
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
                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/food-owners/foods/edit/${food?._id}`); }}
                  >
                    <Edit2 />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg line-clamp-1">
              آشپزخانه {food?.staff?.chef?.name}
            </h3>

            {isPanel && (
              <Badge
                variant={
                  food?.status === "approved"
                    ? "success"
                    : food?.status === "rejected"
                    ? "destructive"
                    : "outline"
                }
              >
                {food?.status === "approved"
                  ? "تایید شده"
                  : food?.status === "rejected"
                  ? "رد شده"
                  : "در انتظار تایید"}
              </Badge>
            )}
          </div>

          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>
                {food.address.province} - {food.address.city}
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
                {averageRating} ({food.comments?.length || 0})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>ظرفیت روزانه: {food.dailyCapacity} پرس</span>
            </div>

            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4" />
              <span>حداقل سفارش: {food.pricing.minimumOrder} پرس</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-2 flex items-center justify-between">
          <div className="text-left">
            <p className="text-lg font-bold">
              {Math.round(food.pricing.basePrice * 1.06)?.toLocaleString("fa-IR")} تومان
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
              <DialogTitle>حذف آشپزخانه</DialogTitle>
              <DialogDescription>
                آیا از حذف این آشپزخانه اطمینان دارید؟
                <br />
                این عملیات غیرقابل بازگشت است.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="!flex !flex-row items-center justify-center gap-2">
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() => mutate(food?._id)}
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

export default FoodCard;
