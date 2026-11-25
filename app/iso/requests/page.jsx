"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RequestActions from "@/components/admin/request-actions";
import {
  Building,
  Bus as BusIcon,
  UtensilsCrossed,
  Users,
  RefreshCw,
  CheckCircle,
  XCircle
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const RequestsPage = () => {
  const [pendingProperties, setPendingProperties] = useState([]);
  const [pendingBuses, setPendingBuses] = useState([]);
  const [pendingFoods, setPendingFoods] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [propertiesRes, busesRes, foodsRes, usersRes] = await Promise.all([
        axios.get('/api/admin/properties?status=pending'),
        axios.get('/api/admin/buses?status=pending'),
        axios.get('/api/admin/foods?status=pending'),
        axios.get('/api/admin/users?isVerified=false')
      ]);

      if (propertiesRes.data.success) {
        setPendingProperties(propertiesRes.data.data || []);
      } else {
        console.error("Properties API error:", propertiesRes.data.message);
      }

      if (busesRes.data.success) {
        setPendingBuses(busesRes.data.data || []);
      } else {
        console.error("Buses API error:", busesRes.data.message);
      }

      if (foodsRes.data.success) {
        setPendingFoods(foodsRes.data.data || []);
      } else {
        console.error("Foods API error:", foodsRes.data.message);
      }

      if (usersRes.data.success) {
        setPendingUsers(usersRes.data.data || []);
      } else {
        console.error("Users API error:", usersRes.data.message);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("خطا در دریافت اطلاعات: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (date) => {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(date));
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
      approved: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
      rejected: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
    };

    const texts = {
      pending: "در انتظار بررسی",
      approved: "تایید شده",
      rejected: "رد شده",
    };

    return (
      <Badge variant="outline" className={styles[status]}>
        {texts[status]}
      </Badge>
    );
  };

  const RequestCard = ({ item, type, icon: Icon }) => (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{item.name || item.vehicle?.name || `آشپزخانه ${item.staff?.chef?.name}`}</span>
          </div>
          {getStatusBadge(item.status)}
        </div>
        <div className="text-sm text-muted-foreground">
          <p>مالک: {item.owner?.fullName}</p>
          <p>ایمیل: {item.owner?.email}</p>
          <p>تلفن: {item.owner?.number}</p>
          <p>تاریخ ثبت: {formatDate(item.createdAt)}</p>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <RequestActions item={item} type={type} onUpdate={fetchData} />
      </CardContent>
    </Card>
  );

  const UserCard = ({ user }) => {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUserAction = async (action) => {
      setIsUpdating(true);
      try {
        const response = await axios.patch(`/api/admin/users/${user._id}/status`, {
          action
        });

        if (response.data.success) {
          toast.success(response.data.message);
          fetchData(); // بروزرسانی لیست
        } else {
          toast.error(response.data.message || 'خطا در انجام عملیات');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'خطا در بروزرسانی وضعیت');
      } finally {
        setIsUpdating(false);
      }
    };

    return (
      <Card className="overflow-hidden">
        <CardHeader className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">{user.fullName}</span>
            </div>
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
              تایید نشده
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>نوع کاربر: {
              user.type === 'property-owner' ? 'مالک ملک' :
              user.type === 'bus-owner' ? 'مالک اتوبوس' :
              user.type === 'food-owner' ? 'مالک آشپزخانه' : 'مشتری'
            }</p>
            <p>ایمیل: {user.email}</p>
            <p>تلفن: {user.number}</p>
            <p>تاریخ ثبت نام: {formatDate(user.createdAt)}</p>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              disabled={isUpdating}
              onClick={() => handleUserAction('approve')}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              {isUpdating ? 'در حال تایید...' : 'تایید کاربر'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              disabled={isUpdating}
              onClick={() => handleUserAction('reject')}
            >
              <XCircle className="h-4 w-4 mr-1" />
              {isUpdating ? 'در حال رد...' : 'رد کاربر'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">درخواست‌های ثبت نام</h1>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Badge variant="outline">
              املاک: {pendingProperties.length}
            </Badge>
            <Badge variant="outline">
              اتوبوس‌ها: {pendingBuses.length}
            </Badge>
            <Badge variant="outline">
              غذاها: {pendingFoods.length}
            </Badge>
            <Badge variant="outline">
              کاربران: {pendingUsers.length}
            </Badge>
          </div>
          <Button onClick={fetchData} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            بروزرسانی
          </Button>
        </div>
      </div>

      <Tabs defaultValue="properties" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="properties" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            املاک ({pendingProperties.length})
          </TabsTrigger>
          <TabsTrigger value="buses" className="flex items-center gap-2">
            <BusIcon className="h-4 w-4" />
            اتوبوس‌ها ({pendingBuses.length})
          </TabsTrigger>
          <TabsTrigger value="foods" className="flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4" />
            غذاها ({pendingFoods.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            کاربران ({pendingUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">در حال بارگذاری...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingProperties.length > 0 ? (
                pendingProperties.map((property) => (
                  <RequestCard
                    key={property._id}
                    item={property}
                    type="property"
                    icon={Building}
                  />
                ))
              ) : (
                <p className="col-span-full text-center text-muted-foreground py-8">
                  هیچ درخواست ملکی در انتظار بررسی نیست
                </p>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="buses" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingBuses.length > 0 ? (
              pendingBuses.map((bus) => (
                <RequestCard 
                  key={bus._id} 
                  item={bus} 
                  type="bus" 
                  icon={BusIcon} 
                />
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground py-8">
                هیچ درخواست اتوبوسی در انتظار بررسی نیست
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="foods" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingFoods.length > 0 ? (
              pendingFoods.map((food) => (
                <RequestCard 
                  key={food._id} 
                  item={food} 
                  type="food" 
                  icon={UtensilsCrossed} 
                />
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground py-8">
                هیچ درخواست غذای خانگی در انتظار بررسی نیست
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingUsers.length > 0 ? (
              pendingUsers.map((user) => (
                <UserCard key={user._id} user={user} />
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground py-8">
                هیچ کاربر جدیدی در انتظار تایید نیست
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RequestsPage;
