import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "پرداخت موفق",
};

const PaymentSuccessPage = async ({ searchParams }) => {
  const params = await searchParams;
  const refId = params?.ref_id;
  const amount = params?.amount;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl text-green-600">
            🎉 پرداخت موفق 🎉
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            پرداخت شما با موفقیت انجام شد
          </p>
          
          {refId && (
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-sm font-medium">شماره پیگیری:</p>
              <p className="text-lg font-bold text-blue-600">{refId}</p>
            </div>
          )}
          
          {amount && (
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-sm font-medium">مبلغ پرداختی:</p>
              <p className="text-lg font-bold text-green-600">
                {parseInt(amount).toLocaleString("fa-IR")} تومان
              </p>
            </div>
          )}
          
          <div className="space-y-2 pt-4">
            <Button asChild className="w-full">
              <Link href="/dashboard">
                مشاهده پنل کاربری
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                بازگشت به صفحه اصلی
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage; 