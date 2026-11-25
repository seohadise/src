"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { toast } from "sonner";

const WithdrawalCardSimple = ({ withdrawal, onUpdate }) => {
  const [loading, setLoading] = useState(false);

  const handleStatusUpdate = async (newStatus) => {
    setLoading(true);
    try {
      const response = await axios.patch("/api/admin/withdrawals", {
        withdrawalId: withdrawal._id,
        status: newStatus,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        onUpdate();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error details:", error);
      toast.error(error.response?.data?.message || "خطا در بروزرسانی درخواست");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    try {
      if (!amount || isNaN(amount)) return "0 تومان";
      return amount.toLocaleString("fa-IR") + " تومان";
    } catch (error) {
      return amount + " تومان";
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: "در انتظار", color: "bg-yellow-500/10 text-yellow-500" },
      approved: { label: "تایید شده", color: "bg-blue-500/10 text-blue-500" },
      rejected: { label: "رد شده", color: "bg-red-500/10 text-red-500" },
      completed: { label: "تکمیل شده", color: "bg-green-500/10 text-green-500" },
    };
    
    const statusInfo = statusMap[status] || { label: status, color: "bg-gray-500/10 text-gray-500" };
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-medium">{withdrawal.user?.fullName || "نامشخص"}</h3>
          <p className="text-sm text-muted-foreground">
            {withdrawal.user?.email} | {withdrawal.user?.number}
          </p>
        </div>
        {getStatusBadge(withdrawal.status)}
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">مبلغ: </span>
          <span className="font-medium text-green-600">
            {formatCurrency(withdrawal.amount)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">نوع کاربر: </span>
          <span>{withdrawal.user?.type === 'property-owner' ? 'مالک ملک' : 
                  withdrawal.user?.type === 'bus-owner' ? 'مالک اتوبوس' :
                  withdrawal.user?.type === 'food-owner' ? 'مالک آشپزخانه' : 'کاربر عادی'}</span>
        </div>
      </div>

      {/* اطلاعات بانکی */}
      <div className="bg-muted/50 rounded-lg p-3">
        <h4 className="font-medium mb-2">اطلاعات بانکی</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>شبا: {withdrawal.bankInfo?.shebaNumber}</div>
          <div>حساب: {withdrawal.bankInfo?.accountNumber}</div>
          <div>کارت: {withdrawal.bankInfo?.cardNumber}</div>
          <div>نام صاحب حساب: {withdrawal.bankInfo?.ownerName}</div>
        </div>
      </div>

      {/* دکمه‌های مدیریت */}
      {withdrawal.status === 'pending' && (
        <div className="flex gap-2">
          <Button
            onClick={() => handleStatusUpdate('approved')}
            disabled={loading}
            size="sm"
            className="flex-1"
          >
            {loading ? "..." : "تایید"}
          </Button>
          <Button
            onClick={() => handleStatusUpdate('rejected')}
            disabled={loading}
            variant="destructive"
            size="sm"
            className="flex-1"
          >
            {loading ? "..." : "رد"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default WithdrawalCardSimple;
