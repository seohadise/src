"use client";

import React from "react";
import { Wallet, CreditCard, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function PaymentMethodDialog({
  open,
  onOpenChange,
  amount,
  walletBalance,
  onSelectWallet,
  onSelectOnline,
  isLoading,
}) {
  const canPayWithWallet = walletBalance >= amount;
  const formattedAmount = amount?.toLocaleString("fa-IR") || "0";
  const formattedWalletBalance = walletBalance?.toLocaleString("fa-IR") || "0";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center">انتخاب روش پرداخت</DialogTitle>
          <DialogDescription className="text-center">
            مبلغ قابل پرداخت: <span className="font-bold text-primary">{formattedAmount} تومان</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* گزینه کیف پول */}
          <button
            onClick={onSelectWallet}
            disabled={!canPayWithWallet || isLoading}
            className={cn(
              "flex items-center gap-4 p-4 rounded-lg border-2 transition-all",
              canPayWithWallet
                ? "border-primary bg-primary/5 hover:bg-primary/10 cursor-pointer"
                : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
            )}
          >
            <div className={cn(
              "p-3 rounded-full",
              canPayWithWallet ? "bg-primary/10 text-primary" : "bg-gray-200 text-gray-400"
            )}>
              <Wallet className="w-6 h-6" />
            </div>
            <div className="flex-1 text-right">
              <h3 className={cn(
                "font-semibold",
                canPayWithWallet ? "text-gray-900" : "text-gray-400"
              )}>
                پرداخت از کیف پول
              </h3>
              <p className={cn(
                "text-sm",
                canPayWithWallet ? "text-gray-600" : "text-gray-400"
              )}>
                موجودی: {formattedWalletBalance} تومان
              </p>
              {!canPayWithWallet && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  <span>موجودی برای پرداخت کافی نیست</span>
                </div>
              )}
            </div>
            {canPayWithWallet && (
              <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-primary" />
              </div>
            )}
          </button>

          {/* گزینه پرداخت آنلاین */}
          <button
            onClick={onSelectOnline}
            disabled={isLoading}
            className={cn(
              "flex items-center gap-4 p-4 rounded-lg border-2 transition-all",
              "border-blue-500 bg-blue-50 hover:bg-blue-100 cursor-pointer"
            )}
          >
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="flex-1 text-right">
              <h3 className="font-semibold text-gray-900">
                پرداخت آنلاین
              </h3>
              <p className="text-sm text-gray-600">
                پرداخت از طریق درگاه بانکی
              </p>
            </div>
            <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
            </div>
          </button>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            انصراف
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
