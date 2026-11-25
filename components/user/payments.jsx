import { Badge } from "@/components/ui/badge";

import { Card, CardContent } from "@/components/ui/card";

import { Calendar, CreditCard } from "lucide-react";

const getStatusBadge = (status) => {
  const styles = {
    pending: "bg-yellow-500/10 text-yellow-500",
    paid: "bg-green-500/10 text-green-500",
    success: "bg-green-500/10 text-green-500",
    failed: "bg-red-500/10 text-red-500",
  };

  const texts = {
    pending: "در انتظار پرداخت",
    paid: "پرداخت شده",
    success: "پرداخت موفق",
    failed: "ناموفق",
  };

  return (
    <Badge variant="outline" className={styles[status]}>
      {texts[status]}
    </Badge>
  );
};

const Payments = ({ payments }) => {
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">پرداخت‌های من</h2>
        <span className="text-muted-foreground">
          تعداد تراکنش‌ها: {payments?.length || 0}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {payments?.length > 0 ? (
          payments.map((payment) => (
            <Card key={payment._id}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-lg">
                    {payment.amount?.toLocaleString("fa-IR")} تومان
                  </span>
                  {getStatusBadge(payment.status)}
                </div>

                <div className="space-y-2 text-sm">
                  {(payment.trackingCode || payment.refId) && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <span>کد پیگیری: {payment.trackingCode || payment.refId}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {new Date(payment.createdAt).toLocaleDateString("fa-IR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t text-sm">
                  <span className="text-muted-foreground">
                    شناسه پرداخت: {payment.authority}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="col-span-full text-center text-muted-foreground py-8">
            هیچ تراکنشی یافت نشد
          </p>
        )}
      </div>
    </div>
  );
};

export default Payments;
