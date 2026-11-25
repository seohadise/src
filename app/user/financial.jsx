"use client";

import { useMutation } from "@tanstack/react-query";

import { createWithdrawalRequest } from "@/app/_actions";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

import { toast } from "sonner";

import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  DollarSign,
  CreditCard,
  PiggyBank,
  RefreshCw
} from "lucide-react";

const Financial = ({ user, transactions, payments, commissions, reservations }) => {
  const { mutate, isPending } = useMutation({
    mutationFn: createWithdrawalRequest,
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setTimeout(() => location.reload(), 1000);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || "خطایی رخ داده است");
    },
  });

  // محاسبه آمار مالی جامع
  const calculateFinancialStats = () => {
    const deposits = transactions?.filter(t => t.type === "deposit") || [];
    const withdrawals = transactions?.filter(t => t.type === "withdraw") || [];
    const incomes = transactions?.filter(t => t.type === "income") || [];
    const expenses = transactions?.filter(t => t.type === "expense") || [];

    const totalDeposits = deposits.reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = withdrawals.reduce((sum, t) => sum + t.amount, 0);
    const totalIncomes = incomes.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

    // محاسبه از پرداخت‌ها
    const totalPayments = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const totalDepositsFromPayments = payments?.reduce((sum, p) => sum + (p.depositAmount || 0), 0) || 0;
    const totalCommissionsFromPayments = payments?.reduce((sum, p) => sum + (p.commissionAmount || 0), 0) || 0;

    // محاسبه از کارمزدها
    const totalCommissions = commissions?.reduce((sum, c) => sum + c.commissionAmount, 0) || 0;
    const collectedCommissions = commissions?.filter(c => c.status === "collected").reduce((sum, c) => sum + c.commissionAmount, 0) || 0;

    // محاسبه از رزروها
    const totalReservations = reservations?.length || 0;
    const activeReservations = reservations?.filter(r => r.status === "confirmed").length || 0;

    // محاسبه بیعانه‌ها (از توضیحات تراکنش‌ها)
    const deposits_from_reservations = transactions?.filter(t =>
      t.description?.includes("بیعانه") || t.description?.includes("رزرو")
    ) || [];
    const totalDepositsFromReservations = deposits_from_reservations.reduce((sum, t) => sum + t.amount, 0);

    // محاسبه سود (درآمدها منهای هزینه‌ها)
    const netProfit = totalIncomes - totalExpenses;

    return {
      totalDeposits,
      totalWithdrawals,
      totalIncomes,
      totalExpenses,
      totalDepositsFromReservations: Math.max(totalDepositsFromReservations, totalDepositsFromPayments),
      totalPayments,
      totalCommissions,
      collectedCommissions,
      totalReservations,
      activeReservations,
      netProfit,
      depositsCount: deposits.length,
      withdrawalsCount: withdrawals.length,
      incomesCount: incomes.length,
      expensesCount: expenses.length
    };
  };

  const stats = calculateFinancialStats();

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* کارت موجودی کیف پول */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            موجودی کیف پول
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between">
            <div className="space-y-2">
              <p className="text-3xl font-bold text-green-600">
                {(user?.wallet?.balance || 0).toLocaleString("fa-IR")} تومان
              </p>
              <p className="text-sm text-muted-foreground">
                موجودی قابل برداشت
              </p>
            </div>
            <Button
              onClick={mutate}
              disabled={isPending || (user?.wallet?.balance || 0) < 100000}
              className="w-full md:w-auto"
            >
              {isPending ? "در حال پردازش..." : "درخواست برداشت"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* آمار مالی */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل واریزی‌ها</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalDeposits.toLocaleString("fa-IR")}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.depositsCount} تراکنش
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل برداشت‌ها</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.totalWithdrawals.toLocaleString("fa-IR")}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.withdrawalsCount} تراکنش
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">بیعانه‌ها</CardTitle>
            <PiggyBank className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalDepositsFromReservations.toLocaleString("fa-IR")}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalReservations} رزرو
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کارمزدها</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.collectedCommissions.toLocaleString("fa-IR")}
            </div>
            <p className="text-xs text-muted-foreground">
              از {stats.totalCommissions.toLocaleString("fa-IR")} کل
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">سود خالص</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.netProfit.toLocaleString("fa-IR")}
            </div>
            <p className="text-xs text-muted-foreground">
              درآمد - هزینه
            </p>
          </CardContent>
        </Card>
      </div>

      {/* جزئیات درآمد و هزینه */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              درآمدها
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">کل درآمد:</span>
              <span className="font-bold text-green-600">
                {stats.totalIncomes.toLocaleString("fa-IR")} تومان
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">تعداد تراکنش:</span>
              <span className="font-medium">{stats.incomesCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-red-500" />
              هزینه‌ها
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">کل هزینه:</span>
              <span className="font-bold text-red-600">
                {stats.totalExpenses.toLocaleString("fa-IR")} تومان
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">تعداد تراکنش:</span>
              <span className="font-medium">{stats.expensesCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* اطلاعات پرداخت‌ها و رزروها */}
      {(payments?.length > 0 || reservations?.length > 0 || commissions?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* پرداخت‌ها */}
          {payments?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-500" />
                  پرداخت‌های من
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {payments.length} پرداخت موفق
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {payments.slice(0, 5).map((payment) => (
                      <div key={payment._id} className="border rounded p-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">
                              {payment.propertyId?.name || "ملک"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(payment.createdAt).toLocaleDateString("fa-IR")}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-green-600">
                            {payment.amount.toLocaleString("fa-IR")} تومان
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* رزروها */}
          {reservations?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-purple-500" />
                  رزروهای من
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {stats.activeReservations} رزرو فعال از {stats.totalReservations} کل
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {reservations.slice(0, 5).map((reservation) => (
                      <div key={reservation._id} className="border rounded p-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">
                              {reservation.itemId?.name || "ملک"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(reservation.startDate).toLocaleDateString("fa-IR")}
                            </p>
                          </div>
                          <Badge variant={
                            reservation.status === "confirmed" ? "default" :
                            reservation.status === "pending" ? "secondary" : "destructive"
                          } className="text-xs">
                            {reservation.status === "confirmed" ? "تایید شده" :
                             reservation.status === "pending" ? "در انتظار" : "لغو شده"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* کارمزدها (برای مالکان) */}
          {commissions?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  کارمزدهای من
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {commissions.filter(c => c.status === "collected").length} دریافت شده از {commissions.length} کل
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {commissions.slice(0, 5).map((commission) => (
                      <div key={commission._id} className="border rounded p-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">
                              {commission.itemId?.name || "ملک"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(commission.createdAt).toLocaleDateString("fa-IR")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-600">
                              {commission.commissionAmount.toLocaleString("fa-IR")} تومان
                            </p>
                            <Badge variant={
                              commission.status === "collected" ? "default" :
                              commission.status === "pending" ? "secondary" : "destructive"
                            } className="text-xs">
                              {commission.status === "collected" ? "دریافت شده" :
                               commission.status === "pending" ? "در انتظار" : "بازگشت"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* لیست تراکنش‌ها */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            تاریخچه تراکنش‌ها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions?.map((transaction) => (
              <div key={transaction._id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {transaction.type === "deposit" ? (
                      <ArrowDownLeft className="w-5 h-5 text-green-600" />
                    ) : transaction.type === "withdraw" ? (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    ) : transaction.type === "income" ? (
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    ) : (
                      <CreditCard className="w-5 h-5 text-orange-600" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">
                          {transaction.type === "deposit" ? "واریز" :
                           transaction.type === "withdraw" ? "برداشت" :
                           transaction.type === "income" ? "درآمد" : "هزینه"}
                        </p>
                        <Badge variant={
                          transaction.status === "completed" ? "default" :
                          transaction.status === "pending" ? "secondary" : "destructive"
                        } className="text-xs">
                          {transaction.status === "completed" ? "تکمیل شده" :
                           transaction.status === "pending" ? "در انتظار" : "ناموفق"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {new Date(transaction.createdAt).toLocaleDateString(
                          "fa-IR",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                      {transaction.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {transaction.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-sm ${
                        transaction.type === "deposit" || transaction.type === "income"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {(transaction.type === "deposit" || transaction.type === "income") ? "+" : "-"}{" "}
                      {transaction.amount.toLocaleString("fa-IR")} تومان
                    </p>
                    {transaction.relatedModel && (
                      <p className="text-xs text-muted-foreground">
                        {transaction.relatedModel === "Reservation" ? "رزرو" :
                         transaction.relatedModel === "Payment" ? "پرداخت" :
                         transaction.relatedModel === "Commission" ? "کارمزد" : "سایر"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!transactions?.length && (
              <div className="text-center py-8">
                <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  هیچ تراکنشی یافت نشد
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Financial;
