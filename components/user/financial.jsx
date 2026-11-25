"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import axios from "axios";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

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
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [cardNumber, setCardNumber] = useState(user?.bankInfo?.cardNumber || "");
  const [ownerName, setOwnerName] = useState(user?.bankInfo?.ownerName || user?.fullName || "");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const amount = parseInt(withdrawAmount) || (user?.wallet?.balance || 0);
      const cleanCard = String(cardNumber).replace(/\s|-/g, "");
      const response = await axios.post('/api/withdrawals', {
        amount,
        cardNumber: cleanCard,
        ownerName,
      });
      return response.data;
    },
    onSuccess: (data) => {
      console.log("[Financial Withdrawal] onSuccess:", data);
      if (data.success) {
        toast.success(data.message);
        setIsWithdrawDialogOpen(false);
        setWithdrawAmount("");
        setTimeout(() => location.reload(), 1000);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      console.log("[Financial Withdrawal] onError:", error.response?.data);
      toast.error(error.response?.data?.message || error.message || "خطایی رخ داده است");
      setIsWithdrawing(false);
    },
  });

  const handleWithdraw = () => {
    const amount = parseInt(withdrawAmount);
    const balance = user?.wallet?.balance || 0;

    if (!amount || amount < 1000) {
      toast.error("حداقل مبلغ برداشت 1,000 تومان است");
      return;
    }
    if (amount > balance) {
      toast.error("مبلغ درخواستی بیشتر از موجودی شماست");
      return;
    }
    const cleanCard = String(cardNumber).replace(/\s|-/g, "");
    if (!/^\d{16}$/.test(cleanCard)) {
      toast.error("شماره کارت باید 16 رقمی باشد");
      return;
    }
    if (!ownerName?.trim()) {
      toast.error("نام صاحب کارت را وارد کنید");
      return;
    }

    setIsWithdrawing(true);
    mutate();
  };

  // محاسبه آمار مالی جامع
  const calculateFinancialStats = () => {
    const deposits = transactions?.filter(t => t.type === "deposit" && t.status === "completed") || [];
    const withdrawals = transactions?.filter(t => t.type === "withdraw" && t.status === "completed") || [];
    const incomes = transactions?.filter(t => t.type === "income" && t.status === "completed") || [];
    const expenses = transactions?.filter(t => t.type === "expense" && t.status === "completed") || [];

    const totalDeposits = deposits.reduce((sum, t) => sum + (t?.amount || 0), 0);
    const totalWithdrawals = withdrawals.reduce((sum, t) => sum + (t?.amount || 0), 0);
    const totalIncomes = incomes.reduce((sum, t) => sum + (t?.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + (t?.amount || 0), 0);

    // محاسبه از پرداخت‌ها
    const totalPayments = payments?.reduce((sum, p) => sum + (p?.amount || 0), 0) || 0;
    const totalDepositsFromPayments = payments?.reduce((sum, p) => sum + (p?.depositAmount || 0), 0) || 0;
    const totalCommissionsFromPayments = payments?.reduce((sum, p) => sum + (p?.commissionAmount || 0), 0) || 0;

    // محاسبه از کارمزدها (درآمدهای کاربر)
    const totalCommissions = commissions?.reduce((sum, c) => sum + (c?.baseAmount || 0), 0) || 0;
    const collectedCommissions = commissions?.filter(c => c?.status === "collected").reduce((sum, c) => sum + (c?.baseAmount || 0), 0) || 0;

    // محاسبه از رزروها - فقط رزروهای تایید شده و تکمیل شده
    // رزروهای pending (در انتظار تایید مالک) در آمار مالی لحاظ نمی‌شوند
    const validReservations = reservations?.filter(r => r.status === "confirmed" || r.status === "completed") || [];
    const totalReservations = validReservations.length;
    const activeReservations = reservations?.filter(r => r.status === "confirmed").length || 0;

    // محاسبه بیعانه‌ها (از کارمزدها)
    const totalDepositsFromCommissions = commissions?.reduce((sum, c) => sum + (c?.depositAmount || 0), 0) || 0;
    
    // محاسبه بیعانه‌ها (از توضیحات تراکنش‌ها)
    const deposits_from_reservations = transactions?.filter(t =>
      t?.description?.includes("بیعانه") || t?.description?.includes("رزرو")
    ) || [];
    const totalDepositsFromReservations = deposits_from_reservations.reduce((sum, t) => sum + (t?.amount || 0), 0);

    // محاسبه سود (درآمدها منهای کارمزد)
    const commissionFees = commissions?.reduce((sum, c) => sum + (c?.commissionAmount || 0), 0) || 0;
    const netProfit = totalCommissions - commissionFees;

    return {
      totalDeposits,
      totalWithdrawals,
      totalIncomes,
      totalExpenses,
      totalDepositsFromReservations: Math.max(totalDepositsFromReservations, totalDepositsFromPayments, totalDepositsFromCommissions),
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
            <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={(user?.wallet?.balance || 0) < 1000}
                  className="w-full md:w-auto"
                >
                  {(user?.wallet?.balance || 0) < 1000 ? "موجودی کافی نیست" : "درخواست برداشت"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>درخواست برداشت وجه</DialogTitle>
                  <DialogDescription>
                    موجودی فعلی: {(user?.wallet?.balance || 0).toLocaleString("fa-IR")} تومان. مبلغ به محض ثبت درخواست از کیف پول کسر می‌شود و پس از واریز توسط مدیر، تایید نهایی می‌گردد.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="withdraw-amount">مبلغ (تومان)</Label>
                    <Input
                      id="withdraw-amount"
                      type="number"
                      placeholder="مثال: 50000"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      min="1000"
                      max={user?.wallet?.balance || 0}
                    />
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setWithdrawAmount(String(user?.wallet?.balance || 0))}>
                        کل موجودی
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-number">شماره کارت (16 رقمی)</Label>
                    <Input
                      id="card-number"
                      type="text"
                      inputMode="numeric"
                      placeholder="6037-XXXX-XXXX-XXXX"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      maxLength={19}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="owner-name">نام صاحب کارت</Label>
                    <Input
                      id="owner-name"
                      type="text"
                      placeholder="نام و نام خانوادگی"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleWithdraw} disabled={isWithdrawing} className="w-full">
                    {isWithdrawing ? "در حال ثبت درخواست..." : "ثبت درخواست برداشت"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* آمار مالی */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل درآمدها</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(stats?.totalCommissions || 0).toLocaleString("fa-IR")}
            </div>
            <p className="text-xs text-muted-foreground">
              {commissions?.length || 0} پرداخت
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
              {(stats?.totalWithdrawals || 0).toLocaleString("fa-IR")}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.withdrawalsCount || 0} تراکنش
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
              {(stats?.totalDepositsFromReservations || 0).toLocaleString("fa-IR")}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalReservations || 0} رزرو
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
              {commissions?.reduce((sum, c) => sum + (c?.commissionAmount || 0), 0).toLocaleString("fa-IR")}
            </div>
            <p className="text-xs text-muted-foreground">
              کارمزد سایت (6%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">سود خالص</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(stats?.netProfit || 0).toLocaleString("fa-IR")}
            </div>
            <p className="text-xs text-muted-foreground">
              درآمد - کارمزد
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
                {(stats.totalCommissions || 0).toLocaleString("fa-IR")} تومان
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">تعداد پرداخت:</span>
              <span className="font-medium">{commissions?.length || 0}</span>
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
              <span className="text-muted-foreground">کارمزد سایت:</span>
              <span className="font-bold text-red-600">
                {commissions?.reduce((sum, c) => sum + (c?.commissionAmount || 0), 0).toLocaleString("fa-IR")} تومان
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">نرخ کارمزد:</span>
              <span className="font-medium">6%</span>
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
                    {payments?.length || 0} پرداخت موفق
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {payments?.slice(0, 5).map((payment) => (
                      <div key={payment?._id} className="border rounded p-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">
                              {payment?.propertyId?.name ||
                               payment?.busId?.title ||
                               payment?.foodId?.name ||
                               (payment?.itemType === "property" ? "ملک" :
                                payment?.itemType === "bus" ? "اتوبوس" :
                                payment?.itemType === "food" ? "غذا" : "نامشخص")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {payment?.createdAt ? new Date(payment.createdAt).toLocaleDateString("fa-IR") : "تاریخ نامشخص"}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-green-600">
                            {(payment?.amount || 0).toLocaleString("fa-IR")} تومان
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
                    {stats?.activeReservations || 0} رزرو فعال از {stats?.totalReservations || 0} کل
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {reservations?.slice(0, 5).map((reservation) => (
                      <div key={reservation?._id} className="border rounded p-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {reservation?.itemId?.name ||
                               (reservation?.itemType === "property" ? "ملک" :
                                reservation?.itemType === "bus" ? "اتوبوس" :
                                reservation?.itemType === "food" ? "غذا" : "رزرو")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {reservation?.checkInDate ?
                                new Date(reservation.checkInDate).toLocaleDateString("fa-IR") :
                                reservation?.date ?
                                new Date(reservation.date).toLocaleDateString("fa-IR") :
                                reservation?.createdAt ?
                                new Date(reservation.createdAt).toLocaleDateString("fa-IR") :
                                "تاریخ نامشخص"}
                            </p>
                            {reservation?.amount && (
                              <p className="text-xs font-medium text-green-600">
                                {reservation.amount.toLocaleString("fa-IR")} تومان
                              </p>
                            )}
                          </div>
                          <Badge variant={
                            reservation?.status === "confirmed" ? "default" :
                            reservation?.status === "completed" ? "success" :
                            reservation?.status === "pending" ? "secondary" : "destructive"
                          } className="text-xs">
                            {reservation?.status === "confirmed" ? "تایید شده" :
                             reservation?.status === "completed" ? "تکمیل شده" :
                             reservation?.status === "pending" ? "در انتظار تایید" : "لغو شده"}
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
                    {commissions?.filter(c => c?.status === "collected").length || 0} دریافت شده از {commissions?.length || 0} کل
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {commissions?.slice(0, 5).map((commission) => (
                      <div key={commission?._id} className="border rounded p-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">
                              {commission?.itemId?.name || 
                               (commission?.itemType === "property" ? "ملک" :
                                commission?.itemType === "bus" ? "اتوبوس" :
                                commission?.itemType === "food" ? "غذا" : "نامشخص")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {commission?.createdAt ? new Date(commission.createdAt).toLocaleDateString("fa-IR") : "تاریخ نامشخص"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-600">
                              {(commission?.commissionAmount || 0).toLocaleString("fa-IR")} تومان
                            </p>
                            <Badge variant={
                              commission?.status === "collected" ? "default" :
                              commission?.status === "pending" ? "secondary" : "destructive"
                            } className="text-xs">
                              {commission?.status === "collected" ? "دریافت شده" :
                               commission?.status === "pending" ? "در انتظار" : "بازگشت"}
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
