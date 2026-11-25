"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowLeft, Home, AlertTriangle } from "lucide-react";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const refId = searchParams.get("ref_id");
  const amount = searchParams.get("amount");
  const paymentId = searchParams.get("paymentId");
  const reservationId = searchParams.get("reservationId");
  const warning = searchParams.get("warning");

  const [formattedAmount, setFormattedAmount] = useState("");
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    if (amount) {
      setFormattedAmount(Number(amount).toLocaleString("fa-IR"));
    }
  }, [amount]);

  // دریافت اطلاعات پرداخت اگر paymentId موجود باشد
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (paymentId) {
        try {
          const response = await fetch(`/api/payment/${paymentId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setPaymentDetails(data.data);
              if (!amount && data.data.amount) {
                setFormattedAmount(Number(data.data.amount).toLocaleString("fa-IR"));
              }
            }
          }
        } catch (error) {
          console.error("Error fetching payment details:", error);
        }
      }
    };

    fetchPaymentDetails();
  }, [paymentId, amount]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md shadow-lg border-green-100">
        <CardHeader className="text-center border-b pb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-700">پرداخت موفقیت‌آمیز</CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-center text-green-800">
              پرداخت شما با موفقیت انجام شد و رزرو شما ثبت گردید.
            </p>
          </div>

          {warning && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-center text-yellow-800">
                  {warning}
                </p>
              </div>
              <p className="text-center text-yellow-700 text-sm">
                لطفاً با پشتیبانی تماس بگیرید.
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">شناسه پرداخت:</span>
              <span className="font-bold">{refId || paymentDetails?.refId || "---"}</span>
            </div>

            {(formattedAmount || paymentDetails?.amount) && (
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">مبلغ پرداختی:</span>
                <span className="font-bold text-green-700">
                  {formattedAmount || Number(paymentDetails?.amount).toLocaleString("fa-IR")} تومان
                </span>
              </div>
            )}

            {reservationId && (
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">شناسه رزرو:</span>
                <span className="font-bold text-blue-700">{reservationId}</span>
              </div>
            )}

            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">وضعیت:</span>
              <span className="font-bold text-green-700">پرداخت شده</span>
            </div>

            <div className="flex justify-between items-center pb-2">
              <span className="text-gray-600">تاریخ:</span>
              <span className="font-bold">{new Date().toLocaleDateString("fa-IR")}</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button variant="outline" className="w-full sm:w-1/2" asChild>
            <Link href="/dashboard/user/orders">
              <ArrowLeft className="ml-2 h-4 w-4" />
              رزروهای من
            </Link>
          </Button>
          
          <Button className="w-full sm:w-1/2" asChild>
            <Link href="/">
              <Home className="ml-2 h-4 w-4" />
              صفحه اصلی
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">در حال بارگذاری...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
