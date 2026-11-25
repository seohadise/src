"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, TrendingUp, TrendingDown, Clock, ArrowUpRight, ArrowDownRight, Plus, Banknote } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const getTransactionIcon = (type) => {
  return type === "income" ? (
    <ArrowUpRight className="w-4 h-4 text-green-600" />
  ) : (
    <ArrowDownRight className="w-4 h-4 text-red-600" />
  );
};

const getTransactionBadge = (type) => {
  const styles = {
    income: "bg-green-500/10 text-green-600 hover:bg-green-500/20",
    expense: "bg-red-500/10 text-red-600 hover:bg-red-500/20",
  };

  const texts = {
    income: "دریافتی",
    expense: "پرداختی",
  };

  return (
    <Badge variant="outline" className={styles[type]}>
      {texts[type]}
    </Badge>
  );
};

const UserWallet = ({ user, transactions = [] }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const balance = user?.wallet?.balance || 0;
  const [chargeAmount, setChargeAmount] = useState("");
  const [isCharging, setIsCharging] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Withdrawal state
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [cardNumber, setCardNumber] = useState(user?.bankInfo?.cardNumber || "");
  const [ownerName, setOwnerName] = useState(user?.bankInfo?.ownerName || user?.fullName || "");
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState(null);

  // Load pending withdrawals
  useEffect(() => {
    const fetchPendingWithdrawals = async () => {
      setIsLoadingPending(true);
      try {
        const res = await axios.get("/api/withdrawals?status=pending&limit=10");
        console.log("[Pending Withdrawals] Response:", res.data);
        if (res.data.success) {
          setPendingWithdrawals(res.data.data?.withdrawals || []);
        }
      } catch (error) {
        console.error("[Pending Withdrawals] Error:", error);
      } finally {
        setIsLoadingPending(false);
      }
    };

    fetchPendingWithdrawals();
  }, []);

  // Cancel withdrawal request
  const handleCancelWithdrawal = async (withdrawalId) => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید این درخواست برداشت را لغو کنید؟")) {
      return;
    }

    try {
      const res = await axios.delete(`/api/withdrawals?id=${withdrawalId}`);
      if (res.data.success) {
        toast.success(res.data.message);
        // Reload pending withdrawals
        const updatedRes = await axios.get("/api/withdrawals?status=pending&limit=10");
        if (updatedRes.data.success) {
          setPendingWithdrawals(updatedRes.data.withdrawals || []);
        }
        router.refresh();
      } else {
        toast.error(res.data.message || "خطا در لغو درخواست");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "خطا در ارتباط با سرور");
    }
  };

  // Check for success message in URL
  useEffect(() => {
    const success = searchParams.get("success");
    const amount = searchParams.get("amount");
    const refId = searchParams.get("ref_id");
    
    if (success === "true" && amount && refId) {
      // Show success toast
      toast.success(
        `کیف پول شما با موفقیت شارژ شد! مبلغ: ${parseInt(amount).toLocaleString("fa-IR")} تومان - کد پیگیری: ${refId}`,
        {
          duration: 5000,
        }
      );
      
      // Clean URL
      router.replace("/dashboard/user/wallet");
    }
  }, [searchParams, router]);

  // Calculate total income and expenses
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Handle wallet charge
  const handleCharge = async () => {
    const amount = parseInt(chargeAmount);
    
    if (!amount || amount < 1000) {
      toast.error("حداقل مبلغ شارژ 1,000 تومان است");
      return;
    }

    if (amount > 100000000) {
      toast.error("حداکثر مبلغ شارژ 100,000,000 تومان است");
      return;
    }

    setIsCharging(true);

    try {
      const response = await fetch("/api/wallet/charge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        // Redirect to payment gateway
        window.location.href = data.paymentUrl;
      } else {
        toast.error(data.message || "خطا در ایجاد درگاه پرداخت");
        setIsCharging(false);
      }
    } catch (error) {
      console.error("Error charging wallet:", error);
      toast.error("خطا در برقراری ارتباط با سرور");
      setIsCharging(false);
    }
  };

  // Quick charge amounts
  const quickAmounts = [1000, 5000, 10000, 50000, 100000];

  // Handle withdrawal request
  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount < 1000) {
      toast.error("حداقل مبلغ برداشت 1,000 تومان است");
      return;
    }

    if (parseInt(withdrawAmount) > balance) {
      toast.error("مبلغ درخواستی بیشتر از موجودی شما است");
      return;
    }

    if (!cardNumber || cardNumber.length !== 16) {
      toast.error("شماره کارت باید 16 رقم باشد");
      return;
    }

    if (!ownerName || ownerName.trim().length < 3) {
      toast.error("نام صاحب کارت الزامی است");
      return;
    }

    setIsWithdrawing(true);
    setWithdrawalError(null);
    try {
      const cleanCard = cardNumber.replace(/-/g, "").replace(/\s/g, "");
      const res = await axios.post("/api/withdrawals", {
        amount: parseInt(withdrawAmount),
        cardNumber: cleanCard,
        ownerName,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setIsWithdrawDialogOpen(false);
        setWithdrawAmount("");
        setTimeout(() => router.refresh(), 800);
      } else {
        toast.error(res.data.message || "خطا در ثبت درخواست");
        // اگر خطای درخواست گیر شده است، درخواست‌های pending را لود کن
        if (res.data.message.includes("در انتظار") || res.data.message.includes("تایید شده")) {
          setWithdrawalError(res.data.message);
          const pendingRes = await axios.get("/api/withdrawals?status=pending&limit=10");
          if (pendingRes.data.success) {
            setPendingWithdrawals(pendingRes.data.data?.withdrawals || []);
          }
        }
      }
    } catch (e) {
      const errorMsg = e.response?.data?.message || "خطا در ارتباط با سرور";
      toast.error(errorMsg);
      // اگر خطای درخواست گیر شده است، درخواست‌های pending را لود کن
      if (errorMsg.includes("در انتظار") || errorMsg.includes("تایید شده")) {
        setWithdrawalError(errorMsg);
        const pendingRes = await axios.get("/api/withdrawals?status=pending&limit=10");
        if (pendingRes.data.success) {
          setPendingWithdrawals(pendingRes.data.data?.withdrawals || []);
        }
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="w-6 h-6" />
          کیف پول من
        </h1>

        <div className="flex gap-2">
        <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2" disabled={balance < 1000}>
              <Banknote className="w-4 h-4" />
              برداشت وجه
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>درخواست برداشت وجه</DialogTitle>
              <DialogDescription>
                موجودی فعلی: {balance.toLocaleString("fa-IR")} تومان. مبلغ به محض ثبت درخواست از کیف پول کسر می‌شود و پس از واریز توسط مدیر، تایید نهایی می‌گردد.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {withdrawalError && pendingWithdrawals.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-yellow-800 font-medium">{withdrawalError}</p>
                  <p className="text-xs text-yellow-700">برای ثبت درخواست جدید، ابتدا درخواست زیر را لغو کنید:</p>
                  {pendingWithdrawals.map((withdrawal) => (
                    <div key={withdrawal._id} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {withdrawal.amount.toLocaleString("fa-IR")} تومان
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(withdrawal.createdAt).toLocaleDateString("fa-IR")}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelWithdrawal(withdrawal._id)}
                      >
                        لغو
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">مبلغ (تومان)</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="مثال: 50000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min="1000"
                  max={balance}
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setWithdrawAmount(String(balance))}>
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              شارژ کیف پول
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>شارژ کیف پول</DialogTitle>
              <DialogDescription>
                مبلغ مورد نظر برای شارژ کیف پول خود را وارد کنید
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">مبلغ (تومان)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="مثال: 10000"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                  min="1000"
                  max="100000000"
                />
                <p className="text-xs text-muted-foreground">
                  حداقل: 1,000 تومان - حداکثر: 100,000,000 تومان
                </p>
              </div>

              <div className="space-y-2">
                <Label>مبالغ پیشنهادی</Label>
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setChargeAmount(amount.toString())}
                      className="text-xs"
                    >
                      {amount.toLocaleString("fa-IR")}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleCharge}
                disabled={isCharging || !chargeAmount}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isCharging ? "در حال انتقال به درگاه..." : "پرداخت و شارژ"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* درخواست‌های برداشت در انتظار */}
      {pendingWithdrawals.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-yellow-800 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              درخواست برداشت در انتظار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingWithdrawals.map((withdrawal) => (
                <div key={withdrawal._id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {withdrawal.amount.toLocaleString("fa-IR")} تومان
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(withdrawal.createdAt).toLocaleDateString("fa-IR")}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancelWithdrawal(withdrawal._id)}
                  >
                    لغو
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              موجودی کیف پول
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {balance.toLocaleString("fa-IR")} تومان
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              کل دریافتی‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalIncome.toLocaleString("fa-IR")} تومان
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              کل پرداختی‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalExpense.toLocaleString("fa-IR")} تومان
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>تاریخچه تراکنش‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-muted">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-medium">
                        {transaction.description || "تراکنش"}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
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
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getTransactionBadge(transaction.type)}
                    <div
                      className={`text-lg font-bold ${
                        transaction.type === "income"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {(transaction.amount || 0).toLocaleString("fa-IR")} تومان
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>هیچ تراکنشی یافت نشد</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserWallet;
