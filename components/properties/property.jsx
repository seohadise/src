"use client";

import Image from "next/image";
import Link from "next/link";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { commentSchema } from "@/schemas/comment";

import { createComment, createCommentReply } from "@/app/_actions";

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

import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";

import { getCoolingPersianName, getHeatingPersianName } from "@/lib/utils";

import { toast } from "sonner";
import { MessageSquare, DollarSign } from "lucide-react";

import {
  MapPin,
  Home,
  Calendar,
  Clock,
  Car,
  Building,
  ThermometerSun,
  Fan,
  Star,
} from "lucide-react";

const Property = ({ property, isLoggedin, isOwner, name }) => {
  const router = useRouter();

  const [selectedDates, setSelectedDates] = useState([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const form = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      name: name || "",
      text: "",
      rating: 5,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values) => createComment(values, "property"),
    onSuccess: (data) => {
      if (data.success) {
        router.refresh();
        form.reset();
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: () => {
      toast.error("خطا در ثبت نظر");
    },
  });

  const onSubmit = (values) => {
    mutate({
      itemId: property._id,
      ...values,
    });
  };

  const handleReply = async () => {
    setIsReplying(true);

    const res = await createCommentReply(
      { replyText, itemId: property._id, commentId: replyingTo },
      "property"
    );

    setIsReplying(false);

    if (res.success) {
      router.refresh();
      setReplyText("");
      setReplyingTo(null);
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{property.name}</h1>
        <div className="flex items-center gap-2 mt-2 text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>
            استان {property.address.province} - شهر {property.address.city}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {property?.images.map((image, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-lg overflow-hidden"
          >
            <Image
              src={image}
              alt={`${property.name} - تصویر ${index + 1}`}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">اطلاعات کلی</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span>ظرفیت: {property.capacity} نفر</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              <span>طبقه: {property.floor}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>سال ساخت: {property.yearBuilt}</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              <span>پارکینگ: {property.parkingAmount} عدد</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>ساعت ورود: {property.checkInTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>ساعت خروج: {property.checkOutTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <ThermometerSun className="w-4 h-4" />
              <span>گرمایش: {getHeatingPersianName(property.heating)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Fan className="w-4 h-4" />
              <span>سرمایش: {getCoolingPersianName(property.cooling)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">قیمت و شرایط</h2>
          <div className="space-y-4">
            {property.pricing ? (
              <>
                <div className="space-y-2">
                  <p className="text-xl font-bold text-green-600">
                    قیمت عادی: {property.pricing.regularPrice?.toLocaleString("fa-IR")} تومان شبی
                  </p>
                  <p className="text-lg font-semibold text-orange-600">
                    قیمت پیک: {property.pricing.peakPrice?.toLocaleString("fa-IR")} تومان شبی
                  </p>
                </div>
                {property.pricing.discount > 0 && (
                  <p className="text-red-500">{property.pricing.discount}٪ تخفیف</p>
                )}
                <p className="font-medium">بیعانه: {property.pricing.deposit} درصد</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {(property.price || 0)?.toLocaleString("fa-IR")} تومان شبی
                </p>
                {property.discount > 0 && (
                  <p className="text-red-500">{property.discount}٪ تخفیف</p>
                )}
                <p className="font-medium">بیعانه: {property.deposit} درصد</p>
              </>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-2">تاریخ‌های در دسترس</h2>
        <p className="text-muted-foreground whitespace-pre-wrap">
          محل دقیق ملک پس از رزرو به شما پیامک خواهد شد.
        </p>
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {property.availableDates?.map((date, index) => (
              <div
                key={index}
                onClick={() => {
                  if (!date.isReserved) {
                    setSelectedDates((prev) =>
                      prev.includes(date.date)
                        ? prev.filter((d) => d !== date.date)
                        : [...prev, date.date]
                    );
                  }
                }}
                className={`p-3 rounded-lg text-center border transition-colors cursor-pointer ${
                  date.isReserved
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : selectedDates.includes(date.date)
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 hover:bg-primary/20"
                }`}
              >
                <p className="text-sm">
                  {new Date(date.date).toLocaleDateString("fa-IR", {
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-xs mt-1">
                  {date.isReserved ? "رزرو شده" : "آزاد"}
                </p>
              </div>
            ))}
          </div>

          <div className="text-sm text-muted-foreground">
            {selectedDates.length > 0 && (
              <p>تعداد شب‌های انتخاب شده: {selectedDates.length} شب</p>
            )}
          </div>

          {/* پذیرش قوانین و مقررات */}
          {!isOwner && isLoggedin && (
            <div className="flex items-start space-x-3 space-x-reverse p-4 border rounded-lg bg-muted/30">
              <Checkbox
                id="acceptTermsProperty"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked)}
              />
              <label htmlFor="acceptTermsProperty" className="text-sm leading-relaxed cursor-pointer">
                <Link href="/dashboard/user/rules" target="_blank" className="text-primary font-bold underline">
                  قوانین و مقررات تریپ‌گود
                </Link>
                {" "}را مطالعه کرده‌ام و با تمامی موارد آن موافقم.
              </label>
            </div>
          )}
          {!isOwner && isLoggedin && !acceptedTerms && (
            <p className="text-sm text-destructive">
              پذیرش قوانین و مقررات برای رزرو الزامی است.
            </p>
          )}

          <Button
            className="w-full"
            size="lg"
            disabled={!isOwner && isLoggedin && !acceptedTerms}
            onClick={() => {
              if (!acceptedTerms) {
                toast.error("لطفاً ابتدا قوانین و مقررات را مطالعه و تایید کنید");
                return;
              }
              toast.info("سیستم رزرو در حال حاضر در دسترس نیست", {
                description:
                  "امکان رزرو آنلاین به زودی پس از راه‌اندازی درگاه پرداخت فعال خواهد شد. لطفا بعداً مراجعه فرمایید.",
              });
            }}
          >
            {selectedDates.length > 0
              ? `رزرو برای ${selectedDates.length} شب`
              : "لطفا تاریخ‌های مورد نظر را انتخاب کنید"}
          </Button>

          {/* دکمه‌های اضافی برای مالک */}
          {isOwner && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                asChild
              >
                <Link href={`/dashboard/property-owners/properties/payments/${property._id}`}>
                  <DollarSign className="w-4 h-4" />
                  گزارش مالی
                </Link>
              </Button>

              <Button
                variant="outline"
                className="flex items-center gap-2"
                asChild
              >
                <Link href={`/dashboard/property-owners/properties/comments/${property._id}`}>
                  <MessageSquare className="w-4 h-4" />
                  نظرات ({property.comments?.length || 0})
                </Link>
              </Button>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-1">توضیحات</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {property.description || "توضیحاتی ثبت نشده است"}
          </p>
        </Card>
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-1">قوانین</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {property.rules || "قوانینی ثبت نشده است"}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-1">امکانات</h2>
        <div className="flex items-center gap-3 flex-wrap">
          {property.facilities?.map((facility) => (
            <Badge key={facility.value}>{facility.label}</Badge>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">اتاق خواب‌ها</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {property.bedrooms?.map((bedroom, index) => (
            <Card key={index} className="p-4">
              <h3 className="font-semibold mb-2">{bedroom.bedName}</h3>
              <div className="space-y-2 text-sm">
                <p>تخت یک نفره: {bedroom.beds.single}</p>
                <p>تخت دو نفره: {bedroom.beds.double}</p>
                <p>مبل تختخواب شو: {bedroom.beds.sofa}</p>
                <p>پرده: {bedroom.amenities.curtain ? "دارد" : "ندارد"}</p>
                <p>تلویزیون: {bedroom.amenities.tv ? "دارد" : "ندارد"}</p>
                <p>کمد: {bedroom.amenities.closet ? "دارد" : "ندارد"}</p>
                <p>
                  سیستم گرمایشی:{" "}
                  {getHeatingPersianName(bedroom.amenities.heating)}
                </p>
                <p>
                  سیستم سرمایشی:{" "}
                  {getCoolingPersianName(bedroom.amenities.cooling)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">نظرات</h2>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">
                {property.comments?.length > 0
                  ? (
                      property.comments.reduce(
                        (sum, comment) => sum + comment.rating,
                        0
                      ) / property.comments.length
                    ).toFixed(1)
                  : "0"}{" "}
                ({property.comments?.length || 0} نظر)
              </span>
            </div>
          </div>

          {isLoggedin ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 mb-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    name="name"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام و نام خانوادگی</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="rating"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>میزان رای</FormLabel>
                        <Select
                          dir="rtl"
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full flex-1">
                              <SelectValue placeholder="لطفا میزان رای خود را وارد کنید" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <SelectItem
                                key={rating}
                                value={rating.toString()}
                              >
                                {rating} ستاره
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
                  name="text"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>متن نظر</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "در حال ثبت..." : "ثبت نظر"}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="text-center space-y-3 mb-6">
              <p className="text-muted-foreground text-sm">
                برای ثبت نظر باید وارد حساب کاربری خود شوید
              </p>
              <Button variant="outline" asChild>
                <Link href="/auth">ورود به حساب کاربری</Link>
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {property.comments?.filter(c => c.isApproved)?.map((comment, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{comment.name}</span>
                    <Badge variant="secondary">{comment.rating} ستاره</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString("fa-IR")}
                  </span>
                </div>
                <p className="text-sm">{comment.text}</p>
                {comment.reply && (
                  <div className="bg-muted/50 rounded-lg p-3 mr-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {comment.reply.name}
                      </span>
                      <Badge variant="outline">پاسخ</Badge>
                    </div>
                    <p className="text-sm">{comment.reply.text}</p>
                  </div>
                )}

                {isOwner && !comment.reply && (
                  <>
                    {replyingTo === comment._id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            disabled={isReplying || !replyText}
                            onClick={handleReply}
                          >
                            {isReplying ? "در حال ثبت..." : "ثبت پاسخ"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setReplyingTo(null)}
                          >
                            انصراف
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReplyingTo(comment._id)}
                        className="mt-2"
                      >
                        پاسخ به نظر
                      </Button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>
      </Card>
    </div>
  );
};

export default Property;
