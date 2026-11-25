"use client";

import Image from "next/image";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { updateBusStatus } from "@/app/iso/buses/_actions";

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

const BusDetailsDialog = ({ bus }) => {
  const [status, setStatus] = useState(bus?.status);
  const [rejectReason, setRejectReason] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // فیلدهای قابل ویرایش
  const [vehicleName, setVehicleName] = useState(bus.vehicle?.name || "");
  const [ownerName, setOwnerName] = useState(bus.vehicle?.ownerName || "");
  const [companyName, setCompanyName] = useState(bus.company?.name || "");
  const [price, setPrice] = useState(bus.price || 0);

  const { mutate, isPending } = useMutation({
    mutationFn: updateBusStatus,
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

  const { mutate: updateBus, isPending: isUpdating } = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(`/api/admin/buses/${bus._id}`, {
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
    updateBus({
      vehicle: {
        name: vehicleName,
        ownerName: ownerName,
      },
      company: {
        name: companyName,
      },
      price: Number(price),
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
            جزئیات وسیله نقلیه
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
                <Label htmlFor="vehicleName">نام وسیله نقلیه</Label>
                <Input
                  id="vehicleName"
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ownerName">نام مالک</Label>
                <Input
                  id="ownerName"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="companyName">نام شرکت</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="price">قیمت (تومان)</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
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
              <h3 className="font-semibold">تصاویر وسیله نقلیه</h3>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {bus.images?.map((image, index) => (
                  <div key={index} className="relative aspect-square">
                    <Image
                      src={image}
                      alt={`تصویر وسیله نقلیه ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* مدارک مالک */}
            <div>
              <h3 className="font-semibold">مدارک مالک</h3>
              <div className="space-y-3 mt-2">
                {bus.owner?.identityInfo?.nationalIdImage && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">کارت شناسایی مالک</h4>
                    <div className="relative aspect-[3/2] max-w-xs">
                      <Image
                        src={bus.owner.identityInfo.nationalIdImage}
                        alt="کارت شناسایی مالک"
                        fill
                        className="object-cover rounded-lg border"
                      />
                    </div>
                  </div>
                )}

                {(!bus.owner?.identityInfo?.nationalIdImage) && (
                  <p className="text-sm text-muted-foreground">
                    کارت شناسایی مالک آپلود نشده است
                  </p>
                )}
              </div>
            </div>

            {/* مدارک وسیله نقلیه */}
            <div>
              <h3 className="font-semibold">مدارک وسیله نقلیه</h3>
              <div className="space-y-3 mt-2">
                {bus.documents?.driverLicense ? (
                  <div>
                    <h4 className="text-sm font-medium mb-1">گواهینامه راننده</h4>
                    <div className="relative aspect-[3/2] max-w-xs border rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={bus.documents.driverLicense}
                        alt="گواهینامه راننده"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 break-all">
                      {bus.documents.driverLicense}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    گواهینامه راننده آپلود نشده است
                  </p>
                )}

                {bus.documents?.insurance ? (
                  <div>
                    <h4 className="text-sm font-medium mb-1">بیمه شخص ثالث</h4>
                    <div className="relative aspect-[3/2] max-w-xs border rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={bus.documents.insurance}
                        alt="بیمه شخص ثالث"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 break-all">
                      {bus.documents.insurance}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    بیمه شخص ثالث آپلود نشده است
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">اطلاعات وسیله نقلیه</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>نوع وسیله:</div>
                <div>
                  {bus.vehicle.type === "bus"
                    ? "اتوبوس"
                    : bus.vehicle.type === "minibus"
                    ? "مینی‌بوس"
                    : "ون"}
                </div>
                <div>نام وسیله:</div>
                <div className="font-medium">{bus.vehicle.name}</div>
                <div>رنگ:</div>
                <div>{bus.vehicle.color}</div>
                <div>پلاک:</div>
                <div className="font-medium">{bus.vehicle.plate}</div>
                <div>مدل:</div>
                <div>{bus.vehicle.model}</div>
                <div>ظرفیت:</div>
                <div>{bus.vehicle.capacity} نفر</div>
                <div>نام مالک:</div>
                <div className="font-medium">{bus.vehicle.ownerName}</div>
                <div>قیمت:</div>
                <div className="font-medium">{bus.price?.toLocaleString("fa-IR")} تومان</div>
                <div>وضعیت:</div>
                <div>
                  <Badge
                    variant={bus.status === "approved" ? "success" : "warning"}
                  >
                    {bus.status === "approved"
                      ? "تایید شده"
                      : "در انتظار تایید"}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">اطلاعات راننده</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>نام راننده:</div>
                <div className="font-medium">{bus.driver?.name || "تعیین نشده"}</div>
                <div>شماره تماس:</div>
                <div className="font-medium">{bus.driver?.phone || "تعیین نشده"}</div>
                <div>کد ملی:</div>
                <div className="font-medium">{bus.driver?.nationalId || "تعیین نشده"}</div>
                <div>سابقه رانندگی:</div>
                <div>{bus.driver?.experience || "تعیین نشده"} سال</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">اطلاعات مالک</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>نام مالک:</div>
                <div className="font-medium">{bus.owner?.fullName || "تعیین نشده"}</div>
                <div>ایمیل:</div>
                <div className="font-medium">{bus.owner?.email || "تعیین نشده"}</div>
                <div>شماره تماس:</div>
                <div className="font-medium">{bus.owner?.number || "تعیین نشده"}</div>
                <div>کد ملی:</div>
                <div className="font-medium">{bus.owner?.identityInfo?.nationalId || "تعیین نشده"}</div>
                <div>نوع کاربر:</div>
                <div className="font-medium">
                  {bus.owner?.type === 'bus-owner' ? 'مالک اتوبوس' : 'کاربر عادی'}
                </div>
                <div>وضعیت تایید:</div>
                <div>
                  <Badge variant={bus.owner?.isVerified ? "success" : "destructive"}>
                    {bus.owner?.isVerified ? "تایید شده" : "تایید نشده"}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">اطلاعات شرکت</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>نام شرکت:</div>
                <div className="font-medium">{bus.company?.name || "تعیین نشده"}</div>
                <div>شماره تماس:</div>
                <div className="font-medium">{bus.company?.phone || "تعیین نشده"}</div>
                <div>آدرس:</div>
                <div className="col-span-2">{bus.company?.address || "تعیین نشده"}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">مسیر</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>مبدا:</div>
                <div>
                  {bus.from.province} - {bus.from.city}
                </div>
                <div>مقصد:</div>
                <div>
                  {bus.to.province} - {bus.to.city}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">زمان‌بندی</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>ساعت حرکت:</div>
                <div>{bus.departureTime}</div>
                <div>ساعت رسیدن:</div>
                <div>{bus.arrivalTime}</div>
                <div>تاریخ:</div>
                <div>
                  {new Date(bus.date).toLocaleDateString("fa-IR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">امکانات</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {bus.amenities?.heating && (
                  <Badge variant="secondary">سیستم گرمایشی</Badge>
                )}
                {bus.amenities?.cooling && (
                  <Badge variant="secondary">سیستم سرمایشی</Badge>
                )}
              </div>
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
                disabled={isPending || status === bus.status}
                onClick={() =>
                  mutate({
                    busId: bus._id,
                    status,
                    rejectReason: status === "rejected" ? rejectReason : "",
                  })
                }
              >
                ثبت تغییرات
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const columns = [
  {
    accessorKey: "vehicle.name",
    header: "نام وسیله نقلیه",
  },
  {
    accessorKey: "vehicle.ownerName",
    header: "نام مالک",
  },
  {
    accessorKey: "owner.number",
    header: "شماره تماس مالک",
  },
  {
    accessorKey: "company.name",
    header: "نام شرکت",
  },
  {
    accessorKey: "status",
    header: "وضعیت",
    cell: ({ row }) => {
      return row?.original.status === "pending"
        ? "در انتظار"
        : row?.original.status === "approved"
        ? "تایید شده"
        : row?.original.status === "rejected"
        ? "رد شده"
        : "نامشخص";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <BusDetailsDialog bus={row.original} />,
  },
];
