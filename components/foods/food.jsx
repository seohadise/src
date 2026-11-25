"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import axios from "axios";

const Location = dynamic(() => import("../../components/global/location"), {
  ssr: false,
});

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

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

import { toast } from "sonner";
import { useEffect } from "react";
import { PaymentMethodDialog } from "@/components/payment/payment-method-dialog";

const Food = ({ food, isLoggedin, isOwner, name, hasConfirmedReservation }) => {
  const router = useRouter();

  const [selectedImage, setSelectedImage] = useState(food?.images[0]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [quantity, setQuantity] = useState(food?.pricing?.minimumOrder || 1);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  
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

  const form = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      name: name || "",
      text: "",
      rating: 5,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values) => createComment(values, "food"),
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
      itemId: food._id,
      ...values,
    });
  };

  const handleReply = async () => {
    setIsReplying(true);

    const res = await createCommentReply(
      { replyText, itemId: food?._id, commentId: replyingTo },
      "food"
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
    <div className="container mx-auto p-3 md:p-5 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="relative aspect-video rounded-lg overflow-hidden">
            <Image
              src={selectedImage}
              alt="Food Image"
              fill
              className="object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {food?.images.map((image, index) => (
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
                  alt={`Food Image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              آشپزخانه {food?.staff?.chef?.name}
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                ظرفیت روزانه: {food.dailyCapacity} پرس
              </Badge>
              <Badge variant="outline">
                حداقل سفارش: {food.pricing.minimumOrder} پرس
              </Badge>
            </div>
          </div>

          <Card>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold mb-2">
                  غذاهایی که میتونیم بپزیم:
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {food?.foods.map((item, index) => (
                    <div
                      key={index}
                      className="text-sm p-2 bg-muted rounded-lg"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold mb-2">آدرس</h3>
                <div className="flex items-center gap-2 text-sm">
                  <div className="text-muted-foreground">استان:</div>
                  <div>{food.address.province}</div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="text-muted-foreground">شهر:</div>
                  <div>{food.address.city}</div>
                </div>
                {(isOwner || hasConfirmedReservation) ? (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="text-muted-foreground">آدرس دقیق:</div>
                    <Location
                      defaultPosition={food?.address?.location}
                      readOnly
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="text-muted-foreground">آدرس دقیق:</div>
                    <div className="text-orange-600 text-xs">آدرس دقیق پس از رزرو نمایش داده می‌شود</div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold mb-2">کادر آشپزخانه</h3>
                <div className="flex items-center gap-2 text-sm">
                  <div className="text-muted-foreground">سرآشپز:</div>
                  <div>{food.staff.chef.name}</div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="text-muted-foreground">آشپزها:</div>
                  <div>
                    {food.staff.cooks.map((cook) => cook.name).join(" - ")}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold mb-2">تعداد سفارش</h3>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(food.pricing?.minimumOrder || 1, quantity - 1))}
                    disabled={quantity <= (food.pricing?.minimumOrder || 1)}
                  >
                    -
                  </Button>
                  <span className="text-lg font-bold min-w-[3rem] text-center">{quantity} پرس</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.min(food.dailyCapacity || 100, quantity + 1))}
                    disabled={quantity >= (food.dailyCapacity || 100)}
                  >
                    +
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  حداقل سفارش: {food.pricing?.minimumOrder || 1} پرس | حداکثر: {food.dailyCapacity || 100} پرس
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold mb-2">قیمت</h3>
                {(() => {
                  const basePrice = food.pricing.basePrice;
                  const datesCount = selectedDates.length || 1;
                  const totalBasePrice = basePrice * quantity * datesCount;
                  const commissionRate = 6;
                  const commissionAmount = Math.round((totalBasePrice * commissionRate) / 100);
                  const totalPrice = totalBasePrice + commissionAmount;
                  const taxRate = 10;
                  const taxAmount = Math.round((totalPrice * taxRate) / 100);
                  const finalPayable = totalPrice + taxAmount;
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>قیمت پایه (هر پرس)</span>
                        <span>{basePrice.toLocaleString("fa-IR")} تومان</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>تعداد پرس</span>
                        <span>{quantity} پرس</span>
                      </div>
                      {datesCount > 1 && (
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>تعداد روز</span>
                          <span>{datesCount} روز</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm border-t pt-2">
                        <span>جمع قیمت پایه</span>
                        <span>{totalBasePrice.toLocaleString("fa-IR")} تومان</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>کارمزد سرویس ({commissionRate}%)</span>
                        <span>{commissionAmount.toLocaleString("fa-IR")} تومان</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>مالیات ({taxRate}%)</span>
                        <span>{taxAmount.toLocaleString("fa-IR")} تومان</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>قیمت نهایی</span>
                        <span className="text-primary">{finalPayable.toLocaleString("fa-IR")} تومان</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* تاریخ‌های موجود */}
              {food?.availableDates && food.availableDates.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold mb-2">تاریخ‌های موجود برای سفارش</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {food.availableDates
                      .filter(dateObj => {
                        const date = new Date(dateObj.date);
                        const now = new Date();
                        now.setHours(0, 0, 0, 0);
                        return date >= now;
                      })
                      .map((dateObj, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            // بررسی اینکه آیا تاریخ قابل انتخاب است
                            const hasCapacity = dateObj.remainingCapacity !== undefined && dateObj.remainingCapacity !== null 
                              ? dateObj.remainingCapacity > 0 
                              : !dateObj.isReserved;
                            
                            if (hasCapacity && !isOwner && isLoggedin) {
                              setSelectedDates((prev) =>
                                prev.includes(dateObj.date)
                                  ? prev.filter((d) => d !== dateObj.date)
                                  : [...prev, dateObj.date]
                              );
                            }
                          }}
                          className={`p-2 rounded-lg text-center border text-sm transition-colors ${
                            !(() => {
                              const hasCapacity = dateObj.remainingCapacity !== undefined && dateObj.remainingCapacity !== null 
                                ? dateObj.remainingCapacity > 0 
                                : !dateObj.isReserved;
                              return hasCapacity;
                            })()
                              ? "bg-muted text-muted-foreground cursor-not-allowed"
                              : selectedDates.includes(dateObj.date)
                              ? "bg-primary text-primary-foreground cursor-pointer"
                              : isOwner || !isLoggedin
                              ? "bg-primary/10 cursor-not-allowed"
                              : "bg-primary/10 hover:bg-primary/20 cursor-pointer"
                          }`}
                        >
                          <p className="text-xs">
                            {new Date(dateObj.date).toLocaleDateString("fa-IR", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-xs mt-1">
                            {(() => {
                              const hasCapacity = dateObj.remainingCapacity !== undefined && dateObj.remainingCapacity !== null 
                                ? dateObj.remainingCapacity > 0 
                                : !dateObj.isReserved;
                              return hasCapacity ? "آزاد" : "رزرو شده";
                            })()}
                          </p>
                        </div>
                      ))}
                  </div>
                  {selectedDates.length > 0 && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>تعداد روزهای انتخاب شده: {selectedDates.length} روز</p>
                      {selectedDates.length === 1 ? (
                        <p>تاریخ انتخابی: {new Date(selectedDates[0]).toLocaleDateString("fa-IR")}</p>
                      ) : (
                        <div>
                          <p>تاریخ‌های انتخابی:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedDates
                              .sort((a, b) => new Date(a) - new Date(b))
                              .map((date, index) => (
                                <span key={index} className="text-xs bg-primary/10 px-2 py-1 rounded">
                                  {new Date(date).toLocaleDateString("fa-IR", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* پذیرش قوانین و مقررات */}
              {!isOwner && isLoggedin && (
                <div className="flex items-start space-x-3 space-x-reverse p-4 border rounded-lg bg-muted/30">
                  <Checkbox
                    id="acceptTermsFoodReserve"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked)}
                  />
                  <label htmlFor="acceptTermsFoodReserve" className="text-sm leading-relaxed cursor-pointer">
                    <Link href="/dashboard/user/rules" target="_blank" className="text-primary font-bold underline">
                      قوانین و مقررات تریپ‌گود
                    </Link>
                    {" "}را مطالعه کرده‌ام و با تمامی موارد آن موافقم.
                  </label>
                </div>
              )}
              {!isOwner && isLoggedin && !acceptedTerms && (
                <p className="text-sm text-destructive">
                  پذیرش قوانین و مقررات برای سفارش الزامی است.
                </p>
              )}

              <Button
                onClick={() => {
                  if (isOwner) {
                    toast.error("شما نمی‌توانید غذای خودتان را سفارش دهید");
                  } else if (!isLoggedin) {
                    toast.error("برای سفارش باید وارد حساب کاربری خود شوید");
                    router.push("/auth");
                  } else if (!acceptedTerms) {
                    toast.error("لطفاً ابتدا قوانین و مقررات را مطالعه و تایید کنید");
                  } else if (food?.availableDates && food.availableDates.length > 0 && selectedDates.length === 0) {
                    toast.error("لطفا حداقل یک تاریخ برای سفارش انتخاب کنید");
                  } else {
                    // Calculate payable amount (base price + 6% commission + 10% tax)
                    const basePrice = food.pricing?.basePrice || 0;
                    const datesCount = selectedDates.length || 1;
                    const totalBasePrice = basePrice * quantity * datesCount;
                    const commissionAmount = Math.round((totalBasePrice * 6) / 100);
                    const priceWithCommission = totalBasePrice + commissionAmount;
                    const taxAmount = Math.round((priceWithCommission * 10) / 100);
                    const finalPayable = priceWithCommission + taxAmount;
                    setPayableAmount(finalPayable);
                    setShowPaymentDialog(true);
                  }
                }}
                disabled={isOwner || !isLoggedin || !acceptedTerms}
                className="w-full"
                size="lg"
              >
                {isOwner ? "شما مالک این غذا هستید" : `سفارش ${quantity} پرس`}
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
                      foodId: food._id,
                      foodDates: selectedDates,
                      quantity: quantity,
                      description: `سفارش ${quantity} پرس غذا ${food.name || ""}`,
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
                      foodId: food._id,
                      foodDates: selectedDates,
                      quantity: quantity,
                      description: `سفارش ${quantity} پرس غذا ${food.name || ""}`,
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
              <CardTitle className="text-start">اطلاعات تماس</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="text-muted-foreground">شماره تماس:</div>
                {food.owner?.number ? (
                  <div className="font-medium">{food.owner.number}</div>
                ) : (
                  <div className="text-muted-foreground">پس از رزرو نمایش داده می‌شود</div>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="text-muted-foreground">آدرس:</div>
                <div>{`${food.address.province} - ${food.address.city}`}</div>
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
            {food?.comments?.filter(c => c.isApproved)?.map((comment, index) => (
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

export default Food;
