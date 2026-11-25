"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { toast } from "sonner";

const UserDetailsDialog = ({ user }) => {
  const [isVerified, setIsVerified] = useState(user.isVerified);
  const [isBanned, setIsBanned] = useState(user.isBanned);
  const [userType, setUserType] = useState(user.type);
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [number, setNumber] = useState(user.number);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(`/api/admin/users/${user._id}`, {
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
        setTimeout(() => {
          location.reload();
        }, 1000);
      } else {
        toast.error(data.message);
      }
    },
  });

  const handleUpdate = () => {
    mutate({
      fullName,
      email,
      number,
      type: userType,
      isVerified,
      isBanned,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          ویرایش
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>ویرایش کاربر</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">نام و نام خانوادگی</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="number">شماره تماس</Label>
              <Input
                id="number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="userType">نوع کاربری</Label>
              <Select value={userType} onValueChange={setUserType}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب نوع کاربری" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">مشتری</SelectItem>
                  <SelectItem value="property-owner">ملک دار</SelectItem>
                  <SelectItem value="bus-owner">اتوبوس دار</SelectItem>
                  <SelectItem value="food-owner">غذا دار</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="isVerified">تایید شده</Label>
              <Switch
                id="isVerified"
                checked={isVerified}
                onCheckedChange={setIsVerified}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isBanned">مسدود شده</Label>
              <Switch
                id="isBanned"
                checked={isBanned}
                onCheckedChange={setIsBanned}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">اطلاعات اضافی</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>استان: {user.province}</div>
              <div>شهر: {user.city}</div>
              <div>موجودی کیف پول: {(user.wallet?.balance || 0).toLocaleString("fa-IR")} تومان</div>
              <div>تاریخ عضویت: {new Date(user.createdAt).toLocaleDateString("fa-IR")}</div>
            </div>
          </div>

          <Button
            onClick={handleUpdate}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "در حال بروزرسانی..." : "بروزرسانی کاربر"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const columns = [
  {
    accessorKey: "fullName",
    header: "نام و نام خانوادگی",
  },
  {
    accessorKey: "email",
    header: "آدرس ایمیل",
  },
  {
    accessorKey: "number",
    header: "شماره تماس",
  },
  {
    accessorKey: "type",
    header: "نوع کاربری",
    cell: ({ row }) => {
      return row?.original.type === "food-owner"
        ? "غذا دار"
        : row?.original.type === "bus-owner"
        ? "اتوبوس دار"
        : row?.original.type === "property-owner"
        ? "ملک دار"
        : "مشتری";
    },
  },
  {
    id: "status",
    header: "وضعیت",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex gap-1">
          {user.isVerified && (
            <Badge variant="default" className="text-xs">تایید شده</Badge>
          )}
          {user.isBanned && (
            <Badge variant="destructive" className="text-xs">مسدود</Badge>
          )}
          {!user.isVerified && !user.isBanned && (
            <Badge variant="secondary" className="text-xs">در انتظار تایید</Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "province",
    header: "استان",
  },
  {
    accessorKey: "city",
    header: "شهر",
  },
  {
    id: "actions",
    cell: ({ row }) => <UserDetailsDialog user={row.original} />,
  },
];
