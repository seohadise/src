"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, Filter, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { faIR } from "date-fns/locale";
import axios from "axios";
import { toast } from "sonner";

const CommissionsPage = () => {
  const [commissions, setCommissions] = useState([]);
  const [stats, setStats] = useState({});
  const [statusStats, setStatusStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  
  // فیلترها - پیش‌فرض فقط کارمزدهای تایید شده (collected)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: "collected", // فقط کارمزدهای تایید شده (پس از تایید رزرو)
    startDate: "",
    endDate: "",
  });

  const [dateRange, setDateRange] = useState({
    from: null,
    to: null,
  });

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "" && value !== "all") params.append(key, value);
      });

      const response = await axios.get(`/api/admin/commissions?${params}`);
      if (response.data.success) {
        setCommissions(response.data.data.commissions || []);
        setStats(response.data.data.stats || {});
        setStatusStats(response.data.data.statusStats || []);
        setPagination(response.data.data.pagination || {});
      } else {
        toast.error(response.data.message || "خطا در دریافت کارمزدها");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "خطا در دریافت کارمزدها";
      toast.error(errorMessage);
      console.error("Commission fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [filters.page, filters.limit, filters.status, filters.startDate, filters.endDate]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // ریست صفحه هنگام تغییر فیلتر
    }));
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setFilters(prev => ({
        ...prev,
        startDate: range.from.toISOString(),
        endDate: range.to.toISOString(),
        page: 1,
      }));
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: "در انتظار", variant: "secondary" },
      collected: { label: "دریافت شده", variant: "default" },
      refunded: { label: "بازگردانده شده", variant: "destructive" },
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " تومان";
  };

  const formatDate = (date) => {
    try {
      if (!date) return "نامشخص";
      return new Intl.DateTimeFormat("fa-IR", {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(date));
    } catch (error) {
      console.error("Error formatting date:", error);
      return "نامشخص";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت کارمزدها</h1>
        <Button onClick={fetchCommissions} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          بروزرسانی
        </Button>
      </div>

      {/* آمار کلی */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              کل کارمزدهای دریافتی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalCommissions || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              تعداد تراکنش‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.totalTransactions || 0).toLocaleString("fa-IR")}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              میانگین کارمزد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Math.round(stats.averageCommission || 0))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              کل مبلغ رزروها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalBaseAmount || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* فیلترها */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            فیلترها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="pending">در انتظار</SelectItem>
                <SelectItem value="collected">دریافت شده</SelectItem>
                <SelectItem value="refunded">بازگردانده شده</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "PPP", { locale: faIR })} -{" "}
                        {format(dateRange.to, "PPP", { locale: faIR })}
                      </>
                    ) : (
                      format(dateRange.from, "PPP", { locale: faIR })
                    )
                  ) : (
                    "انتخاب بازه تاریخ"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              onClick={() => {
                setFilters({
                  page: 1,
                  limit: 20,
                  status: "all",
                  startDate: "",
                  endDate: "",
                });
                setDateRange({ from: null, to: null });
              }}
            >
              پاک کردن فیلترها
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* جدول کارمزدها */}
      <Card>
        <CardHeader>
          <CardTitle>لیست کارمزدها</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">در حال بارگذاری...</div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              هیچ کارمزدی یافت نشد
            </div>
          ) : (
            <div className="space-y-4">
              {commissions.map((commission) => (
                <div key={commission._id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium">
                        {commission.itemType === 'property' 
                          ? (commission.property?.name || commission.item?.name || 'ملک نامشخص')
                          : commission.itemType === 'bus'
                          ? (commission.item?.vehicle?.name 
                              ? `${commission.item.vehicle.name} - ${commission.item?.from?.city || ''} به ${commission.item?.to?.city || ''}`
                              : commission.item?.company?.name || 'اتوبوس نامشخص')
                          : commission.itemType === 'food'
                          ? (commission.item?.staff?.chef?.name 
                              ? `آشپزخانه ${commission.item.staff.chef.name}`
                              : commission.item?.foods?.[0] || 'آشپزخانه نامشخص')
                          : `${commission.itemType || 'آیتم'} - ${commission.itemId || 'نامشخص'}`}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {(() => {
                          // برای property
                          if (commission.property?.address?.city && commission.property?.address?.province) {
                            return `${commission.property.address.city}, ${commission.property.address.province}`;
                          }
                          // برای item جدید
                          if (commission.item?.address?.city && commission.item?.address?.province) {
                            return `${commission.item.address.city}, ${commission.item.address.province}`;
                          }
                          // برای bus
                          if (commission.item?.from?.city && commission.item?.to?.city) {
                            return `${commission.item.from.city} به ${commission.item.to.city}`;
                          }
                          return "آدرس نامشخص";
                        })()}
                      </p>
                    </div>
                    {getStatusBadge(commission.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">نوع: </span>
                      <span>
                        {commission.itemType === 'property' ? 'ملک' :
                         commission.itemType === 'bus' ? 'اتوبوس' :
                         commission.itemType === 'food' ? 'آشپزخانه' : 'نامشخص'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">مالک: </span>
                      <span>{commission.user?.fullName || commission.owner?.fullName || "نامشخص"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">مشتری: </span>
                      <span>{commission.targetUser?.fullName || commission.customer?.fullName || "نامشخص"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">مبلغ پایه: </span>
                      <span>{formatCurrency(commission.baseAmount || 0)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">کارمزد: </span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(commission.commissionAmount || 0)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      تاریخ: {formatDate(commission.createdAt)}
                    </span>
                    {commission.paymentTrackingCode && (
                      <span className="text-muted-foreground">
                        کد پیگیری: {commission.paymentTrackingCode}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.currentPage === 1}
            onClick={() => handleFilterChange("page", pagination.currentPage - 1)}
          >
            قبلی
          </Button>
          <span className="text-sm text-muted-foreground">
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

export default CommissionsPage;
