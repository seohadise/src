"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const RecoverPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleRecover = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await axios.post('/api/admin/recover-reservations');
      
      if (response.data.success) {
        setResult(response.data.data);
        toast.success("بازیابی رزروها با موفقیت انجام شد");
      } else {
        toast.error(response.data.message || "خطا در بازیابی رزروها");
      }
    } catch (error) {
      console.error("Error recovering reservations:", error);
      toast.error("خطا در بازیابی رزروها");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">بازیابی رزروهای قبلی</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بازیابی رزروها از پرداخت‌های موفق</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            این ابزار تمام پرداخت‌های موفق را بررسی می‌کند و رزروهای مفقود شده را بازیابی می‌کند.
            همچنین کیف پول مالکان را بروزرسانی می‌کند.
          </p>
          
          <Button 
            onClick={handleRecover} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                در حال بازیابی...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                شروع بازیابی
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              نتایج بازیابی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {result.totalPayments}
                </div>
                <div className="text-sm text-muted-foreground">
                  کل پرداخت‌های موفق
                </div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {result.recoveredReservations}
                </div>
                <div className="text-sm text-muted-foreground">
                  رزروهای بازیابی شده
                </div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {result.walletUpdates}
                </div>
                <div className="text-sm text-muted-foreground">
                  کیف پول‌های بروزرسانی شده
                </div>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-600">خطاها:</span>
                </div>
                <ul className="text-sm text-red-600 space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index}>
                      پرداخت {error.paymentId}: {error.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecoverPage;
