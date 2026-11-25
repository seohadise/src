"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Star, MessageCircle, Eye, Calendar, TrendingUp, MessageSquare, DollarSign, Trash2 } from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

const PropertyCard = ({ property, isPanel = false }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  // اگر ملک یا ID آن وجود نداشت، این کامپوننت اصلا رندر نمی‌شود
  if (!property || !property._id) {
    return null;
  }

  const handleDelete = async () => {
    if (!confirm("آیا از حذف این ملک اطمینان دارید؟ این عمل غیرقابل بازگشت است.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await axios.delete(`/api/property/${property._id}`);
      
      if (response.data.success) {
        toast.success(response.data.message || "ملک با موفقیت حذف شد");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(response.data.message || "خطا در حذف ملک");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "خطا در حذف ملک");
    } finally {
      setIsDeleting(false);
    }
  };

      const locationText =
        property.address?.city && property.address?.province
          ? `${property.address.city}, ${property.address.province}`
          : property.location?.city && property.location?.province
          ? `${property.location.city}, ${property.location.province}`
          : "مکان نامشخص";

      const imageUrl = (property.images && property.images.length > 0)
        ? property.images[0]
        : "/placeholder.png"; // یک تصویر جایگزین در صورت نبود عکس

      // محاسبه آمار برای پنل مالک
      const totalReservations = property.reservations?.length || 0;
      const averageRating = property.comments?.length
        ? (property.comments.reduce((sum, comment) => sum + comment.rating, 0) / property.comments.length).toFixed(1)
        : 0;
      const totalComments = property.comments?.length || 0;

      // محاسبه درآمد کل
      const totalEarnings = property.reservations?.reduce((sum, reservation) => {
        return reservation.paymentStatus === "paid" ? sum + (reservation.totalPrice || 0) : sum;
      }, 0) || 0;

      // وضعیت فروش
      const getSalesStatus = () => {
        const now = new Date();
        const availableDates = property.availableDates || [];

        // اگر ملک تایید نشده باشد
        if (property.status !== 'approved') {
          return { status: "not-approved", label: "در انتظار تایید", color: "secondary" };
        }

        // اگر هیچ تاریخی تعریف نشده باشد
        if (availableDates.length === 0) {
          return { status: "not-started", label: "شروع نشده", color: "secondary" };
        }

        // بررسی تاریخ‌های آینده که رزرو نشده‌اند
        const futureAvailableDates = availableDates.filter(dateObj => {
          const date = new Date(dateObj.date);
          return date >= now && !dateObj.isReserved;
        });

        // بررسی تاریخ‌های گذشته
        const pastDates = availableDates.filter(dateObj => {
          const date = new Date(dateObj.date);
          return date < now;
        });

        if (futureAvailableDates.length > 0) {
          return { status: "selling", label: "درحال فروش", color: "default" };
        } else if (pastDates.length > 0) {
          return { status: "sold-out", label: "تمام شده", color: "destructive" };
        } else {
          return { status: "not-started", label: "شروع نشده", color: "secondary" };
        }
      };

      const salesStatus = getSalesStatus();

      // For non-panel cards, wrap entire card with Link
      if (!isPanel) {
        return (
          <Link href={`/property/${property._id}`} className="block group">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="relative w-full h-48 group-hover:opacity-90 transition-opacity">
                  <Image
                    src={imageUrl}
                    alt={property.name || "تصویر ملک"}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                </div>
                <CardTitle className="mt-4 truncate">{property.name || property.title || "عنوان نامشخص"}</CardTitle>
                {property.propertyCode && (
                  <span className="text-xs text-muted-foreground">کد ملک: {property.propertyCode}</span>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground truncate">{locationText}</p>
                <p className="font-bold">
                  {(() => {
                    const basePrice = property.pricing?.regularPrice || property.price || 0;
                    return `${basePrice.toLocaleString("fa-IR")} تومان`;
                  })()}{" "}
                  <span className="text-sm font-normal text-muted-foreground">/ شب</span>
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      }

      // For panel cards, keep the original structure with buttons
      return (
        <Card>
          <CardHeader>
            <Link href={`/property/${property._id}`} className="block">
              <div className="relative w-full h-48 cursor-pointer hover:opacity-90 transition-opacity">
                <Image
                  src={imageUrl}
                  alt={property.name || "تصویر ملک"}
                  fill
                  className="object-cover rounded-t-lg"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant={salesStatus.color} className="text-xs">
                    {salesStatus.label}
                  </Badge>
                </div>
              </div>
            </Link>
            <CardTitle className="mt-4 truncate">{property.name || property.title || "عنوان نامشخص"}</CardTitle>
            {property.propertyCode && (
              <span className="text-xs text-muted-foreground">کد ملک: {property.propertyCode}</span>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground truncate">{locationText}</p>
            <p className="font-bold">
              {(() => {
                const basePrice = property.pricing?.regularPrice || property.price || 0;
                return `${basePrice.toLocaleString("fa-IR")} تومان`;
              })()}{" "}
              <span className="text-sm font-normal text-muted-foreground">/ شب</span>
            </p>

            <div className="space-y-2 pt-2 border-t">
              {/* آمار نظرات و امتیاز */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>{averageRating > 0 ? averageRating : "بدون امتیاز"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  <span>{totalComments} نظر</span>
                </div>
              </div>

              {/* آمار رزرو */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <span>{totalReservations} رزرو</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  <span>{totalEarnings.toLocaleString("fa-IR")} تومان</span>
                </div>
              </div>

              {/* وضعیت ملک */}
              <div className="text-xs text-muted-foreground">
                وضعیت: <span className={`font-medium ${
                  property.status === 'approved' ? 'text-green-600' :
                  property.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {property.status === 'approved' ? 'تایید شده' :
                   property.status === 'pending' ? 'در انتظار تایید' : 'رد شده'}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="gap-2 flex-wrap">
            <Link
              href={`/dashboard/property-owners/properties/edit/${property._id}`}
              className={buttonVariants({ variant: "outline", className: "flex-1" })}
            >
              ویرایش
            </Link>
            <Link
              href={`/property/${property._id}`}
              className={buttonVariants({ variant: "default", className: "flex-1" })}
            >
              <Eye className="w-4 h-4 mr-1" />
              مشاهده
            </Link>
            <div className="flex gap-2 w-full mt-2">
              <Link
                href={`/dashboard/property-owners/properties/comments/${property._id}`}
                className={buttonVariants({ variant: "secondary", className: "flex-1" })}
              >
                <MessageSquare className="w-4 h-4 ml-1" />
                نظرات ({totalComments})
              </Link>
              <Link
                href={`/dashboard/property-owners/properties/payments/${property._id}`}
                className={buttonVariants({ variant: "secondary", className: "flex-1" })}
              >
                <DollarSign className="w-4 h-4 ml-1" />
                گزارش مالی
              </Link>
            </div>
            <Button
              variant="destructive"
              className="w-full mt-2"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 ml-1" />
              {isDeleting ? "در حال حذف..." : "حذف ملک"}
            </Button>
          </CardFooter>
        </Card>
      );
    };

    export default PropertyCard;