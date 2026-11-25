"use client";

import Image from "next/image";

import Uploader from "../global/uplodaer";
import Back from "../global/back";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useLocations } from "@/hooks/use-locations";
import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { busSchema } from "@/schemas/bus";

import { createBus } from "@/app/dashboard/bus-owners/buses/_actions";

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

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";

import { format } from "date-fns-jalali";

import { cn } from "@/lib/utils";

import { CalendarIcon } from "lucide-react";

import { toast } from "sonner";

const NewBus = () => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const fromLocations = useLocations();
  const toLocations = useLocations();

  const handleFromProvinceChange = (value) => {
    fromLocations.setSelectedProvince(value);
    form.setValue("from.city", "");
  };

  const handleToProvinceChange = (value) => {
    toLocations.setSelectedProvince(value);
    form.setValue("to.city", "");
  };

  const form = useForm({
    resolver: zodResolver(busSchema),
    defaultValues: {
      vehicle: {
        color: "",
        name: "",
        ownerName: "",
        plate: "",
        type: "bus",
        capacity: 1,
        model: Number(format(new Date(), "yyyy")),
      },
      amenities: {
        heating: false,
        cooling: false,
      },
      company: {
        name: "",
      },
      from: {
        province: "",
        city: "",
      },
      to: {
        province: "",
        city: "",
      },
      departureTime: "",
      arrivalTime: "",
      date: new Date(),
      price: 10000,
      images: [],
      documents: {
        driverLicense: "",
        insurance: "",
      },
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createBus,
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setTimeout(() => {
          location.href = "/dashboard/bus-owners";
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
    <div className="relative min-h-screen flex flex-col lg:items-center justify-center gap-5 p-6">
      <Back />

      <h1 className="font-bold text-xl lg:text-3xl text-center">
        ثبت وسیله نقلیه جدید
      </h1>

      <p className="font-bold text-xs text-center leading-loose">
        لطفا در وارد کردن اطلاعات دقت نمایید ، زیرا بعد از اولین رزرو موفق این
        اطلاعات قابل ویرایش یا حذف نخواهند شد.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {form.watch("images")?.map((image) => (
          <div
            key={image}
            className="relative aspect-square w-full h-[250px] overflow-hidden rounded-lg"
          >
            <Image
              src={image}
              alt="Car Image"
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
          className="flex flex-col lg:w-1/2 lg:grid lg:grid-cols-2 lg:items-center lg:mx-auto lg:p-3 gap-3"
        >
          <FormField
            name="images"
            control={form.control}
            render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel>تصاویر</FormLabel>
                <FormControl>
                  <Uploader
                    title="انتخاب تصاویر خودرو"
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
            name="vehicle.type"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>نوع وسیله نقلیه</FormLabel>
                <Select
                  dir="rtl"
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bus">اتوبوس</SelectItem>
                    <SelectItem value="minibus">مینی‌بوس</SelectItem>
                    <SelectItem value="van">ون</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="vehicle.name"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>نام خودرو</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="vehicle.color"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>رنگ</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="برای مثال مشکی" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="vehicle.plate"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>پلاک</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="vehicle.ownerName"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>نام مالک</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="vehicle.capacity"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>ظرفیت</FormLabel>
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
            name="company.name"
            control={form.control}
            render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel>نام شرکت</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="from.province"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>استان مبدا</FormLabel>
                <Select
                  dir="rtl"
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleFromProvinceChange(value);
                  }}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="لطفا استان مبدا را انتخاب کنید" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {fromLocations.provinces?.map((province) => (
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
            name="from.city"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>شهر مبدا</FormLabel>
                <Select
                  dir="rtl"
                  onValueChange={(value) => field.onChange(value)}
                  value={field.value || ""}
                  disabled={!fromLocations.cities}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="لطفا شهر مبدا را انتخاب کنید" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {fromLocations.cities?.map((city) => (
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
            name="to.province"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>استان مقصد</FormLabel>
                <Select
                  dir="rtl"
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleToProvinceChange(value);
                  }}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="لطفا استان مقصد را انتخاب کنید" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {toLocations.provinces?.map((province) => (
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
            name="to.city"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>شهر مقصد</FormLabel>
                <Select
                  dir="rtl"
                  onValueChange={(value) => field.onChange(value)}
                  value={field.value || ""}
                  disabled={!toLocations.cities}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="لطفا شهر مقصد را انتخاب کنید" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {toLocations.cities?.map((city) => (
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
            name="departureTime"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>ساعت حرکت</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="arrivalTime"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>ساعت رسیدن</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="date"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاریخ حرکت</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "yyyy/MM/dd")
                        ) : (
                          <span>انتخاب تاریخ</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="price"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>قیمت (تومان)</FormLabel>
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
            name="amenities.heating"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex items-center my-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="mr-2">سیستم گرمایشی</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            name="amenities.cooling"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex items-center my-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="mr-2">سیستم سرمایشی</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            name="documents.driverLicense"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>تصویر گواهینامه راننده</FormLabel>
                <FormControl>
                  <div>
                    <Uploader
                      title="بارگذاری گواهینامه"
                      value={field.value ? [field.value] : []}
                      onUpload={(url) => {
                        form.setValue("documents.driverLicense", url || "");
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

          <FormField
            name="documents.insurance"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>تصویر بیمه شخص ثالث</FormLabel>
                <FormControl>
                  <div>
                    <Uploader
                      title="بارگذاری بیمه نامه"
                      value={field.value ? [field.value] : []}
                      onUpload={(url) => {
                        form.setValue("documents.insurance", url || "");
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
          <div className="col-span-2 flex items-start space-x-3 space-x-reverse p-4 border rounded-lg bg-muted/30">
            <Checkbox
              id="acceptTermsBus"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked)}
            />
            <label htmlFor="acceptTermsBus" className="text-sm leading-relaxed cursor-pointer">
              <Link href="/dashboard/bus-owners/rules" target="_blank" className="text-primary font-bold underline">
                قوانین و مقررات ثبت وسیله نقلیه
              </Link>
              {" "}را مطالعه کرده‌ام و با تمامی موارد آن موافقم.
            </label>
          </div>
          {!acceptedTerms && (
            <p className="col-span-2 text-sm text-destructive">
              پذیرش قوانین و مقررات برای ثبت وسیله نقلیه الزامی است.
            </p>
          )}

          <Button size="lg" className="w-full col-span-2" disabled={isPending || !acceptedTerms}>
            ثبت وسیله نقلیه
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default NewBus;
