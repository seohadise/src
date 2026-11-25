"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { updatePropertyStatus } from "@/app/iso/properties/_actions";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";

const fixS3Url = (url) => {
  if (!url || typeof url !== "string") return url;
  if (/%[0-9A-Fa-f]{2}/.test(url)) {
    return url.replace(/%(?=[0-9A-Fa-f]{2})/g, "%25");
  }
  return url;
};

const PropertyDetailsDialog = ({ property }) => {
  const [status, setStatus] = useState(property.status);
  const [rejectReason, setRejectReason] = useState("");
  const [isEditing, setIsEditing] = useState(false);



  // فیلدهای قابل ویرایش
  const [name, setName] = useState(property.name || "");
  const [managerName, setManagerName] = useState(property.managerName || "");
  const [capacity, setCapacity] = useState(property.capacity || 0);
  const [regularPrice, setRegularPrice] = useState(property.pricing?.regularPrice || property.price || 0);
  const [peakPrice, setPeakPrice] = useState(property.pricing?.peakPrice || (property.pricing?.regularPrice || property.price || 0) * 1.5);
  const [discount, setDiscount] = useState(property.pricing?.discount || 0);
  const [deposit, setDeposit] = useState(property.pricing?.deposit || 10);

  const { mutate, isPending } = useMutation({
    mutationFn: updatePropertyStatus,
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
  });

  const { mutate: updateProperty, isPending: isUpdating } = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(`/api/admin/properties/${property._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setIsEditing(false);
        setTimeout(() => {
          location.reload();
        }, 1000);
      } else {
        toast.error(data.message);
      }
    },
  });

  const handleUpdate = () => {
    updateProperty({
      name,
      managerName,
      capacity: Number(capacity),
      pricing: {
        regularPrice: Number(regularPrice),
        peakPrice: Number(peakPrice),
        discount: Number(discount),
        deposit: Number(deposit),
      },
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          جزئیات
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            جزئیات ملک
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "لغو ویرایش" : "ویرایش"}
            </Button>
          </DialogTitle>
        </DialogHeader>

        {isEditing && (
          <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
            <h3 className="font-semibold">ویرایش اطلاعات</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">نام ملک</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="managerName">نام مدیر</Label>
                <Input
                  id="managerName"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="capacity">ظرفیت</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="regularPrice">قیمت عادی (تومان)</Label>
                <Input
                  id="regularPrice"
                  type="number"
                  value={regularPrice}
                  onChange={(e) => setRegularPrice(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="peakPrice">قیمت پیک (تومان)</Label>
                <Input
                  id="peakPrice"
                  type="number"
                  value={peakPrice}
                  onChange={(e) => setPeakPrice(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="discount">تخفیف (درصد)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="80"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="deposit">بیعانه (درصد)</Label>
                <Input
                  id="deposit"
                  type="number"
                  min="10"
                  max="80"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? "در حال بروزرسانی..." : "بروزرسانی اطلاعات"}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">تصاویر ملک</h3>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {property.images?.map((image, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={fixS3Url(image)}
                      alt={`${property.name} - تصویر ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* مدارک ملک */}
            <div>
              <h3 className="font-semibold">مدارک ملک</h3>
              <div className="space-y-3 mt-2">
                {property.document && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">فیش آب/برق/گاز</h4>
                    <div className="aspect-[3/2] max-w-xs">
                      <img
                        src={fixS3Url(property.document)}
                        alt="فیش آب/برق/گاز"
                        className="w-full h-full object-cover rounded-lg border"
                      />
                    </div>
                  </div>
                )}

                {(!property.document) && (
                  <p className="text-sm text-muted-foreground">
                    فیش آب/برق/گاز آپلود نشده است
                  </p>
                )}

                {property.ownershipDocument && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">سند مالکیت</h4>
                    <div className="aspect-[3/2] max-w-xs">
                      <img
                        src={fixS3Url(property.ownershipDocument)}
                        alt="سند مالکیت"
                        className="w-full h-full object-cover rounded-lg border"
                      />
                    </div>
                  </div>
                )}

                {(!property.ownershipDocument) && (
                  <p className="text-sm text-muted-foreground">
                    سند مالکیت آپلود نشده است
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">اطلاعات کلی</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>نام ملک:</div>
                <div className="font-medium">{property.name}</div>
                <div>نوع ملک:</div>
                <div>{property.type === "villa" ? "ویلا" : property.type === "apartment" ? "آپارتمان" : property.type === "garden" ? "باغ" : property.type}</div>
                <div>ظرفیت:</div>
                <div>{property.capacity} نفر</div>
                <div>متراژ:</div>
                <div>{property.area} متر مربع</div>
                <div>قیمت عادی:</div>
                <div>
                  {property.pricing
                    ? `${property.pricing.regularPrice?.toLocaleString("fa-IR")} تومان`
                    : `${property.price?.toLocaleString("fa-IR") || "0"} تومان`
                  }
                </div>
                <div>قیمت پیک:</div>
                <div>
                  {property.pricing?.peakPrice
                    ? `${property.pricing.peakPrice.toLocaleString("fa-IR")} تومان`
                    : "تعیین نشده"
                  }
                </div>
                <div>تخفیف:</div>
                <div>
                  {property.pricing?.discount !== undefined
                    ? `${property.pricing.discount}%`
                    : "0%"
                  }
                </div>
                <div>بیعانه:</div>
                <div>
                  {property.pricing?.deposit !== undefined
                    ? `${property.pricing.deposit}%`
                    : "10%"
                  }
                </div>
                <div>سال ساخت:</div>
                <div>{property.yearBuilt || "تعیین نشده"}</div>
                <div>تعداد اتاق:</div>
                <div>{property.rooms || "تعیین نشده"}</div>
                <div>تعداد حمام:</div>
                <div>{property.bathrooms || "تعیین نشده"}</div>
                <div>تعداد طبقه:</div>
                <div>{property.floors || "تعیین نشده"}</div>
                <div>پارکینگ:</div>
                <div>{property.parking ? "دارد" : "ندارد"}</div>
                <div>آسانسور:</div>
                <div>{property.elevator ? "دارد" : "ندارد"}</div>
                <div>بالکن:</div>
                <div>{property.balcony ? "دارد" : "ندارد"}</div>
                <div>تاریخ ایجاد:</div>
                <div>{new Date(property.createdAt).toLocaleDateString("fa-IR")}</div>
                <div>وضعیت:</div>
                <div>
                  <Badge
                    variant={
                      property.status === "approved" ? "success" :
                      property.status === "rejected" ? "destructive" : "warning"
                    }
                  >
                    {property.status === "approved"
                      ? "تایید شده"
                      : property.status === "rejected"
                      ? "رد شده"
                      : "در انتظار تایید"}
                  </Badge>
                </div>
                {property.rejectReason && (
                  <>
                    <div>دلیل رد:</div>
                    <div className="col-span-2 text-red-600">{property.rejectReason}</div>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">اطلاعات مالک ملک</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>نام مالک:</div>
                <div className="font-medium">{property.owner?.fullName || "تعیین نشده"}</div>
                <div>ایمیل:</div>
                <div className="font-medium">{property.owner?.email || "تعیین نشده"}</div>
                <div>شماره تماس:</div>
                <div className="font-medium">{property.owner?.number || "تعیین نشده"}</div>
                <div>کد ملی:</div>
                <div className="font-medium">{property.owner?.identityInfo?.nationalId || "تعیین نشده"}</div>
                <div>نام:</div>
                <div className="font-medium">{property.owner?.identityInfo?.ownerInfo?.firstName || "تعیین نشده"}</div>
                <div>نام خانوادگی:</div>
                <div className="font-medium">{property.owner?.identityInfo?.ownerInfo?.lastName || "تعیین نشده"}</div>
                <div>نام پدر:</div>
                <div className="font-medium">{property.owner?.identityInfo?.ownerInfo?.fatherName || "تعیین نشده"}</div>
                <div>تاریخ تولد:</div>
                <div className="font-medium">
                  {property.owner?.identityInfo?.ownerInfo?.birthDate
                    ? new Date(property.owner.identityInfo.ownerInfo.birthDate).toLocaleDateString("fa-IR")
                    : "تعیین نشده"
                  }
                </div>
                <div>محل تولد:</div>
                <div className="font-medium">{property.owner?.identityInfo?.ownerInfo?.birthPlace || "تعیین نشده"}</div>
                <div>آدرس:</div>
                <div className="font-medium col-span-2">{property.owner?.identityInfo?.ownerInfo?.address || "تعیین نشده"}</div>
                <div>نوع کاربر:</div>
                <div className="font-medium">
                  {property.owner?.type === 'property-owner' ? 'مالک ملک' : 'کاربر عادی'}
                </div>@@
                <div>وضعیت تایید کاربر:</div>
                <div>
                  <Badge variant={property.owner?.isVerified ? "success" : "destructive"}>
                    {property.owner?.isVerified ? "تایید شده" : "تایید نشده"}
                  </Badge>
                </div>

                <div>وضعیت تایید هویت:</div>
                <div>
                  <Badge
                    variant={
                      property.owner?.identityInfo?.isIdentityVerified ? "success" : "destructive"
                    }
                  >
                    {property.owner?.identityInfo?.isIdentityVerified ? "تایید شده" : "تایید نشده"}
                  </Badge>
                </div>
                {property.owner?.identityInfo?.identityVerifiedAt && (
                  <>
                    <div>تاریخ تایید هویت:</div>
                    <div className="font-medium">
                      {new Date(property.owner.identityInfo.identityVerifiedAt).toLocaleDateString("fa-IR")}
                    </div>
                  </>
                )}
              </div>

              {/* کارت شناسایی مالک */}
              {(() => {
                // بررسی منابع کارت شناسایی
                const propertyNationalId = property.nationalIdCard;
                const userNationalId = property.owner?.identityInfo?.nationalIdImage;

                // اولویت با property.nationalIdCard (عکس مخصوص این ملک)
                const nationalIdImage = propertyNationalId || userNationalId;

                return (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">کارت شناسایی مالک</h4>

                    {nationalIdImage ? (
                      <div>
                        <div className="aspect-[3/2] max-w-sm">
                          <img
                            src={fixS3Url(nationalIdImage)}
                            alt="کارت شناسایی مالک"
                            className="w-full h-full object-cover rounded-lg border"
                          />
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          <div>
                            شناسه مالک: {property.owner?._id ? String(property.owner._id) : "تعیین نشده"}
                          </div>
                          <div>
                            آدرس تصویر: <span dir="ltr">{String(nationalIdImage)}</span>
                          </div>
                          <div className="mt-1">
                            منبع: {propertyNationalId ? "ملک" : userNationalId ? "کاربر" : "نامشخص"}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          کارت شناسایی آپلود نشده است
                        </p>
                        {/* دکمه تست برای اضافه کردن کارت شناسایی نمونه */}
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch("/api/admin/add-test-national-id", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  userId: property.owner._id,
                                  nationalIdImageUrl:
                                    "https://via.placeholder.com/400x250/cccccc/666666?text=National+ID+Test",
                                }),
                              });
                              const data = await response.json();
                              if (data.success) {
                                alert("کارت شناسایی تست اضافه شد. صفحه را رفرش کنید.");
                                window.location.reload();
                              } else {
                                alert("خطا: " + data.message);
                              }
                            } catch (error) {
                              alert("خطا در اتصال");
                            }
                          }}
                          className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                        >
                          اضافه کردن کارت شناسایی تست
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* اطلاعات بانکی مالک */}
              {property.owner?.bankInfo && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">اطلاعات بانکی مالک</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>شماره شبا:</div>
                    <div className="font-medium">{property.owner.bankInfo.shebaNumber || "تعیین نشده"}</div>
                    <div>شماره حساب:</div>
                    <div className="font-medium">{property.owner.bankInfo.accountNumber || "تعیین نشده"}</div>
                    <div>شماره کارت:</div>
                    <div className="font-medium">{property.owner.bankInfo.cardNumber || "تعیین نشده"}</div>
                    <div>نام صاحب حساب:</div>
                    <div className="font-medium">{property.owner.bankInfo.ownerName || "تعیین نشده"}</div>
                  </div>
                </div>
              )}

              {/* اطلاعات کیف پول مالک */}
              {property.owner?.wallet && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">کیف پول مالک</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>موجودی:</div>
                    <div className="font-medium text-green-600">
                      {property.owner.wallet.balance?.toLocaleString("fa-IR") || "0"} تومان
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2">اطلاعات مدیر ملک</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>نام مدیر:</div>
                <div className="font-medium">{property.managerName || "تعیین نشده"}</div>
                <div>شماره تماس:</div>
                <div className="font-medium">{property.managerNumber || "تعیین نشده"}</div>
                {property.emergencyContact && (
                  <>
                    <div>تماس اضطراری:</div>
                    <div className="font-medium">{property.emergencyContact}</div>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">آدرس</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>استان:</div>
                <div>{property.address?.province || "تعیین نشده"}</div>
                <div>شهر:</div>
                <div>{property.address?.city || "تعیین نشده"}</div>
                {property.address?.fullAddress && (
                  <>
                    <div>آدرس کامل:</div>
                    <div className="col-span-2">{property.address.fullAddress}</div>
                  </>
                )}
                {property.location && (
                  <>
                    <div>موقعیت جغرافیایی:</div>
                    <div className="col-span-2 text-xs">
                      عرض: {property.location.lat}, طول: {property.location.lng}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">ساعات ورود و خروج</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>ساعت ورود:</div>
                <div>{property.checkInTime || "تعیین نشده"}</div>
                <div>ساعت خروج:</div>
                <div>{property.checkOutTime || "تعیین نشده"}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">سیستم‌های گرمایشی و سرمایشی</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>گرمایش:</div>
                <div>{property.heating || "تعیین نشده"}</div>
                <div>سرمایش:</div>
                <div>{property.cooling || "تعیین نشده"}</div>
              </div>
            </div>

            {property.amenities && property.amenities.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">امکانات</h3>
                <div className="flex flex-wrap gap-1">
                  {property.amenities.map((amenity, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {amenity.label || amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {property.description && (
              <div>
                <h3 className="font-semibold mb-2">توضیحات</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {property.description}
                </p>
              </div>
            )}

            {property.rules && (
              <div>
                <h3 className="font-semibold mb-2">قوانین</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {property.rules}
                </p>
              </div>
            )}

            {/* تاریخ‌های در دسترس */}
            {property.availableDates && property.availableDates.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">تاریخ‌های در دسترس</h3>
                <div className="max-h-40 overflow-y-auto">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {property.availableDates.slice(0, 20).map((dateObj, index) => (
                      <div key={index} className={`p-2 rounded border ${dateObj.isReserved ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                        <div>{new Date(dateObj.date).toLocaleDateString("fa-IR")}</div>
                        <div className={`text-xs ${dateObj.isReserved ? 'text-red-600' : 'text-green-600'}`}>
                          {dateObj.isReserved ? 'رزرو شده' : 'آزاد'}
                        </div>
                        {dateObj.isPeakSeason && (
                          <div className="text-xs text-orange-600">پیک</div>
                        )}
                      </div>
                    ))}
                  </div>
                  {property.availableDates.length > 20 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      و {property.availableDates.length - 20} تاریخ دیگر...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-full space-y-4 border-t mt-6 pt-4">
          <h3 className="font-semibold">تغییر وضعیت</h3>
          <div className="flex flex-col gap-4">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="انتخاب وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">در انتظار بررسی</SelectItem>
                <SelectItem value="approved">تایید</SelectItem>
                <SelectItem value="rejected">رد</SelectItem>
              </SelectContent>
            </Select>

            {status === "rejected" && (
              <Textarea
                placeholder="دلیل رد درخواست را وارد کنید"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            )}

            <Button
              disabled={isPending || status === property.status}
              onClick={() =>
                mutate({
                  propertyId: property._id,
                  status,
                  rejectReason: status === "rejected" ? rejectReason : "",
                })
              }
            >
              ثبت تغییرات
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const columns = [
  {
    accessorKey: "name",
    header: "نام ملک",
  },
  {
    accessorKey: "managerName",
    header: "نام مدیر ملک",
  },
  {
    accessorKey: "user.fullName",
    header: "نام کاربر",
  },
  {
    accessorKey: "user.number",
    header: "شماره تماس کاربر",
  },
  {
    id: "reservations",
    header: "تعداد رزروها",
    cell: ({ row }) => {
      const property = row.original;
      return property.reservationsCount || 0;
    },
  },
  {
    id: "totalEarnings",
    header: "کل درآمد",
    cell: ({ row }) => {
      const property = row.original;
      const earnings = property.totalEarnings || 0;
      return `${earnings.toLocaleString("fa-IR")} تومان`;
    },
  },
  {
    id: "status",
    header: "وضعیت",
    cell: ({ row }) => {
      const property = row.original;
      return (
        <Badge
          variant={
            property.status === "approved" ? "success" :
            property.status === "rejected" ? "destructive" : "warning"
          }
        >
          {property.status === "approved"
            ? "تایید شده"
            : property.status === "rejected"
            ? "رد شده"
            : "در انتظار تایید"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <PropertyDetailsDialog property={row.original} />,
  },
];
