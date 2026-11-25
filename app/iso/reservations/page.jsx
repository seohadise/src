"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, RefreshCw } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const ReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  
  // فیلترها
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: "all",
    itemType: "all",
  });

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "" && value !== "all") params.append(key, value);
      });

      const response = await axios.get(`/api/admin/reservations?${params}`);
      if (response.data.success) {
        setReservations(response.data.data.reservations || []);
        setStats(response.data.data.stats || {});
        setPagination(response.data.data.pagination || {});
      } else {
        toast.error(response.data.message || "خطا در دریافت رزروها");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "خطا در دریافت رزروها";
      toast.error(errorMessage);
      console.error("Reservation fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [filters.page, filters.limit, filters.status, filters.itemType]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };


  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: "در انتظار پرداخت", variant: "secondary" },
      confirmed: { label: "تایید شده", variant: "default" },
      cancelled: { label: "لغو شده", variant: "destructive" },
      completed: { label: "تکمیل شده", variant: "default" },
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getItemTypeBadge = (itemType) => {
    const typeMap = {
      property: { label: "ملک", variant: "default" },
      bus: { label: "اتوبوس", variant: "secondary" },
      food: { label: "آشپزخانه", variant: "outline" },
    };
    
    const typeInfo = typeMap[itemType] || { label: itemType, variant: "secondary" };
    return <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>;
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
      }).format(new Date(date));
    } catch (error) {
      console.error("Error formatting date:", error);
      return "نامشخص";
    }
  };

  const formatDateTime = (date) => {
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
        <h1 className="text-2xl font-bold">مدیریت رزروها</h1>
        <Button onClick={fetchReservations} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          بروزرسانی
        </Button>
      </div>

      {/* آمار کلی */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              کل رزروها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.totalReservations || 0).toLocaleString("fa-IR")}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              رزروهای تایید شده
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(stats.confirmedReservations || 0).toLocaleString("fa-IR")}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              کل درآمد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.totalRevenue || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              میانگین مبلغ رزرو
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Math.round(stats.averageAmount || 0))}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="pending">در انتظار پرداخت</SelectItem>
                <SelectItem value="confirmed">تایید شده</SelectItem>
                <SelectItem value="cancelled">لغو شده</SelectItem>
                <SelectItem value="completed">تکمیل شده</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.itemType} onValueChange={(value) => handleFilterChange("itemType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="نوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="property">ملک</SelectItem>
                <SelectItem value="bus">اتوبوس</SelectItem>
                <SelectItem value="food">آشپزخانه</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setFilters({
                  page: 1,
                  limit: 20,
                  status: "all",
                  itemType: "all",
                });
              }}
            >
              پاک کردن فیلترها
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* جدول رزروها */}
      <Card>
        <CardHeader>
          <CardTitle>لیست رزروها</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">در حال بارگذاری...</div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              هیچ رزرویی یافت نشد
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((reservation) => (
                <div key={reservation._id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">
                          {reservation.itemType === 'property' 
                            ? (reservation.itemId?.name || reservation.itemId?.title || 'ملک نامشخص')
                            : reservation.itemType === 'bus'
                            ? (reservation.itemId?.vehicle?.name 
                                ? `${reservation.itemId.vehicle.name} - ${reservation.itemId.from?.city || ''} به ${reservation.itemId.to?.city || ''}`
                                : reservation.itemId?.company?.name || 'اتوبوس نامشخص')
                            : reservation.itemType === 'food'
                            ? (reservation.itemId?.staff?.chef?.name 
                                ? `آشپزخانه ${reservation.itemId.staff.chef.name}`
                                : 'آشپزخانه نامشخص')
                            : 'آیتم نامشخص'}
                        </h3>
                        {getItemTypeBadge(reservation.itemType)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {reservation.itemId?.address?.city && reservation.itemId?.address?.province
                          ? `${reservation.itemId.address.city}, ${reservation.itemId.address.province}`
                          : reservation.itemType === 'bus' && reservation.itemId?.from?.city && reservation.itemId?.to?.city
                          ? `${reservation.itemId.from.city} - ${reservation.itemId.to.city}`
                          : "آدرس نامشخص"}
                      </p>
                    </div>
                    {getStatusBadge(reservation.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">مشتری: </span>
                      <span>{reservation.user?.fullName || "نامشخص"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">مالک: </span>
                      <span>{reservation.targetUser?.fullName || "نامشخص"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">تعداد نفرات: </span>
                      <span>
                        {reservation.guests 
                          ? `${reservation.guests.adults || 0} بزرگسال${reservation.guests.children ? `, ${reservation.guests.children} کودک` : ''}`
                          : "نامشخص"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">مبلغ: </span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(reservation.amount || 0)}
                      </span>
                    </div>
                  </div>
                  
                  {reservation.itemType === "property" && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">تاریخ ورود: </span>
                        <span>{formatDate(reservation.checkInDate)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">تاریخ خروج: </span>
                        <span>{formatDate(reservation.checkOutDate)}</span>
                      </div>
                    </div>
                  )}
                  
                  {reservation.itemType === "bus" && reservation.date && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">تاریخ سفر: </span>
                      <span>{formatDate(reservation.date)}</span>
                    </div>
                  )}
                  
                  {reservation.itemType === "food" && reservation.dates && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">تاریخ‌های سفارش: </span>
                      <span>{reservation.dates.map(d => formatDate(d)).join(", ")}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">
                      تاریخ ثبت: {formatDateTime(reservation.createdAt)}
                    </span>
                    {reservation.totalPrice && (
                      <span className="text-muted-foreground">
                        قیمت کل: {formatCurrency(reservation.totalPrice)}
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

export default ReservationsPage;
