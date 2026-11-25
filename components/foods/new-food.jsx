"use client";

import Uploader from "../global/uplodaer";

import dynamic from "next/dynamic";
import Image from "next/image";

const Location = dynamic(() => import("../global/location"), {
  ssr: false,
});

import { useForm, useFieldArray } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useLocations } from "@/hooks/use-locations";

import { zodResolver } from "@hookform/resolvers/zod";
import { foodSchema } from "@/schemas/food";

import { createFood } from "@/app/dashboard/food-owners/foods/_actions";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { toast } from "sonner";
import { formatDateInPersian } from "@/lib/date";

import { Plus, X, Clock, CalendarIcon } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const NewFood = () => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { provinces, cities, setSelectedProvince } = useLocations();

  const handleProvinceChange = (value) => {
    setSelectedProvince(value);
    form.setValue("address.city", "");
  };

  const form = useForm({
    resolver: zodResolver(foodSchema),
    defaultValues: {
      phone: "",
      address: {
        province: "",
        city: "",
        fullAddress: "",
        location: {
          lat: "",
          lng: "",
        },
      },
      dailyCapacity: 1,
      foods: [],
      staff: {
        chef: {
          name: "",
        },
        cooks: [],
      },
      images: [],
      pricing: {
        basePrice: 0,
        minimumOrder: 1,
      },
      workingHours: {
        startTime: "08:00",
        endTime: "22:00",
        workingDays: ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday"],
        isActive: true,
      },
      availableDates: [],
      status: "pending",
      documents: {
        healthCard: "",
      },
    },
  });

  const {
    fields: cookFields,
    append: appendCook,
    remove: removeCook,
  } = useFieldArray({
    control: form.control,
    name: "staff.cooks",
  });

  const {
    fields: foodFields,
    append: appendFood,
    remove: removeFood,
  } = useFieldArray({
    control: form.control,
    name: "foods",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createFood,
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setTimeout(() => {
          location.href = "/dashboard/food-owners";
        }, 1500);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || "خطایی رخ داده است");
    },
  });

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-6">ثبت رستوران جدید</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {form.watch("images")?.map((image) => (
          <div
            key={image}
            className="relative aspect-square w-full h-[250px] overflow-hidden rounded-lg"
          >
            <Image
              src={image}
              alt="Property Image"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover object-center hover:scale-105 transition-transform duration-300"
              priority
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                const currentImages = form.getValues("images");
                form.setValue(
                  "images",
                  currentImages.filter((img) => img !== image)
                );
              }}
              className="absolute top-2 right-2 w-fit"
            >
              حذف
            </Button>
          </div>
        ))}
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(mutate)}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <FormField
            name="phone"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>شماره تماس</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="dailyCapacity"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>ظرفیت پخت روزانه</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    value={Number(field.value)}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="address.province"
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
                      <SelectValue placeholder="لطفا استان خود را انتخاب کنید" />
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
            name="address.city"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>شهر</FormLabel>
                <Select
                  dir="rtl"
                  onValueChange={(value) => field.onChange(value)}
                  value={field.value || ""}
                  disabled={!cities}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="لطفا شهر خود را انتخاب کنید" />
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

          <FormField
            name="address.fullAddress"
            control={form.control}
            render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel>آدرس کامل</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="آدرس دقیق محل آشپزخانه..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="images"
            control={form.control}
            render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel>تصاویر</FormLabel>
                <FormControl>
                  <Uploader
                    title="انتخاب تصاویر غذاها"
                    value={field.value}
                    onUpload={(urls) => form.setValue("images", urls)}
                    multiple
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="address.location.lat"
            control={form.control}
            render={() => (
              <FormItem className="lg:col-span-2">
                <FormLabel>موقعیت مکانی آشپزخانه</FormLabel>
                <FormControl>
                  <Location
                    onPosition={(pos) => {
                      form.setValue("address.location.lat", String(pos[0]));
                      form.setValue("address.location.lng", String(pos[1]));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="staff.chef.name"
            control={form.control}
            render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel>نام سرآشپز</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2 lg:col-span-2">
            <div className="flex items-center justify-between">
              <FormLabel>آشپزها</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendCook({ name: "" })}
              >
                <Plus className="w-4 h-4 mr-2" />
                افزودن آشپز
              </Button>
            </div>
            {cookFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <FormField
                  name={`staff.cooks.${index}.name`}
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="نام آشپز" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCook(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2 lg:col-span-2">
            <div className="flex items-center justify-between">
              <FormLabel>غذاها</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendFood("")}
              >
                <Plus className="w-4 h-4 mr-2" />
                افزودن غذا
              </Button>
            </div>
            {foodFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <FormField
                  name={`foods.${index}`}
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="نام غذا" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFood(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <FormField
            name="pricing.basePrice"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>قیمت پایه (تومان)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    value={Number(field.value)}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="pricing.minimumOrder"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>حداقل سفارش</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    value={Number(field.value)}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ساعات کاری */}
          <div className="lg:col-span-2 space-y-4 border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <h3 className="text-lg font-semibold">ساعات کاری آشپزخانه</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="workingHours.startTime"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ساعت شروع</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="workingHours.endTime"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ساعت پایان</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name="workingHours.workingDays"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>روزهای کاری</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { value: "saturday", label: "شنبه" },
                      { value: "sunday", label: "یکشنبه" },
                      { value: "monday", label: "دوشنبه" },
                      { value: "tuesday", label: "سه‌شنبه" },
                      { value: "wednesday", label: "چهارشنبه" },
                      { value: "thursday", label: "پنج‌شنبه" },
                      { value: "friday", label: "جمعه" },
                    ].map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={day.value}
                          checked={field.value?.includes(day.value)}
                          onCheckedChange={(checked) => {
                            const currentDays = field.value || [];
                            if (checked) {
                              field.onChange([...currentDays, day.value]);
                            } else {
                              field.onChange(currentDays.filter((d) => d !== day.value));
                            }
                          }}
                        />
                        <label
                          htmlFor={day.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {day.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="workingHours.isActive"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>آشپزخانه فعال است</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      در صورت غیرفعال بودن، سفارش جدیدی دریافت نخواهید کرد
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* تاریخ‌های موجود */}
          <FormField
            control={form.control}
            name="availableDates"
            render={({ field }) => {
              const [dateRange, setDateRange] = useState(null);

              return (
                <FormItem className="lg:col-span-2">
                  <FormLabel>تاریخ‌های موجود برای سفارش</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full font-normal"
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {formatDateInPersian("range", dateRange)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={(range) => {
                          setDateRange(range);

                          if (range?.from && range?.to) {
                            const dates = [];
                            const currentDate = new Date(range.from);
                            const endDate = new Date(range.to);

                            while (currentDate <= endDate) {
                              dates.push({
                                date: new Date(currentDate),
                              });
                              currentDate.setDate(currentDate.getDate() + 1);
                            }

                            field.onChange(dates);
                          } else {
                            field.onChange([]);
                          }
                        }}
                        disabled={(date) => date < new Date()}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            name="documents.healthCard"
            control={form.control}
            render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel>تصویر کارت سلامت</FormLabel>
                <FormControl>
                  <div>
                    <Uploader
                      title="بارگذاری کارت سلامت"
                      value={field.value ? [field.value] : []}
                      onUpload={(url) => {
                        form.setValue("documents.healthCard", url || "");
                        field.onChange(url || "");
                      }}
                    />
                    {field.value && (
                      <p className="text-xs text-green-600 mt-1">✓ فایل آپلود شد</p>
                    )}
                    <input type="hidden" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* پذیرش قوانین و مقررات */}
          <div className="lg:col-span-2 flex items-start space-x-3 space-x-reverse p-4 border rounded-lg bg-muted/30">
            <Checkbox
              id="acceptTermsFood"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked)}
            />
            <label htmlFor="acceptTermsFood" className="text-sm leading-relaxed cursor-pointer">
              <Link href="/dashboard/food-owners/rules" target="_blank" className="text-primary font-bold underline">
                قوانین و مقررات ثبت رستوران
              </Link>
              {" "}را مطالعه کرده‌ام و با تمامی موارد آن موافقم.
            </label>
          </div>
          {!acceptedTerms && (
            <p className="lg:col-span-2 text-sm text-destructive">
              پذیرش قوانین و مقررات برای ثبت رستوران الزامی است.
            </p>
          )}

          <Button className="w-full lg:col-span-2" disabled={isPending || !acceptedTerms}>
            ثبت رستوران
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default NewFood;
