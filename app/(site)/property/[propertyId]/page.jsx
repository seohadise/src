    "use client";

    import React, { useState, useEffect } from "react";
    import { useParams, useRouter } from "next/navigation";
    import { useForm } from "react-hook-form";
    import { zodResolver } from "@hookform/resolvers/zod";
    import { useMutation } from "@tanstack/react-query";
    import axios from "axios";
    import { toast } from "sonner";
    import Image from "next/image";

    import { commentSchema } from "@/schemas/comment";
    import { createComment } from "@/app/_actions";
    import ImageGallery from "@/components/global/image-gallery";
    import VisitTracker from "@/components/global/visit-tracker";
    import PropertyCard from "@/components/global/property-card";
    import dynamic from "next/dynamic";

    const PanoramaViewer = dynamic(() => import("@/components/global/panorama-viewer"), {
      ssr: false,
      loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ),
    });

    const ReadOnlyMap = dynamic(() => import("@/components/global/read-only-map"), {
      ssr: false,
      loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ),
    });

    import { Button } from "@/components/ui/button";
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
    import { Badge } from "@/components/ui/badge";
    import { Checkbox } from "@/components/ui/checkbox";
    import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
    import { Input } from "@/components/ui/input";
    import { Textarea } from "@/components/ui/textarea";
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
    import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
    import { Calendar as CalendarComponent } from "@/components/ui/calendar";
    import { MapPin, Home, Users, Calendar, Clock, Car, Thermometer, Snowflake, Star, MessageSquare, CalendarIcon, Layers, Building, Shield, FileText, Map, Bed, Sofa, UserCheck, Ban } from "lucide-react";
    import { cn } from "@/lib/utils";
    import isIranianHoliday from "@/lib/iran-holidays";
    import { PaymentMethodDialog } from "@/components/payment/payment-method-dialog";
    import BookingCalendar from "@/components/properties/booking-calendar";

// تابع تبدیل تاریخ میلادی به شمسی
const formatPersianDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fa-IR");
};

// تبدیل Date به رشته YYYY-MM-DD (بدون مشکل منطقه زمانی)
const toDateStr = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Lazy-loaded map component using Intersection Observer
const LazyMap = ({ lat, lng }) => {
  const mapRef = React.useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    if (mapRef.current) {
      observer.observe(mapRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">موقعیت جغرافیایی</h2>
      <div ref={mapRef} className="aspect-video rounded-lg overflow-hidden bg-muted">
        {isVisible ? (
          <ReadOnlyMap lat={lat} lng={lng} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Map className="w-10 h-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">در حال بارگذاری نقشه...</p>
            </div>
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground mt-2 text-center">
        موقعیت دقیق پس از رزرو نمایش داده می‌شود
      </p>
    </Card>
  );
};

const ReservationButton = ({ property, user, checkInDate, setCheckInDate, checkOutDate, setCheckOutDate }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [guests, setGuests] = useState({ adults: 1, children: 0 });
  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [payableAmount, setPayableAmount] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (!checkOutDate) setAvailability(null);
  }, [checkInDate, checkOutDate]);

  // بررسی اینکه آیا یک تاریخ در بازه رزروهای قبلی قرار دارد یا خیر
  const isDateInReservedRange = (date) => {
    if (!property.reservedDateRanges || property.reservedDateRanges.length === 0) return false;
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    for (const range of property.reservedDateRanges) {
      const start = new Date(range.checkInDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(range.checkOutDate);
      end.setHours(0, 0, 0, 0);
      // تاریخ ورود رزرو شده در بازه است (شامل ورود، بدون خروج)
      if (checkDate >= start && checkDate < end) return true;
    }
    return false;
  };

  // بررسی اینکه آیا بین تاریخ ورود و خروج، روز رزرو شده‌ای وجود دارد
  const hasReservedDateInRange = (startDate, endDate) => {
    if (!property.reservedDateRanges || property.reservedDateRanges.length === 0) return false;
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    while (current < end) {
      if (isDateInReservedRange(current)) return true;
      current.setDate(current.getDate() + 1);
    }
    return false;
  };

  // دریافت موجودی کیف پول
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (user) {
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
  }, [user]);

      // محاسبه تعداد شب‌ها
      const calculateNights = () => {
        if (!checkInDate || !checkOutDate) return 0;
        const diffTime = Math.abs(checkOutDate - checkInDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
      };

      // بررسی در دسترس بودن تاریخ‌ها
      const checkAvailability = async () => {
        if (!checkInDate || !checkOutDate) {
          setAvailability(null);
          return;
        }

        setCheckingAvailability(true);
        try {
          const response = await axios.post(`/api/property/${property._id}/availability`, {
            checkInDate: toDateStr(checkInDate),
            checkOutDate: toDateStr(checkOutDate),
          });

          setAvailability(response.data);
          if (!response.data.success) {
            toast.error(response.data.message);
          }
        } catch (error) {
          console.error("Error checking availability:", error);
          setAvailability({ success: false, message: "خطا در بررسی در دسترس بودن" });
        } finally {
          setCheckingAvailability(false);
        }
      };

      // بررسی در دسترس بودن هنگام تغییر تاریخ‌ها
      React.useEffect(() => {
        if (checkInDate && checkOutDate) {
          const timeoutId = setTimeout(() => {
            checkAvailability();
          }, 500); // debounce برای جلوگیری از درخواست‌های زیاد

          return () => clearTimeout(timeoutId);
        }
      }, [checkInDate, checkOutDate]);

      // بررسی تداخل تاریخ‌ها با تنظیمات تقویم ملک
      const checkDateConflict = () => {
        if (!checkInDate || !checkOutDate) return false;

        // بررسی بازه موجود بودن ملک
        if (property.availabilityStartDate && property.availabilityEndDate) {
          const availStart = new Date(property.availabilityStartDate);
          availStart.setHours(0, 0, 0, 0);
          const availEnd = new Date(property.availabilityEndDate);
          availEnd.setHours(0, 0, 0, 0);
          const checkIn = new Date(checkInDate);
          checkIn.setHours(0, 0, 0, 0);
          const checkOut = new Date(checkOutDate);
          checkOut.setHours(0, 0, 0, 0);
          if (checkIn < availStart || checkOut > availEnd) return true;
        }

        const currentDate = new Date(checkInDate);
        while (currentDate < checkOutDate) {
          // اگر تاریخ در calendarSettings بلاک شده باشد
          if (property.calendarSettings && property.calendarSettings.length > 0) {
            const dateObj = property.calendarSettings.find(
              (d) => new Date(d.date).toDateString() === currentDate.toDateString()
            );
            if (dateObj && (dateObj.blocked || dateObj.available === false)) {
              return true;
            }
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // بررسی تداخل با رزروهای قبلی
        if (hasReservedDateInRange(checkInDate, checkOutDate)) return true;

        return false;
      };

      const handleReserve = async () => {
        // بررسی اینکه آیا کاربر مالک این ملک است
        if (user && property.owner && user._id === property.owner._id) {
          toast.error("شما نمی‌توانید ملک خودتان را رزرو کنید");
          return;
        }

        // بررسی پذیرش قوانین
        if (!acceptedTerms) {
          toast.error("لطفاً ابتدا قوانین و مقررات را مطالعه و تایید کنید");
          return;
        }

        // بررسی انتخاب تاریخ‌ها
        if (!checkInDate || !checkOutDate) {
          toast.error("لطفاً تاریخ ورود و خروج را انتخاب کنید");
          return;
        }

        if (checkInDate >= checkOutDate) {
          toast.error("تاریخ خروج باید بعد از تاریخ ورود باشد");
          return;
        }

        // بررسی تداخل تاریخ‌ها
        if (checkDateConflict()) {
          toast.error("برخی از تاریخ‌های انتخابی در دسترس نیستند یا قبلاً رزرو شده‌اند");
          return;
        }

        // محاسبه مبلغ قابل پرداخت (بیعانه از قیمت پایه + مالیات)
        const pricing = availability?.pricing || {};
        const nights = calculateNights();
        // قیمت کل بدون کارمزد - از API محاسبه شده
        const totalBasePrice = pricing.totalBasePrice || 0;
        const depositRate = pricing.depositRate || property.pricing?.deposit || 10;
        const depositAmount = pricing.depositAmount || (totalBasePrice > 0 ? Math.round((totalBasePrice * depositRate) / 100) : 0);
        const taxAmount = Math.round(depositAmount * 0.1); // مالیات 10%
        const amount = depositAmount + taxAmount;
        
        setPayableAmount(amount);
        setShowPaymentDialog(true);
      };

      // پرداخت با کیف پول
      const handleWalletPayment = async () => {
        setIsLoading(true);
        setShowPaymentDialog(false);
        toast.loading("در حال پردازش پرداخت از کیف پول...");
        try {
          const response = await axios.post("/api/payment/create", {
            propertyId: property._id,
            checkInDate: toDateStr(checkInDate),
            checkOutDate: toDateStr(checkOutDate),
            guests,
            description: `رزرو اقامتگاه: ${property.name}`,
            useWallet: true,
            paymentMethod: "wallet",
          });
          toast.dismiss();
          if (response.data.success) {
            const { paidByWallet, paymentId, amount, data } = response.data;

            if (paidByWallet) {
              toast.success("پرداخت با کیف پول انجام شد");
              const params = new URLSearchParams({
                paymentId: paymentId,
                amount: amount?.toString() || "",
                ref_id: data?.trackingCode || "WALLET",
              });
              router.push(`/payment/success?${params.toString()}`);
            } else {
              toast.error("موجودی کیف پول کافی نیست");
            }
          } else {
            toast.error(response.data.message || "خطا در پرداخت از کیف پول");
          }
        } catch (error) {
          toast.dismiss();
          const errorMessage = error.response?.data?.message || "خطای سرور. لطفاً دوباره تلاش کنید.";
          toast.error(errorMessage);
        } finally {
          setIsLoading(false);
        }
      };

      // پرداخت آنلاین
      const handleOnlinePayment = async () => {
        setIsLoading(true);
        setShowPaymentDialog(false);
        toast.loading("در حال انتقال به درگاه پرداخت...");
        try {
          const response = await axios.post("/api/payment/create", {
            propertyId: property._id,
            checkInDate: toDateStr(checkInDate),
            checkOutDate: toDateStr(checkOutDate),
            guests,
            description: `رزرو اقامتگاه: ${property.name}`,
            useWallet: false,
            paymentMethod: "online",
          });
          toast.dismiss();
          if (response.data.success) {
            const { data } = response.data;
            if (data?.paymentUrl) {
              window.location.href = data.paymentUrl;
            } else {
              toast.error("خطا در دریافت لینک پرداخت");
            }
          } else {
            toast.error(response.data.message || "خطا در ایجاد درخواست پرداخت");
          }
        } catch (error) {
          toast.dismiss();
          const errorMessage = error.response?.data?.message || "خطای سرور. لطفاً دوباره تلاش کنید.";
          if (errorMessage.includes("وارد شوید")) {
            toast.error("برای رزرو، ابتدا باید وارد حساب کاربری خود شوید.");
            router.push("/auth/login");
          } else {
            toast.error(errorMessage);
          }
        } finally {
          setIsLoading(false);
        }
      };

      const nights = calculateNights();

      // استفاده از قیمت‌گذاری از API availability اگر موجود باشد
      const pricing = availability?.pricing || {};
      // قیمت پایه (بدون کارمزد) - همان قیمتی که مالک وارد کرده
      const ownerBasePrice = property.pricing?.regularPrice || property.price || 0;
      const displayPricePerNight = pricing.basePricePerNight || ownerBasePrice;
      const totalDisplayPrice = pricing.totalBasePrice || (displayPricePerNight * nights);
      const nightlyBreakdown = pricing.nightlyBreakdown || null;
      
      // محاسبه بیعانه از قیمت پایه (بدون کارمزد)
      const depositRate = pricing.depositRate || property.pricing?.deposit || 10;
      const depositAmount = pricing.depositAmount || Math.round((totalDisplayPrice * depositRate) / 100);
      
      // محاسبه مالیات ۱۰% از بیعانه
      const taxRate = 10;
      const taxAmount = Math.round((depositAmount * taxRate) / 100);
      
      // مبلغ کل قابل پرداخت
      const totalPayable = depositAmount + taxAmount;

      return (
        <div className="space-y-4">
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">تاریخ ورود</span>
              <span className="font-medium">{checkInDate ? formatPersianDate(checkInDate) : "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">تاریخ خروج</span>
              <span className="font-medium">{checkOutDate ? formatPersianDate(checkOutDate) : "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                className="text-xs text-blue-600 hover:underline"
                onClick={() => document.getElementById("booking-calendar")?.scrollIntoView({ behavior: "smooth", block: "center" })}
              >
                {checkInDate ? "تغییر تاریخ‌ها در تقویم" : "انتخاب تاریخ از تقویم"}
              </button>
              {checkInDate && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:underline"
                  onClick={() => {
                    setCheckInDate(null);
                    setCheckOutDate(null);
                  }}
                >
                  پاک کردن
                </button>
              )}
            </div>
          </div>

          {/* انتخاب تعداد مهمان */}
          <div className="space-y-2">
            <label className="text-sm font-medium">تعداد مهمان</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">بزرگسال</label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={guests.adults}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setGuests(prev => ({ ...prev, adults: Math.max(1, Math.min(50, value)) }));
                  }}
                  className="text-center"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">کودک</label>
                <Input
                  type="number"
                  min="0"
                  max="20"
                  value={guests.children}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setGuests(prev => ({ ...prev, children: Math.max(0, Math.min(20, value)) }));
                  }}
                  className="text-center"
                />
              </div>
            </div>
          </div>

          {/* نمایش خلاصه قیمت */}
          {nights > 0 && (
            <div className={`space-y-2 p-3 rounded-lg ${
              checkingAvailability ? 'bg-yellow-50 border border-yellow-200' :
              availability?.success === false ? 'bg-red-50 border border-red-200' :
              availability?.success === true ? 'bg-green-50 border border-green-200' :
              'bg-muted'
            }`}>
              {checkingAvailability && (
                <div className="text-sm text-yellow-600 mb-2">
                  در حال بررسی در دسترس بودن...
                </div>
              )}

              {availability?.success === false && (
                <div className="text-sm text-red-600 mb-2">
                  {availability.message}
                  {availability.conflictingDates && (
                    <div className="mt-1">
                      تاریخ‌های رزرو شده: {availability.conflictingDates.join(', ')}
                    </div>
                  )}
                </div>
              )}

              {nightlyBreakdown && nightlyBreakdown.length > 0 ? (
                <div className="space-y-1">
                  {nightlyBreakdown.map((night, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{new Date(night.date).toLocaleDateString("fa-IR", { weekday: "long", month: "long", day: "numeric" })}</span>
                      <span>{night.price.toLocaleString("fa-IR")} تومان</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-between text-sm">
                  <span>{nights} شب × {displayPricePerNight.toLocaleString("fa-IR")} تومان</span>
                  <span>{totalDisplayPrice.toLocaleString("fa-IR")} تومان</span>
                </div>
              )}
              <div className="flex justify-between font-medium border-t pt-2">
                <span>مجموع کل</span>
                <span>{totalDisplayPrice.toLocaleString("fa-IR")} تومان</span>
              </div>
              
              {/* خلاصه پرداخت */}
              <div className="border-t pt-2 mt-2 space-y-1">
                <div className="text-sm font-medium text-primary">خلاصه پرداخت:</div>
                <div className="flex justify-between text-sm">
                  <span>بیعانه ({depositRate}%)</span>
                  <span>{depositAmount.toLocaleString("fa-IR")} تومان</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>مالیات ({taxRate}%)</span>
                  <span>{taxAmount.toLocaleString("fa-IR")} تومان</span>
                </div>
                <div className="flex justify-between font-bold text-primary border-t pt-1">
                  <span>مبلغ قابل پرداخت</span>
                  <span>{totalPayable.toLocaleString("fa-IR")} تومان</span>
                </div>
              </div>
            </div>
          )}

          {/* پذیرش قوانین و مقررات */}
          {user && !(user._id === property.owner?._id) && (
            <div className="flex items-start space-x-3 space-x-reverse p-4 border rounded-lg bg-muted/30">
              <Checkbox
                id="acceptTermsPropertyReserve"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked)}
              />
              <label htmlFor="acceptTermsPropertyReserve" className="text-sm leading-relaxed cursor-pointer">
                <a href="/dashboard/user/rules" target="_blank" className="text-primary font-bold underline">
                  قوانین و مقررات تریپ‌گود
                </a>
                {" "}را مطالعه کرده‌ام و با تمامی موارد آن موافقم.
              </label>
            </div>
          )}
          {user && !(user._id === property.owner?._id) && !acceptedTerms && (
            <p className="text-sm text-destructive">
              پذیرش قوانین و مقررات برای رزرو الزامی است.
            </p>
          )}

          <Button
            onClick={handleReserve}
            disabled={
              isLoading ||
              checkingAvailability ||
              (user && property.owner && user._id === property.owner._id) ||
              !checkInDate ||
              !checkOutDate ||
              !acceptedTerms ||
              availability?.success === false
            }
            className="w-full text-lg py-6"
          >
            {user && property.owner && user._id === property.owner._id ? (
              "شما مالک این ملک هستید"
            ) : isLoading ? (
              "در حال پردازش..."
            ) : checkingAvailability ? (
              "در حال بررسی..."
            ) : !checkInDate || !checkOutDate ? (
              "لطفاً تاریخ‌های ورود و خروج را انتخاب کنید"
            ) : availability?.success === false ? (
              "تاریخ‌های انتخابی در دسترس نیستند"
            ) : nights > 0 ? (
              `پرداخت (${totalPayable.toLocaleString("fa-IR")} تومان)`
            ) : (
              "انتخاب تاریخ"
            )}
          </Button>

          {/* دیالوگ انتخاب روش پرداخت */}
          <PaymentMethodDialog
            open={showPaymentDialog}
            onOpenChange={setShowPaymentDialog}
            amount={payableAmount}
            walletBalance={walletBalance}
            onSelectWallet={handleWalletPayment}
            onSelectOnline={handleOnlinePayment}
            isLoading={isLoading}
          />
        </div>
      );
    };

    const PropertyDetailsPage = () => {
      // اینجا از propertyId استفاده می‌کنیم
      const { propertyId } = useParams();
      const router = useRouter();
      const [property, setProperty] = useState(null);
      const [user, setUser] = useState(null);
      const [loading, setLoading] = useState(true);
      const [galleryOpen, setGalleryOpen] = useState(false);
      const [galleryIndex, setGalleryIndex] = useState(0);
      const [similarProperties, setSimilarProperties] = useState([]);
      const [checkInDate, setCheckInDate] = useState(null);
      const [checkOutDate, setCheckOutDate] = useState(null);

      const openGallery = (index) => {
        setGalleryIndex(index);
        setGalleryOpen(true);
      };

      // فرم نظرات
      const form = useForm({
        resolver: zodResolver(commentSchema),
        defaultValues: {
          name: "",
          text: "",
          rating: 5,
        },
      });

      // بروزرسانی نام در فرم وقتی کاربر لود شد
      useEffect(() => {
        if (user && user.fullName) {
          form.setValue("name", user.fullName);
        }
      }, [user, form]);

      const { mutate: submitComment, isPending: isSubmittingComment } = useMutation({
        mutationFn: (values) => createComment(values, "property"),
        onSuccess: (data) => {
          if (data.success) {
            form.reset();
            toast.success(data.message);
            // بروزرسانی اطلاعات ملک
            if (propertyId) {
              fetchProperty();
            }
          } else {
            toast.error(data.message);
          }
        },
        onError: () => {
          toast.error("خطا در ثبت نظر");
        },
      });

      const onSubmitComment = (values) => {
        submitComment({
          itemId: propertyId,
          ...values,
        });
      };

      const fetchProperty = async () => {
        setLoading(true);
        try {
          // از propertyId در آدرس API استفاده می‌کنیم
          const response = await axios.get(`/api/property/${propertyId}`);
          setProperty(response.data.data);

          // دریافت اقامتگاه‌های مشابه
          const propData = response.data.data;
          fetchSimilarProperties(propData);

          // دریافت اطلاعات کاربر جاری
          try {
            const userResponse = await axios.get('/api/me');
            setUser(userResponse.data);
          } catch (userError) {
            // کاربر لاگین نکرده است
            setUser(null);
          }
        } catch (error) {
          console.error("Failed to fetch property", error);
          toast.error("خطا در دریافت اطلاعات ملک");
        } finally {
          setLoading(false);
        }
      };

      const fetchSimilarProperties = async (prop) => {
        try {
          const params = new URLSearchParams();
          params.append('type', prop.type || 'villa');
          if (prop.address?.city) params.append('city', prop.address.city);
          if (prop.address?.province) params.append('province', prop.address.province);
          params.append('limit', '4');
          params.append('exclude', prop._id);

          console.log('Fetching similar properties with params:', params.toString());
          const response = await axios.get(`/api/property/similar?${params}`);
          console.log('Similar properties response:', response.data);
          setSimilarProperties(response.data.data || []);
        } catch (error) {
          console.error("Failed to fetch similar properties", error);
        }
      };

      useEffect(() => {
        // اگر propertyId وجود داشت، اطلاعات را از سرور بگیر
        if (propertyId) {
          fetchProperty();
        }
      }, [propertyId]); // هر وقت propertyId تغییر کرد، این کد دوباره اجرا شود

      if (loading) {
        return <div className="text-center p-10 text-xl font-bold">در حال بارگذاری...</div>;
      }

      if (!property) {
        return <div className="text-center p-10 text-xl font-bold">ملک مورد نظر یافت نشد.</div>;
      }

      // تابع برای ترجمه انواع ملک
      const getPropertyTypeLabel = (type) => {
        const types = {
          villa: "ویلا",
          apartment: "آپارتمان",
          garden: "باغ"
        };
        return types[type] || type;
      };

      // تابع برای ترجمه وضعیت ملک
      const getConditionLabel = (condition) => {
        const conditions = {
          new: "نوساز",
          old: "قدیمی",
          renovated: "بازسازی شده"
        };
        return conditions[condition] || condition;
      };

      // تابع برای ترجمه محیط
      const getEnvironmentLabel = (environment) => {
        const environments = {
          "city-center": "مرکز شهر",
          forest: "جنگلی",
          coastal: "ساحلی",
          desert: "کویری",
          historical: "تاریخی",
          rural: "روستایی"
        };
        return environments[environment] || environment;
      };

      return (
        <div className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
          <VisitTracker pageType="property" itemId={property._id} itemType="Property" />
          <div className="md:col-span-2 space-y-6">
            {/* گالری تصاویر */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {property?.images?.map((image, index) => (
                <div
                  key={index}
                  onClick={() => openGallery(index)}
                  className={`relative rounded-lg overflow-hidden cursor-pointer ${
                    index === 0 ? "md:col-span-2 lg:col-span-2 h-64" : "h-32"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${property.name} - تصویر ${index + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                  {index === 0 && property.images.length > 1 && (
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                      {property.images.length.toLocaleString("fa-IR")} تصویر
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Image Gallery Modal */}
            <ImageGallery
              images={property?.images || []}
              initialIndex={galleryIndex}
              isOpen={galleryOpen}
              onClose={() => setGalleryOpen(false)}
              title={property?.name}
            />

            {/* تصاویر 360 درجه */}
            {property?.images360 && property.images360.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">تصاویر 360 درجه</h2>
                <div className="space-y-4">
                  {property.images360.map((image, index) => (
                    <div
                      key={index}
                      className="relative rounded-lg overflow-hidden bg-muted"
                      style={{ height: "400px" }}
                    >
                      <PanoramaViewer
                        src={image}
                        alt={`${property.name} - تصویر 360 درجه ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* اطلاعات اصلی */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{property.name}</h1>
                  {property.propertyCode && (
                    <span className="text-sm text-muted-foreground mt-1 block">کد ملک: {property.propertyCode}</span>
                  )}
                </div>
                {/* امتیاز کلی */}
                {property.comments && property.comments.length > 0 && (
                  <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-lg">
                      {(property.comments.reduce((sum, c) => sum + c.rating, 0) / property.comments.length).toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">({property.comments.length} نظر)</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>
                  استان {property.address?.province} - شهر {property.address?.city}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary">{getPropertyTypeLabel(property.type)}</Badge>
                <Badge variant="outline">{getConditionLabel(property.condition)}</Badge>
                <Badge variant="outline">{getEnvironmentLabel(property.environment)}</Badge>
                {property.ownerShipType && (
                  <Badge variant="outline" className="bg-blue-50">
                    {property.ownerShipType === "public" ? "دربست" : "غیر دربست"}
                  </Badge>
                )}
              </div>
            </div>

            {/* مشخصات کلی */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">مشخصات کلی</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">متراژ</p>
                    <p className="font-semibold">{property.area} متر</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">ظرفیت</p>
                    <p className="font-semibold">{property.capacity} نفر</p>
                    {property.maxCapacity && property.maxCapacity > property.capacity && (
                      <p className="text-xs text-muted-foreground">(حداکثر {property.maxCapacity} نفر)</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">سال ساخت</p>
                    <p className="font-semibold">{property.yearBuilt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">پارکینگ</p>
                    <p className="font-semibold">{property.parkingAmount} خودرو</p>
                  </div>
                </div>
                {property.floor !== undefined && property.floor !== null && (
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">طبقه</p>
                      <p className="font-semibold">{property.floor === 0 ? "همکف" : property.floor}</p>
                    </div>
                  </div>
                )}
                {property.floorType && (
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">نوع کف</p>
                      <p className="font-semibold">
                        {(() => {
                          const floorTypes = {
                            carpet: "موکت",
                            earthenware: "سرامیک",
                            stone: "سنگ",
                            other: "سایر"
                          };
                          return floorTypes[property.floorType] || property.floorType;
                        })()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* ساعات ورود و خروج */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">ساعات ورود و خروج</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">ساعت ورود</p>
                    <p className="font-semibold">{property.checkInTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">ساعت خروج</p>
                    <p className="font-semibold">{property.checkOutTime}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* توضیحات */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">توضیحات</h2>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                {property.description}
              </p>
            </Card>

            {/* قوانین */}
            {(property.rules || property.propertyRules) && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">قوانین اقامتگاه</h2>
                
                {/* قوانین چک‌باکسی */}
                {property.propertyRules && (
                  <div className="mb-4 space-y-2">
                    <p className="text-sm font-medium mb-3">میهمانان باید قبل از ورود اقامتگاه شما با قوانین شما موافق باشند</p>
                    {property.propertyRules.smokingAllowed && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-red-500">✗</span>
                        <span>استعمال دخانیات مجاز نیست</span>
                      </div>
                    )}
                    {property.propertyRules.petsAllowed && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-red-500">✗</span>
                        <span>امکان برگزاری جشن وجود ندارد</span>
                      </div>
                    )}
                    {property.propertyRules.partyAllowed && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-red-500">✗</span>
                        <span>ورود حیوانات خانگی مجاز نیست</span>
                      </div>
                    )}
                    {property.propertyRules.singleGuestAllowed && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-red-500">✗</span>
                        <span>اقامت به افراد مجرد داده نمی‌شود</span>
                      </div>
                    )}
                    {property.propertyRules.privacyDocumentRequired && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-red-500">✗</span>
                        <span>ارائه مدرک محرمیت برای زوجین لازم است</span>
                      </div>
                    )}
                  </div>
                )}

                {/* قوانین متنی */}
                {property.rules && (
                  <div className={property.propertyRules ? "border-t pt-4" : ""}>
                    <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                      {property.rules}
                    </p>
                  </div>
                )}
              </Card>
            )}

            {/* سیاست کنسلی و قوانین رزرو */}
            {(property.cancellationPolicy || property.reservationRules) && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">سیاست کنسلی و رزرو</h2>
                <div className="space-y-4">
                  {property.cancellationPolicy && (
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-semibold">سیاست کنسلی</p>
                        <p className="text-sm text-muted-foreground">
                          {(() => {
                            const policies = {
                              easy: "آسان - امکان لغو تا 24 ساعت قبل از ورود",
                              balanced: "متعادل - امکان لغو تا 5 روز قبل از ورود",
                              strict: "سخت‌گیرانه - امکان لغو تا 14 روز قبل از ورود"
                            };
                            return policies[property.cancellationPolicy] || property.cancellationPolicy;
                          })()}
                        </p>
                      </div>
                    </div>
                  )}
                  {property.reservationRules && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {property.reservationRules.minimumStay && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-green-500" />
                          <span>حداقل اقامت: {property.reservationRules.minimumStay} شب</span>
                        </div>
                      )}
                      {property.reservationRules.maximumStay && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-orange-500" />
                          <span>حداکثر اقامت: {property.reservationRules.maximumStay} شب</span>
                        </div>
                      )}
                      {property.reservationRules.instantBooking && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-700">رزرو آنی</Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* اطلاعات میزبان - نام و عکس پروفایل قبل از رزرو */}
            {property.owner && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">میزبان اقامتگاه</h2>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden border-2 border-gray-300 flex-shrink-0">
                    {property.owner.avatar ? (
                      <img
                        src={property.owner.avatar}
                        alt={property.owner.fullName || "میزبان"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <UserCheck className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">نام میزبان</p>
                    <p className="font-semibold text-lg">
                      {property.owner.fullName || "نامشخص"}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* نقش مالک و مدارک پذیرش مهمان */}
            {(property.ownerRole || property.guestDocumentType) && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">اطلاعات میزبان</h2>
                <div className="space-y-3">
                  {property.ownerRole && (
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">نقش در اقامتگاه</p>
                        <p className="font-semibold">
                          {(() => {
                            const roles = {
                              owner: "مالک",
                              lawyer: "وکیل",
                              agent: "نماینده"
                            };
                            return roles[property.ownerRole] || property.ownerRole;
                          })()}
                        </p>
                      </div>
                    </div>
                  )}
                  {property.guestDocumentType && (
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">مدارک پذیرش مهمان</p>
                        <p className="font-semibold">
                          {(() => {
                            const docTypes = {
                              "id-card": "کارت شناسایی",
                              "marriage-certificate": "سند ازدواج"
                            };
                            return docTypes[property.guestDocumentType] || property.guestDocumentType;
                          })()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <Card id="booking-calendar" className="border-2 border-blue-200 shadow-lg scroll-mt-24">
              <CardHeader className="bg-gradient-to-l from-blue-50 to-indigo-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                  تقویم قیمت و رزرو
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <BookingCalendar
                  property={property}
                  checkInDate={checkInDate}
                  checkOutDate={checkOutDate}
                  onChange={({ checkInDate: inDate, checkOutDate: outDate }) => {
                    setCheckInDate(inDate);
                    setCheckOutDate(outDate);
                  }}
                />
              </CardContent>
            </Card>

            {/* موقعیت جغرافیایی */}
            {property.address?.location?.lat && property.address?.location?.lng && (
              <LazyMap
                lat={property.address.location.lat}
                lng={property.address.location.lng}
              />
            )}

            {/* اطلاعات تماس */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">اطلاعات تماس</h2>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">نام مدیر</p>
                  {property.owner?.fullName ? (
                    <p className="font-semibold">{property.owner.fullName}</p>
                  ) : (
                    <p className="font-semibold text-muted-foreground">پس از رزرو نمایش داده می‌شود</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">شماره تماس</p>
                  {property.owner?.number ? (
                    <p className="font-semibold">{property.owner.number}</p>
                  ) : (
                    <p className="font-semibold text-muted-foreground">پس از رزرو نمایش داده می‌شود</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">آدرس کامل</p>
                  {property.address?.fullAddress ? (
                    <p className="font-semibold">{property.address.fullAddress}</p>
                  ) : (
                    <p className="font-semibold text-muted-foreground">پس از رزرو نمایش داده می‌شود</p>
                  )}
                </div>
              </div>
            </Card>

            {/* کارت سیستم‌های گرمایشی و سرمایشی */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">سیستم‌های گرمایشی و سرمایشی</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">سیستم گرمایشی</p>
                    <p className="font-semibold">
                      {(() => {
                        const heatingTypes = {
                          "gas-heater": "بخاری گازی",
                          "electric-heater": "بخاری برقی",
                          "radiator": "رادیاتور",
                          "electric-fan": "فن برقی",
                          "fireplace": "شومینه",
                          "fan-coil": "فن کویل",
                          "other": "سایر"
                        };
                        return heatingTypes[property.heating] || property.heating;
                      })()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Snowflake className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">سیستم سرمایشی</p>
                    <p className="font-semibold">
                      {(() => {
                        const coolingTypes = {
                          "water-cooler": "کولر آبی",
                          "gas-cooler": "کولر گازی",
                          "split-unit": "اسپلیت",
                          "ceiling-fan": "پنکه سقفی",
                          "regular-fan": "پنکه معمولی"
                        };
                        return coolingTypes[property.cooling] || property.cooling;
                      })()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* کارت اتاق‌های خواب */}
            {property.bedrooms && property.bedrooms.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">اتاق‌های خواب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {property.bedrooms.map((bedroom, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <h4 className="font-semibold">{bedroom.bedName}</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {bedroom.beds?.single > 0 && (
                          <div className="flex items-center gap-1">
                            <Bed className="w-3 h-3" />
                            <span>تخت یک نفره: {bedroom.beds.single}</span>
                          </div>
                        )}
                        {bedroom.beds?.double > 0 && (
                          <div className="flex items-center gap-1">
                            <Bed className="w-3 h-3" />
                            <span>تخت دو نفره: {bedroom.beds.double}</span>
                          </div>
                        )}
                        {bedroom.beds?.sofa > 0 && (
                          <div className="flex items-center gap-1">
                            <Sofa className="w-3 h-3" />
                            <span>مبل تختخواب‌شو: {bedroom.beds.sofa}</span>
                          </div>
                        )}
                      </div>
                      {/* امکانات اتاق */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {bedroom.amenities?.curtain && (
                          <Badge variant="outline" className="text-xs">پرده</Badge>
                        )}
                        {bedroom.amenities?.tv && (
                          <Badge variant="outline" className="text-xs">تلویزیون</Badge>
                        )}
                        {bedroom.amenities?.closet && (
                          <Badge variant="outline" className="text-xs">کمد</Badge>
                        )}
                      </div>
                      {/* سیستم گرمایشی و سرمایشی اتاق */}
                      {(bedroom.amenities?.heating || bedroom.amenities?.cooling) && (
                        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t">
                          {bedroom.amenities?.heating && (
                            <div className="flex items-center gap-1 text-xs text-red-600">
                              <Thermometer className="w-3 h-3" />
                              <span>
                                {(() => {
                                  const heatingTypes = {
                                    "gas-heater": "بخاری گازی",
                                    "electric-heater": "بخاری برقی",
                                    "radiator": "رادیاتور",
                                    "electric-fan": "فن برقی",
                                    "fireplace": "شومینه",
                                    "fan-coil": "فن کویل",
                                    "other": "سایر"
                                  };
                                  return heatingTypes[bedroom.amenities.heating] || bedroom.amenities.heating;
                                })()}
                              </span>
                            </div>
                          )}
                          {bedroom.amenities?.cooling && (
                            <div className="flex items-center gap-1 text-xs text-blue-600">
                              <Snowflake className="w-3 h-3" />
                              <span>
                                {(() => {
                                  const coolingTypes = {
                                    "water-cooler": "کولر آبی",
                                    "gas-cooler": "کولر گازی",
                                    "split-unit": "اسپلیت",
                                    "ceiling-fan": "پنکه سقفی",
                                    "regular-fan": "پنکه معمولی"
                                  };
                                  return coolingTypes[bedroom.amenities.cooling] || bedroom.amenities.cooling;
                                })()}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* کارت فضاهای اضافی */}
            {property.additionalSpaces && property.additionalSpaces.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">فضاهای اضافی</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {property.additionalSpaces.map((space, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{space.spaceName}</h4>
                        {space.area && (
                          <span className="text-sm text-muted-foreground">{space.area} متر</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {(() => {
                          const spaceTypes = {
                            "living-room": "اتاق نشیمن",
                            "kitchen": "آشپزخانه",
                            "bathroom": "حمام",
                            "yard": "حیاط",
                            "balcony": "بالکن",
                            "terrace": "تراس",
                            "garage": "گاراژ",
                            "storage": "انبار",
                            "other": "سایر"
                          };
                          return spaceTypes[space.spaceType] || space.spaceType;
                        })()}
                      </p>
                      {space.description && (
                        <p className="text-sm mt-1">{space.description}</p>
                      )}
                      {space.amenities && space.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {space.amenities.map((amenity, amenityIndex) => (
                            <Badge key={amenityIndex} variant="outline" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* کارت امکانات */}
            {((property.facilities && property.facilities.length > 0) ||
              (property.kitchenEquipment && property.kitchenEquipment.length > 0) ||
              (property.entertainment && property.entertainment.length > 0) ||
              (property.amenities && property.amenities.length > 0)) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">امکانات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {property.facilities && property.facilities.length > 0 && (
                    <div>
                      <h5 className="font-semibold mb-2">امکانات عمومی</h5>
                      <div className="flex flex-wrap gap-1">
                        {property.facilities.map((facility, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {facility.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {property.kitchenEquipment && property.kitchenEquipment.length > 0 && (
                    <div>
                      <h5 className="font-semibold mb-2">تجهیزات آشپزخانه</h5>
                      <div className="flex flex-wrap gap-1">
                        {property.kitchenEquipment.map((equipment, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {equipment.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {property.entertainment && property.entertainment.length > 0 && (
                    <div>
                      <h5 className="font-semibold mb-2">سرگرمی</h5>
                      <div className="flex flex-wrap gap-1">
                        {property.entertainment.map((item, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {item.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {property.amenities && property.amenities.length > 0 && (
                    <div>
                      <h5 className="font-semibold mb-2">سایر امکانات</h5>
                      <div className="flex flex-wrap gap-1">
                        {property.amenities.map((amenity, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {amenity.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* بخش نظرات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">نظرات کاربران</span>
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
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* فرم اضافه کردن نظر */}
                {user && user.canComment && (
                  <div className="mb-6 p-4 border rounded-lg bg-muted/20">
                    <h3 className="font-semibold mb-4">نظر خود را بنویسید</h3>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitComment)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نام</FormLabel>
                              <FormControl>
                                <Input placeholder="نام خود را وارد کنید" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="text"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>متن نظر</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="نظر خود را در مورد این ملک بنویسید..."
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="rating"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>امتیاز</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="امتیاز خود را انتخاب کنید" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1">1 ستاره</SelectItem>
                                  <SelectItem value="2">2 ستاره</SelectItem>
                                  <SelectItem value="3">3 ستاره</SelectItem>
                                  <SelectItem value="4">4 ستاره</SelectItem>
                                  <SelectItem value="5">5 ستاره</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={isSubmittingComment}>
                          {isSubmittingComment ? "در حال ثبت..." : "ثبت نظر"}
                        </Button>
                      </form>
                    </Form>
                  </div>
                )}

                {user && !user.canComment && (
                  <div className="mb-6 p-4 border rounded-lg bg-yellow-50 text-center">
                    <p className="text-yellow-700">
                      {!user.isVerified && "برای ثبت نظر ابتدا حساب کاربری خود را تایید کنید"}
                      {user.isBanned && "حساب کاربری شما مسدود شده است"}
                    </p>
                  </div>
                )}

                {!user && (
                  <div className="mb-6 p-4 border rounded-lg bg-muted/20 text-center">
                    <p className="text-muted-foreground">برای ثبت نظر ابتدا وارد شوید</p>
                    <Button variant="outline" className="mt-2" onClick={() => router.push('/auth/signin')}>
                      ورود
                    </Button>
                  </div>
                )}

                {/* نمایش نظرات */}
                {property.comments && property.comments.filter(c => c.isApproved).length > 0 ? (
                  <div className="space-y-4">
                    {property.comments.filter(c => c.isApproved).map((comment, index) => (
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>هنوز نظری ثبت نشده است</p>
                    <p className="text-sm">اولین نفری باشید که نظر می‌دهید!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* اقامتگاه‌های مشابه */}
            {similarProperties && similarProperties.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">اقامتگاه‌های مشابه</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {similarProperties.map((prop) => (
                      <PropertyCard key={prop._id} property={prop} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ستون سایدبار - کارت رزرو */}
          <div className="md:col-span-1">
            <Card className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-xl">رزرو این اقامتگاه</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">قیمت هر شب</span>
                    <span className="font-bold">
                      {(() => {
                        const p = property.pricing;
                        if (!p) return (property.price || 0).toLocaleString("fa-IR") + " تومان";
                        const prices = [
                          p.regularPrice,
                          p.wednesdayPrice,
                          p.thursdayPrice,
                          p.fridayPrice,
                          p.peakPrice,
                        ].filter(v => v > 0);
                        if (prices.length === 0) return "۰ تومان";
                        const min = Math.min(...prices);
                        const max = Math.max(...prices);
                        if (min === max) return `${min.toLocaleString("fa-IR")} تومان`;
                        return `${min.toLocaleString("fa-IR")} - ${max.toLocaleString("fa-IR")} تومان`;
                      })()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    * {property.pricing?.deposit || 10}% بیعانه + ۱۰% مالیات در هنگام رزرو پرداخت می‌شود
                  </p>
                </div>
                <ReservationButton
                  property={property}
                  user={user}
                  checkInDate={checkInDate}
                  setCheckInDate={setCheckInDate}
                  checkOutDate={checkOutDate}
                  setCheckOutDate={setCheckOutDate}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      );
    };

    export default PropertyDetailsPage;