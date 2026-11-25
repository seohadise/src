import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "پرداخت ناموفق",
};

const PaymentFailedPage = async ({ searchParams }) => {
  const params = await searchParams;
  const error = params?.error;

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case "missing_authority":
        return "اطلاعات پرداخت کامل نیست";
      case "payment_not_found":
        return "پرداخت مورد نظر یافت نشد";
      case "payment_cancelled":
        return "پرداخت توسط کاربر لغو شد";
      case "verification_failed":
        return "تایید پرداخت ناموفق بود";
      case "server_error":
        return "خطای داخلی سرور";
      default:
        return "پرداخت با خطا مواجه شد";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-2xl text-red-600">
            ❌ پرداخت ناموفق
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            {getErrorMessage(error)}
          </p>
          
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <p className="text-sm text-red-600">
              در صورت کسر مبلغ از حساب شما، طی ۲۴ ساعت آینده به حساب شما بازگردانده می‌شود.
            </p>
          </div>
          
          <div className="space-y-2 pt-4">
            <Button asChild className="w-full">
              <Link href="/payment">
                تلاش مجدد
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                بازگشت به صفحه اصلی
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/contact">
                تماس با پشتیبانی
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentFailedPage; 