"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, ArrowLeft, Home, RefreshCw } from "lucide-react";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const errorType = searchParams.get("error");
  
  const [errorMessage, setErrorMessage] = useState("");
  
  useEffect(() => {
    switch(errorType) {
      case "verification_failed":
        setErrorMessage("تایید پرداخت با خطا مواجه شد. مبلغ پرداختی به حساب شما بازگردانده خواهد شد.");
        break;
      case "server_error":
        setErrorMessage("خطایی در سرور رخ داده است. لطفا با پشتیبانی تماس بگیرید.");
        break;
      case "payment_canceled":
        setErrorMessage("پرداخت توسط شما لغو شده است.");
        break;
      default:
        setErrorMessage("پرداخت با خطا مواجه شد. لطفا مجددا تلاش کنید.");
    }
  }, [errorType]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md shadow-lg border-red-100">
        <CardHeader className="text-center border-b pb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-700">خطا در پرداخت</CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-center text-red-800">
              {errorMessage}
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">وضعیت:</span>
              <span className="font-bold text-red-700">ناموفق</span>
            </div>
            
            <div className="flex justify-between items-center pb-2">
              <span className="text-gray-600">تاریخ:</span>
              <span className="font-bold">{new Date().toLocaleDateString("fa-IR")}</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button variant="outline" className="w-full sm:w-1/3" asChild>
            <Link href="/dashboard/user/orders">
              <ArrowLeft className="ml-2 h-4 w-4" />
              رزروهای من
            </Link>
          </Button>
          
          <Button variant="outline" className="w-full sm:w-1/3" asChild>
            <Link href="/">
              <Home className="ml-2 h-4 w-4" />
              صفحه اصلی
            </Link>
          </Button>
          
          <Button 
            className="w-full sm:w-1/3" 
            onClick={() => window.history.back()}
          >
            <RefreshCw className="ml-2 h-4 w-4" />
            تلاش مجدد
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">در حال بارگذاری...</div>}>
      <PaymentFailedContent />
    </Suspense>
  );
}
