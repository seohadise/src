"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState("");

  // دریافت پارامترهای URL
  const itemType = searchParams.get("itemType"); // نوع آیتم: property, bus, food
  const itemId = searchParams.get("itemId"); // شناسه آیتم
  
  // پارامترهای اختصاصی هر نوع آیتم
  const checkInDate = searchParams.get("checkInDate"); // تاریخ ورود (برای ملک)
  const checkOutDate = searchParams.get("checkOutDate"); // تاریخ خروج (برای ملک)
  const date = searchParams.get("date"); // تاریخ (برای اتوبوس)
  const dates = searchParams.get("dates"); // تاریخ‌ها (برای غذا)
  const quantity = searchParams.get("quantity"); // تعداد (برای غذا)

  useEffect(() => {
    if (!itemType || !itemId) {
      setError("اطلاعات پرداخت ناقص است");
      setLoading(false);
      return;
    }

    const createPayment = async () => {
      try {
        let endpoint = "/api/payment/create";
        let paymentData = { itemId };

        // تنظیم داده‌های پرداخت بر اساس نوع آیتم
        if (itemType === "property") {
          paymentData = {
            propertyId: itemId,
            checkInDate,
            checkOutDate,
          };
        } else if (itemType === "bus") {
          endpoint = "/api/bus-payment/create";
          paymentData = {
            busId: itemId,
            date,
          };
        } else if (itemType === "food") {
          endpoint = "/api/food-payment/create";
          paymentData = {
            foodId: itemId,
            dates: dates ? dates.split(",") : [],
            quantity: quantity ? parseInt(quantity) : 1,
          };
        }

        const response = await axios.post(endpoint, paymentData);
        
        if (response.data.success) {
          setPaymentData(response.data.data);
          setPaymentUrl(response.data.data.paymentUrl);
        } else {
          setError(response.data.message || "خطا در ایجاد درخواست پرداخت");
        }
      } catch (error) {
        setError(error.response?.data?.message || "خطا در ارتباط با سرور");
      } finally {
        setLoading(false);
      }
    };

    createPayment();
  }, [itemType, itemId, checkInDate, checkOutDate, date, dates, quantity]);

  // هدایت خودکار به درگاه پرداخت
  useEffect(() => {
    if (paymentUrl) {
      const timer = setTimeout(() => {
        window.location.href = paymentUrl;
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [paymentUrl]);

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 lg:px-8 min-h-screen flex flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">پرداخت آنلاین</CardTitle>
          <CardDescription className="text-center">
            {loading ? "در حال آماده‌سازی اطلاعات پرداخت..." : 
             error ? "خطا در پرداخت" : 
             "در حال انتقال به درگاه پرداخت..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">لطفا صبر کنید...</p>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => router.back()}>بازگشت</Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="mb-2">تا چند لحظه دیگر به درگاه پرداخت منتقل می‌شوید</p>
              <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                اگر به صورت خودکار منتقل نشدید، روی دکمه زیر کلیک کنید
              </p>
            </div>
          )}
        </CardContent>
        {paymentUrl && (
          <CardFooter>
            <Button className="w-full" onClick={() => window.location.href = paymentUrl}>
              انتقال به درگاه پرداخت
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-10 px-4 md:px-6 lg:px-8 min-h-screen flex flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">در حال بارگذاری...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
