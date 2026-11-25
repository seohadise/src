"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Clock, DollarSign, RefreshCw } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import WithdrawalCard from "./withdrawal-card-simple";

const WithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  // فیلترها
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: "all",
  });

  // بررسی اولیه برای debugging
  useEffect(() => {
    console.log("WithdrawalsPage component mounted");
  }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "" && value !== "all") params.append(key, value);
      });

      const response = await axios.get(`/api/admin/withdrawals?${params}`);
      if (response.data.success) {
        setWithdrawals(response.data.data.withdrawals || []);
        setStats(response.data.data.stats || []);
        setPagination(response.data.data.pagination || {});
      } else {
        toast.error(response.data.message || "خطا در دریافت درخواست‌های برداشت");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "خطا در دریافت درخواست‌های برداشت";
      toast.error(errorMessage);
      console.error("Withdrawal fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [filters.page, filters.limit, filters.status]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // ریست صفحه هنگام تغییر فیلتر
    }));
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



  // محاسبه آمار از stats
  const getStatsData = () => {
    const defaultStats = {
      pending: { count: 0, totalAmount: 0 },
      approved: { count: 0, totalAmount: 0 },
      rejected: { count: 0, totalAmount: 0 },
      completed: { count: 0, totalAmount: 0 },
    };

    stats.forEach(stat => {
      if (defaultStats[stat._id]) {
        defaultStats[stat._id] = {
          count: stat.count,
          totalAmount: stat.totalAmount
        };
      }
    });

    return defaultStats;
  };

  const statsData = getStatsData();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت درخواست‌های برداشت</h1>
        <Button onClick={fetchWithdrawals} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          بروزرسانی
        </Button>
      </div>

      {/* آمار کلی */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              در انتظار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statsData.pending.count}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(statsData.pending.totalAmount)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              تایید شده
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statsData.approved.count}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(statsData.approved.totalAmount)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              رد شده
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statsData.rejected.count}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(statsData.rejected.totalAmount)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              تکمیل شده
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsData.completed.count}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(statsData.completed.totalAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* فیلترها */}
      <Card>
        <CardHeader>
          <CardTitle>فیلترها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status">وضعیت</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="همه وضعیت‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="pending">در انتظار</SelectItem>
                  <SelectItem value="approved">تایید شده</SelectItem>
                  <SelectItem value="rejected">رد شده</SelectItem>
                  <SelectItem value="completed">تکمیل شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="limit">تعداد نمایش</Label>
              <Select value={filters.limit.toString()} onValueChange={(value) => handleFilterChange("limit", parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول درخواست‌های برداشت */}
      <Card>
        <CardHeader>
          <CardTitle>لیست درخواست‌های برداشت</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">در حال بارگذاری...</div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              هیچ درخواست برداشتی یافت نشد
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <WithdrawalCard key={withdrawal._id} withdrawal={withdrawal} onUpdate={fetchWithdrawals} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.currentPage === 1}
            onClick={() => handleFilterChange("page", pagination.currentPage - 1)}
          >
            قبلی
          </Button>
          <span className="flex items-center px-4">
            صفحه {pagination.currentPage} از {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => handleFilterChange("page", pagination.currentPage + 1)}
          >
            بعدی
          </Button>
        </div>
      )}
    </div>
  );
};

export default WithdrawalsPage;
