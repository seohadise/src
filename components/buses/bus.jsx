"use client";

import Image from "next/image";
import Link from "next/link";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axios from "axios";

import { zodResolver } from "@hookform/resolvers/zod";
import { commentSchema } from "@/schemas/comment";

import { createComment, createCommentReply } from "@/app/_actions";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";

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
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar as CalendarComponent } from "../ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { toast } from "sonner";
import { PaymentMethodDialog } from "@/components/payment/payment-method-dialog";

const Bus = ({ bus, isLoggedin, isOwner, name }) => {
  const router = useRouter();

  const [selectedImage, setSelectedImage] = useState(bus?.images[0]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  // State های مربوط به رزرو
  const [selectedDate, setSelectedDate] = useState(null);
  const [guests, setGuests] = useState({ adults: 1, children: 0 });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [availableDates, setAvailableDates] = useState(bus?.availableDates || []);
  
  // State for payment dialog
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [payableAmount, setPayableAmount] = useState(0);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  // Fetch wallet balance
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (isLoggedin) {
        try {
          const response = await axios.get("/api/wallet/balance");
          if (response.data.success) {
            setWalletBalance(response.data.balance || 0);
          }
        } catch (error) {
          console.error("Error fetching wallet balance:", error);
        }
      }
    };
    fetchWalletBalance();
  }, [isLoggedin]);

  // تابع تبدیل تاریخ میلادی به شمسی
  const formatPersianDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("fa-IR");
  };

  const form = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      name: name || "",
      text: "",
      rating: 5,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values) => createComment(values, "bus"),
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
      itemId: bus._id,
      ...values,
    });
  };

  const handleReply = async () => {
    setIsReplying(true);

    const res = await createCommentReply(
      { replyText, itemId: bus?._id, commentId: replyingTo },
      "bus"
    );

    setIsReplying(false);

    if (res.success) {
      router.refresh();
      form.reset();
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="container mx-auto p-3 md:p-5 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="relative aspect-video rounded-lg overflow-hidden">
            <Image
              src={selectedImage}
              alt={bus?.vehicle?.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {bus?.images.map((image, index) => (
              <div
                key={index}
                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${
                  selectedImage === image
                    ? "ring ring-primary"
                    : "opacity-70 hover:opacity-100"
                }`}
                onClick={() => setSelectedImage(image)}
              >
                <Image
                  src={image}
                  alt={`${bus?.vehicle?.name} ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h1 className="text-3xl font-bold mb-2">{bus?.vehicle?.name}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {bus?.vehicle?.type === "bus"
                  ? "اتوبوس"
                  : bus?.vehicle?.type === "mini-bus"
                  ? "مینی بوس"
                  : "ون"}
              </Badge>
              <Badge variant="outline">مدل : {bus.vehicle.model}</Badge>
            </div>
          </div>

          <Card>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold mb-2">مشخصات وسیله نقلیه</h3>
                <div className="flex items-center gap-2 text-sm">
                  <div className="text-muted-foreground">نوع:</div>
                  <div>
                    {bus?.vehicle?.type === "bus"
                      ? "اتوبوس"
                      : bus?.vehicle?.type === "mini-bus"
                      ? "مینی بوس"
                      : "ون"}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="text-muted-foreground">رنگ:</div>
                  <div>{bus.vehicle.color}</div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="text-muted-foreground">پلاک:</div>
                  <div>{bus.vehicle.plate}</div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="text-muted-foreground">ظرفیت:</div>
                  <div>{bus.vehicle.capacity} نفر</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold mb-2">مسیر</h3>
                <div className="flex items-center gap-2 text-sm">
                  <div className="text-muted-foreground">مبدا:</div>
                  <div>
                    {bus.from.province} - {bus.from.city}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="text-muted-foreground">مقصد:</div>
                  <div>
                    {bus.to.province} - {bus.to.city}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold mb-2">امکانات</h3>
                <div className="flex items-center gap-2 text-sm">
                  <div className="text-muted-foreground">سیستم سرمایشی:</div>
                  <div>{bus.amenities?.cooling ? "دارد" : "ندارد"}</div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="text-muted-foreground">سیستم گرمایشی:</div>
                  <div>{bus.amenities?.heating ? "دارد" : "ندارد"}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold mb-2">زمان‌بندی</h3>

                <div className="flex items-center gap-2 text-sm">
                  <div className="text-muted-foreground">ساعت حرکت:</div>
                  <div>{bus.departureTime}</div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <div className="text-muted-foreground">ساعت رسیدن:</div>
                  <div>{bus.arrivalTime}</div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <div className="text-muted-foreground">تاریخ:</div>
                  <div>
                    {new Date(bus.date).toLocaleDateString("fa-IR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold mb-2">قیمت</h3>
                {(() => {
                  const totalGuests = guests.adults + guests.children;
                  const basePrice = bus.price * totalGuests;
                  const commissionRate = 6;
                  const commissionAmount = Math.round((basePrice * commissionRate) / 100);
                  const totalPrice = basePrice + commissionAmount;
                  const taxRate = 10;
                  const taxAmount = Math.round((totalPrice * taxRate) / 100);
                  const finalPayable = totalPrice + taxAmount;
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>قیمت پایه ({totalGuests} نفر)</span>
                        <span>{basePrice.toLocaleString("fa-IR")} تومان</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>کارمزد سرویس ({commissionRate}%)</span>
                        <span>{commissionAmount.toLocaleString("fa-IR")} تومان</span>
                      </div>
                      <div className="flex justify-between text-sm border-t pt-2">
                        <span>جمع کل</span>
                        <span>{totalPrice.toLocaleString("fa-IR")} تومان</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>مالیات ({taxRate}%)</span>
                        <span>{taxAmount.toLocaleString("fa-IR")} تومان</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>مبلغ قابل پرداخت</span>
                        <span className="text-primary">{finalPayable.toLocaleString("fa-IR")} تومان</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* انتخاب تاریخ */}
              {!isOwner && isLoggedin && (
                <div className="space-y-4">
                  <h4 className="font-medium">انتخاب تاریخ سفر</h4>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? formatPersianDate(selectedDate) : "انتخاب تاریخ سفر"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => {
                          // غیرفعال کردن تاریخ‌های گذشته
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const isInPast = date < today;

                          if (isInPast) {
                            return true;
                          }

                          // اگر اتوبوس availableDates دارد، فقط آن تاریخ‌ها مجاز هستند
                          if (availableDates && availableDates.length > 0) {
                            const dateObj = availableDates.find(
                              (d) => new Date(d.date).toDateString() === date.toDateString()
                            );

                            // اگر تاریخ در لیست نباشد یا رزرو شده باشد، غیرفعال کن
                            const shouldDisable = !dateObj || dateObj.isReserved;
                            return shouldDisable;
                          }

                          // اگر availableDates خالی است، فقط تاریخ اصلی اتوبوس مجاز است
                          if (bus?.date) {
                            const busMainDate = new Date(bus.date);
                            busMainDate.setHours(0, 0, 0, 0);
                            const isBusDate = date.toDateString() === busMainDate.toDateString();
                            const isReserved = bus.isReserved;

                            // فقط تاریخ اصلی اتوبوس مجاز است (اگر رزرو نشده)
                            const shouldDisable = !isBusDate || isReserved;
                            return shouldDisable;
                          }

                          // اگر هیچ تاریخی ندارد، همه غیرفعال
                          return true;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* انتخاب تعداد مهمان */}
                  <div className="space-y-3">
                    <h4 className="font-medium">تعداد مهمان</h4>
                    {(() => {
                      // محاسبه ظرفیت باقیمانده بر اساس تاریخ انتخابی
                      let maxCapacity = bus.vehicle?.capacity || 8;
                      
                      if (selectedDate) {
                        if (availableDates && availableDates.length > 0) {
                          const dateObj = availableDates.find(
                            (d) => new Date(d.date).toDateString() === selectedDate.toDateString()
                          );
                          if (dateObj && dateObj.remainingCapacity !== undefined && dateObj.remainingCapacity !== null) {
                            maxCapacity = dateObj.remainingCapacity;
                          }
                        }
                      }
                      
                      // حداکثر تعداد بزرگسال با توجه به کودکان انتخاب شده
                      const maxAdults = Math.max(1, maxCapacity - guests.children);
                      // حداکثر تعداد کودک با توجه به بزرگسالان انتخاب شده
                      const maxChildren = Math.max(0, maxCapacity - guests.adults);
                      
                      return (
                        <>
                          <div className="text-sm text-muted-foreground mb-2">
                            ظرفیت موجود: {maxCapacity} نفر
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-muted-foreground">بزرگسال</label>
                              <Select 
                                value={guests.adults.toString()} 
                                onValueChange={(value) => {
                                  const newAdults = parseInt(value);
                                  // اگر مجموع از ظرفیت بیشتر شد، کودکان را کاهش بده
                                  const newChildren = Math.min(guests.children, maxCapacity - newAdults);
                                  setGuests({ adults: newAdults, children: Math.max(0, newChildren) });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: maxAdults }, (_, i) => i + 1).map(num => (
                                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">کودک</label>
                              <Select 
                                value={guests.children.toString()} 
                                onValueChange={(value) => {
                                  const newChildren = parseInt(value);
                                  // اگر مجموع از ظرفیت بیشتر شد، بزرگسالان را کاهش بده
                                  const newAdults = Math.min(guests.adults, maxCapacity - newChildren);
                                  setGuests({ adults: Math.max(1, newAdults), children: newChildren });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: maxChildren + 1 }, (_, i) => i).map(num => (
                                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* پذیرش قوانین و مقررات */}
              {!isOwner && isLoggedin && (
                <div className="flex items-start space-x-3 space-x-reverse p-4 border rounded-lg bg-muted/30">
                  <Checkbox
                    id="acceptTermsBusReserve"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked)}
                  />
                  <label htmlFor="acceptTermsBusReserve" className="text-sm leading-relaxed cursor-pointer">
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
                onClick={async () => {
                  if (isOwner) {
                    toast.error("شما نمی‌توانید اتوبوس خودتان را رزرو کنید");
                  } else if (!isLoggedin) {
                    toast.error("برای رزرو باید وارد حساب کاربری خود شوید");
                    router.push("/auth");
                  } else if (!acceptedTerms) {
                    toast.error("لطفاً ابتدا قوانین و مقررات را مطالعه و تایید کنید");
                  } else if (!selectedDate) {
                    toast.error("لطفاً تاریخ سفر را انتخاب کنید");
                  } else {
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);

                    if (selectedDate < now) {
                      toast.error("تاریخ انتخابی گذشته است");
                    } else {
                      // بررسی اینکه تاریخ انتخابی مجاز باشد
                      const dateStr = selectedDate.toDateString();
                      const totalGuests = guests.adults + guests.children;
                      const busCapacity = bus.vehicle?.capacity || 0;

                      // اگر availableDates دارد، از آن استفاده کن
                      if (availableDates && availableDates.length > 0) {
                        const availableDate = availableDates.find(d =>
                          new Date(d.date).toDateString() === dateStr
                        );

                        if (!availableDate) {
                          toast.error("این تاریخ برای رزرو در دسترس نیست");
                          return;
                        }

                        if (availableDate.isReserved) {
                          toast.error("این تاریخ قبلاً رزرو شده است");
                          return;
                        }

                        // بررسی ظرفیت باقیمانده
                        const remainingCapacity = availableDate.remainingCapacity ?? busCapacity;
                        if (totalGuests > remainingCapacity) {
                          toast.error(`ظرفیت باقیمانده اتوبوس ${remainingCapacity} نفر است. تعداد مهمان انتخابی بیش از ظرفیت موجود است.`);
                          return;
                        }
                      } else {
                        // اگر availableDates خالی است، فقط تاریخ اصلی اتوبوس مجاز است
                        const busMainDate = new Date(bus.date);
                        busMainDate.setHours(0, 0, 0, 0);

                        if (selectedDate.toDateString() !== busMainDate.toDateString()) {
                          toast.error("این تاریخ برای رزرو در دسترس نیست");
                          return;
                        }

                        if (bus.isReserved) {
                          toast.error("این تاریخ قبلاً رزرو شده است");
                          return;
                        }

                        // بررسی ظرفیت کل اتوبوس
                        if (totalGuests > busCapacity) {
                          toast.error(`ظرفیت اتوبوس ${busCapacity} نفر است. تعداد مهمان انتخابی بیش از ظرفیت موجود است.`);
                          return;
                        }
                      }

                      // محاسبه مبلغ قابل پرداخت (قیمت پایه + کارمزد 6% + مالیات 10%)
                      const basePrice = bus.price * totalGuests;
                      const commissionAmount = Math.round((basePrice * 6) / 100);
                      const totalPrice = basePrice + commissionAmount;
                      const taxAmount = Math.round((totalPrice * 10) / 100);
                      const finalPayable = totalPrice + taxAmount;
                      setPayableAmount(finalPayable);
                      setShowPaymentDialog(true);
                    }
                  }
                }}
                disabled={isOwner || !isLoggedin || !selectedDate || !acceptedTerms}
                className="w-full"
                size="lg"
              >
                {isOwner
                  ? "شما مالک این اتوبوس هستید"
                  : !isLoggedin
                  ? "ورود برای رزرو"
                  : !selectedDate
                  ? "انتخاب تاریخ سفر"
                  : "رزرو"}
              </Button>

              {/* Payment Method Dialog */}
              <PaymentMethodDialog
                open={showPaymentDialog}
                onOpenChange={setShowPaymentDialog}
                amount={payableAmount}
                walletBalance={walletBalance}
                onSelectWallet={async () => {
                  setIsPaymentLoading(true);
                  setShowPaymentDialog(false);
                  toast.loading("در حال پردازش پرداخت از کیف پول...");
                  try {
                    const response = await axios.post("/api/payment/create", {
                      busId: bus._id,
                      busDate: selectedDate.toISOString(),
                      guests,
                      description: `رزرو اتوبوس ${bus.vehicle?.name || ""}`,
                      useWallet: true,
                      paymentMethod: "wallet",
                    });
                    toast.dismiss();
                    if (response.data.success && response.data.paidByWallet) {
                      toast.success("پرداخت با کیف پول انجام شد");
                      const params = new URLSearchParams({
                        paymentId: response.data.paymentId,
                        amount: response.data.amount?.toString() || "",
                        ref_id: response.data.data?.trackingCode || "WALLET",
                      });
                      router.push(`/payment/success?${params.toString()}`);
                    } else {
                      toast.error(response.data.message || "موجودی کیف پول کافی نیست");
                    }
                  } catch (error) {
                    toast.dismiss();
                    toast.error(error.response?.data?.message || "خطا در پرداخت");
                  } finally {
                    setIsPaymentLoading(false);
                  }
                }}
                onSelectOnline={async () => {
                  setIsPaymentLoading(true);
                  setShowPaymentDialog(false);
                  toast.loading("در حال انتقال به درگاه پرداخت...");
                  try {
                    const response = await axios.post("/api/payment/create", {
                      busId: bus._id,
                      busDate: selectedDate.toISOString(),
                      guests,
                      description: `رزرو اتوبوس ${bus.vehicle?.name || ""}`,
                      useWallet: false,
                      paymentMethod: "online",
                    });
                    toast.dismiss();
                    if (response.data.success && response.data.data?.paymentUrl) {
                      window.location.href = response.data.data.paymentUrl;
                    } else {
                      toast.error(response.data.message || "خطا در ایجاد درخواست پرداخت");
                    }
                  } catch (error) {
                    toast.dismiss();
                    toast.error(error.response?.data?.message || "خطا در ایجاد درخواست پرداخت");
                  } finally {
                    setIsPaymentLoading(false);
                  }
                }}
                isLoading={isPaymentLoading}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-start">اطلاعات راننده</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="text-muted-foreground">نام:</div>
                {bus.owner?.fullName ? (
                  <div className="font-medium">{bus.owner.fullName}</div>
                ) : (
                  <div className="text-muted-foreground">پس از رزرو نمایش داده می‌شود</div>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="text-muted-foreground">شماره تماس:</div>
                {bus.owner?.number ? (
                  <div className="font-medium">{bus.owner.number}</div>
                ) : (
                  <div className="text-muted-foreground">پس از رزرو نمایش داده می‌شود</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>نظرات کاربران</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoggedin ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
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
            <div className="text-center space-y-3">
              <p className="text-muted-foreground text-sm">
                برای ثبت نظر باید وارد حساب کاربری خود شوید
              </p>
              <Button variant="outline" asChild>
                <Link href="/auth">ورود به حساب کاربری</Link>
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {bus?.comments?.filter(c => c.isApproved)?.map((comment, index) => (
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Bus;
