"use client";

import Link from "next/link";

import Back from "../global/back";

import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";

import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema } from "@/schemas/user";

import { useLocations } from "@/hooks/use-locations";
import { updateProfile } from "@/app/_actions";
import { verifyEmail } from "@/app/auth/_actions";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

import { Input } from "../ui/input";
import { Button, buttonVariants } from "../ui/button";
import { Calendar } from "../ui/calendar";

import { formatDateInPersian } from "@/lib/date";

import { CalendarIcon } from "lucide-react";

import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";

import imageCompression from "browser-image-compression";
import { Loader2, Camera, X } from "lucide-react";

const Profile = ({ user }) => {
  const { provinces, cities, setSelectedProvince } = useLocations();

  const [isEmailSending, setIsEmailSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const savedCooldown = localStorage.getItem("emailVerificationCooldown");
    const remainingTime = savedCooldown
      ? Math.max(0, parseInt(savedCooldown) - Date.now())
      : 0;

    setCooldown(Math.floor(remainingTime / 1000));

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          localStorage.removeItem("emailVerificationCooldown");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      avatar: user?.avatar || "",
      fullName: user?.fullName || "",
      email: user?.email || "",
      province: user?.province || "",
      city: user?.city || "",
      gender: user?.gender || "male",
      phone: user?.phone || "",
      birthDate: user?.birthDate ? new Date(user.birthDate) : new Date(),
      bankInfo: {
        accountNumber: user?.bankInfo?.accountNumber || "",
        shebaNumber: user?.bankInfo?.shebaNumber || "",
        cardNumber: user?.bankInfo?.cardNumber || "",
        ownerName: user?.bankInfo?.ownerName || "",
      },
    },
  });

  const handleProvinceChange = (value) => {
    setSelectedProvince(value);
    form.setValue("city", "");
  };

  const { mutate, isPending } = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setTimeout(() => {
          location.reload();
        }, 1500);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || "خطایی رخ داده است");
    },
  });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("فقط فایل‌های تصویری (JPG, PNG, WebP) مجاز هستند");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم تصویر نباید بیشتر از ۵ مگابایت باشد");
      return;
    }

    try {
      setAvatarUploading(true);
      const options = { maxSizeMB: 1, maxWidthOrHeight: 400, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("folder", "avatars");
      formData.append("originalName", file.name);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      setAvatarUrl(data.url);
      form.setValue("avatar", data.url, { shouldDirty: true });
      toast.success("عکس پروفایل با موفقیت آپلود شد");
    } catch (error) {
      toast.error("خطا در آپلود عکس پروفایل");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl("");
    form.setValue("avatar", "", { shouldDirty: true });
  };

  return (
    <div className="p-3 relative">
      <Back />
      {user?.type === "customer" && (
        <Link
          href="/dashboard/user/change-password"
          className={buttonVariants({})}
        >
          تغییر رمز عبور
        </Link>
      )}
      <Card className="max-w-xl mx-auto mt-6">
        <CardHeader>
          <CardTitle>ویرایش پروفایل</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(mutate)} className="space-y-4">
              <div className="flex flex-col items-center gap-3 pb-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-2 border-gray-300">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="عکس پروفایل"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Camera className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={avatarUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarUploading ? (
                    <>
                      <Loader2 className="animate-spin ml-2 h-4 w-4" />
                      در حال آپلود...
                    </>
                  ) : (
                    <>
                      <Camera className="ml-2 h-4 w-4" />
                      {avatarUrl ? "تغییر عکس پروفایل" : "آپلود عکس پروفایل"}
                    </>
                  )}
                </Button>
              </div>

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام و نام خانوادگی</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="علی مرادی" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ایمیل (اختیاری)</FormLabel>
                    <FormControl>
                      <Input {...field} dir="ltr" className="text-right" placeholder="example@gmail.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  name="province"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>استان</FormLabel>
                      <Select
                        dir="rtl"
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleProvinceChange(value);
                        }}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="انتخاب استان" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {provinces?.map((province) => (
                            <SelectItem key={province} value={province}>
                              {province}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="city"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شهر</FormLabel>
                      <Select
                        dir="rtl"
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        disabled={!cities}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="انتخاب شهر" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cities?.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>جنسیت</FormLabel>
                    <FormControl>
                      <RadioGroup
                        dir="rtl"
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4 rtl:space-x-reverse"
                      >
                        <div className="flex items-center gap-2 rtl:space-x-reverse">
                          <RadioGroupItem value="male" id="male" />
                          <label htmlFor="male">مرد</label>
                        </div>
                        <div className="flex items-center gap-2  rtl:space-x-reverse">
                          <RadioGroupItem value="female" id="female" />
                          <label htmlFor="female">زن</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تلفن ثابت</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاریخ تولد</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full text-right"
                          >
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {formatDateInPersian("single", field.value)}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 border rounded-lg p-4">
                <h3 className="font-medium">اطلاعات بانکی</h3>

                <FormField
                  control={form.control}
                  name="bankInfo.ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام و نام خانوادگی صاحب حساب</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankInfo.accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شماره حساب</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankInfo.shebaNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شماره شبا</FormLabel>
                      <FormControl>
                        <Input {...field} dir="ltr" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankInfo.cardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شماره کارت</FormLabel>
                      <FormControl>
                        <Input {...field} dir="ltr" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                disabled={isPending || !form.formState.isDirty}
                size="lg"
                className="w-full"
              >
                ذخیره تغییرات
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {!user?.emailVerifiedAt && (
        <div className="max-w-xl mx-auto mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-yellow-800 text-sm">
              برای استفاده از تمامی امکانات وبسایت لطفا ایمیل خود را تایید
              نمایید
            </p>
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={isEmailSending || cooldown > 0}
              onClick={async () => {
                setIsEmailSending(true);
                try {
                  const { success, message } = await verifyEmail();
                  toast[success ? "success" : "error"](message);
                  if (success) {
                    const newCooldown = Date.now() + 120 * 1000;
                    localStorage.setItem(
                      "emailVerificationCooldown",
                      newCooldown.toString()
                    );
                    setCooldown(120);
                  }
                } finally {
                  setIsEmailSending(false);
                }
              }}
            >
              {isEmailSending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-800 border-t-transparent" />
                  در حال ارسال
                </span>
              ) : cooldown > 0 ? (
                `${Math.floor(cooldown / 60)}:${(cooldown % 60)
                  .toString()
                  .padStart(2, "0")}`
              ) : (
                "ارسال ایمیل تایید"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
