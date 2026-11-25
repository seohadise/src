"use client";

import Image from "next/image";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { updateFoodStatus } from "@/app/iso/foods/_actions";

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

const FoodDetailsDialog = ({ food }) => {
  const [status, setStatus] = useState(food.status);
  const [rejectReason, setRejectReason] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // فیلدهای قابل ویرایش
  const [phone, setPhone] = useState(food.phone || "");
  const [dailyCapacity, setDailyCapacity] = useState(food.dailyCapacity || 0);
  const [description, setDescription] = useState(food.description || "");

  const { mutate, isPending } = useMutation({
    mutationFn: updateFoodStatus,
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

  const { mutate: updateFood, isPending: isUpdating } = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(`/api/admin/foods/${food._id}`, {
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
    updateFood({
      phone,
      dailyCapacity: Number(dailyCapacity),
      description,
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
            جزئیات آشپزخانه
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
                <Label htmlFor="phone">شماره تماس</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dailyCapacity">ظرفیت روزانه</Label>
                <Input
                  id="dailyCapacity"
                  type="number"
                  value={dailyCapacity}
                  onChange={(e) => setDailyCapacity(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">توضیحات</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
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
              <h3 className="font-semibold">تصاویر آشپزخانه</h3>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {food.images?.map((image, index) => (
                  <div key={index} className="relative aspect-square">
                    <Image
                      src={image}
                      alt={`تصویر آشپزخانه ${index + 1}`}
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
                {food.owner?.identityInfo?.nationalIdImage && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">کارت شناسایی مالک</h4>
                    <div className="relative aspect-[3/2] max-w-xs">
                      <Image
                        src={food.owner.identityInfo.nationalIdImage}
                        alt="کارت شناسایی مالک"
                        fill
                        className="object-cover rounded-lg border"
                      />
                    </div>
                  </div>
                )}

                {(!food.owner?.identityInfo?.nationalIdImage) && (
                  <p className="text-sm text-muted-foreground">
                    کارت شناسایی مالک آپلود نشده است
                  </p>
                )}
              </div>
            </div>

            {/* مدارک بهداشتی */}
            <div>
              <h3 className="font-semibold">مدارک بهداشتی</h3>
              <div className="space-y-3 mt-2">
                {food.documents?.healthCard ? (
                  <div>
                    <h4 className="text-sm font-medium mb-1">کارت سلامت</h4>
                    <div className="relative aspect-[3/2] max-w-xs border rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={food.documents.healthCard}
                        alt="کارت سلامت"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 break-all">
                      {food.documents.healthCard}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    کارت سلامت آپلود نشده است
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">اطلاعات مالک آشپزخانه</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>نام مالک:</div>
                <div className="font-medium">{food.owner?.fullName || "تعیین نشده"}</div>
                <div>ایمیل:</div>
                <div className="font-medium">{food.owner?.email || "تعیین نشده"}</div>
                <div>شماره تماس:</div>
                <div className="font-medium">{food.owner?.number || "تعیین نشده"}</div>
                <div>کد ملی:</div>
                <div className="font-medium">{food.owner?.identityInfo?.nationalId || "تعیین نشده"}</div>
                <div>نوع کاربر:</div>
                <div className="font-medium">
                  {food.owner?.type === 'food-owner' ? 'مالک آشپزخانه' : 'کاربر عادی'}
                </div>
                <div>وضعیت تایید:</div>
                <div>
                  <Badge variant={food.owner?.isVerified ? "success" : "destructive"}>
                    {food.owner?.isVerified ? "تایید شده" : "تایید نشده"}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">اطلاعات آشپزخانه</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>نام آشپزخانه:</div>
                <div className="font-medium">{food.name || "تعیین نشده"}</div>
                <div>نام آشپز:</div>
                <div className="font-medium">{food.staff?.chef?.name || "تعیین نشده"}</div>
                <div>ظرفیت روزانه:</div>
                <div>{food.dailyCapacity} پرس</div>
                <div>شماره تماس:</div>
                <div className="font-medium">{food.phone}</div>
                <div>قیمت پایه:</div>
                <div className="font-medium">
                  {food.pricing?.basePrice?.toLocaleString("fa-IR")} تومان
                </div>
                <div>حداقل سفارش:</div>
                <div>{food.pricing?.minimumOrder} پرس</div>
                <div>وضعیت:</div>
                <div>
                  <Badge
                    variant={food.status === "approved" ? "success" : "warning"}
                  >
                    {food.status === "approved"
                      ? "تایید شده"
                      : "در انتظار تایید"}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">اطلاعات آشپز</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>نام آشپز:</div>
                <div className="font-medium">{food.chef?.name || "تعیین نشده"}</div>
                <div>سابقه کار:</div>
                <div>{food.chef?.experience || "تعیین نشده"} سال</div>
                <div>تخصص:</div>
                <div>{food.chef?.specialty || "تعیین نشده"}</div>
                <div>کد ملی:</div>
                <div className="font-medium">{food.chef?.nationalId || "تعیین نشده"}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">آدرس</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>استان:</div>
                <div>{food.address?.province}</div>
                <div>شهر:</div>
                <div>{food.address?.city}</div>
                {food.address?.fullAddress && (
                  <>
                    <div>آدرس کامل:</div>
                    <div className="col-span-2">{food.address.fullAddress}</div>
                  </>
                )}
              </div>
            </div>

            {food.description && (
              <div>
                <h3 className="font-semibold mb-2">توضیحات</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {food.description}
                </p>
              </div>
            )}

            {food.foods && food.foods.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">غذاهای قابل پخت</h3>
                <div className="flex flex-wrap gap-1">
                  {food.foods.map((foodItem, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {foodItem}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {food.specialties && food.specialties.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">تخصص‌ها</h3>
                <div className="flex flex-wrap gap-2">
                  {food.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {food.foods && food.foods.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">غذاها</h3>
                <div className="flex flex-wrap gap-1">
                  {food.foods.map((item, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {food.staff && (
              <div>
                <h3 className="font-semibold mb-2">کادر آشپزخانه</h3>
                <div className="space-y-2 text-sm">
                  {food.staff.chef?.name && (
                    <div>سرآشپز: {food.staff.chef.name}</div>
                  )}
                  {food.staff.cooks && food.staff.cooks.length > 0 && (
                    <div>
                      <div className="mb-1">آشپزها:</div>
                      <div className="flex flex-wrap gap-1">
                        {food.staff.cooks.map((cook, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {cook.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
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
              disabled={isPending || status === food.status}
              onClick={() =>
                mutate({
                  foodId: food._id,
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
    accessorKey: "owner.fullName",
    header: "نام آشپز",
  },
  {
    accessorKey: "phone",
    header: "شماره تماس",
  },
  {
    accessorKey: "dailyCapacity",
    header: "ظرفیت روزانه",
  },
  {
    id: "actions",
    cell: ({ row }) => <FoodDetailsDialog food={row.original} />,
  },
];
