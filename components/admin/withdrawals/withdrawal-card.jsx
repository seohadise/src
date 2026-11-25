"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Eye } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const WithdrawalCard = ({ withdrawal, onUpdate }) => {
  const [status, setStatus] = useState(withdrawal.status);
  const [adminNotes, setAdminNotes] = useState(withdrawal.adminNotes || "");
  const [trackingCode, setTrackingCode] = useState(withdrawal.trackingCode || "");
  const [loading, setLoading] = useState(false);

  const handleStatusUpdate = async () => {
    setLoading(true);
    try {
      const response = await axios.patch("/api/admin/withdrawals", {
        withdrawalId: withdrawal._id,
        status,
        adminNotes,
        trackingCode,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        onUpdate();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "خطا در بروزرسانی درخواست");
    } finally {
      setLoading(false);
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

  const formatCurrency = (amount) => {
    try {
      if (!amount || isNaN(amount)) return "0 تومان";
      return amount.toLocaleString("fa-IR") + " تومان";
    } catch (error) {
      console.error("Error formatting currency:", error);
      return amount + " تومان";
    }
  };

  const formatDate = (date) => {
    try {
      if (!date) return "نامشخص";
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return "نامشخص";
      return dateObj.toLocaleDateString("fa-IR") + " " + dateObj.toLocaleTimeString("fa-IR", {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "نامشخص";
    }
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
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
        <div>
          <span className="text-muted-foreground">تاریخ درخواست: </span>
          <span>{formatDate(withdrawal.createdAt)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">کد پیگیری: </span>
          <span>{withdrawal.trackingCode || "ندارد"}</span>
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

      {/* مدیریت وضعیت */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-1" />
            مدیریت درخواست
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>مدیریت درخواست برداشت</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">وضعیت</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">در انتظار</SelectItem>
                  <SelectItem value="approved">تایید</SelectItem>
                  <SelectItem value="rejected">رد</SelectItem>
                  <SelectItem value="completed">تکمیل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="trackingCode">کد پیگیری</Label>
              <Input
                id="trackingCode"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="کد پیگیری تراکنش"
              />
            </div>

            <div>
              <Label htmlFor="adminNotes">یادداشت مدیر</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="یادداشت یا توضیحات اضافی"
                rows={3}
              />
            </div>

            <Button
              onClick={handleStatusUpdate}
              disabled={loading || status === withdrawal.status}
              className="w-full"
            >
              {loading ? "در حال بروزرسانی..." : "بروزرسانی درخواست"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WithdrawalCard;
