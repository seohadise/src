"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, MapPin, DollarSign, Users, Clock } from "lucide-react";

const getStatusBadge = (status) => {
  const styles = {
    pending: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
    confirmed: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    cancelled: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
    completed: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  };

  const texts = {
    pending: "در انتظار تایید",
    confirmed: "تایید شده",
    cancelled: "لغو شده",
    completed: "تکمیل شده",
  };

  return (
    <Badge variant="outline" className={styles[status]}>
      {texts[status]}
    </Badge>
  );
};

const getItemTypeLabel = (type) => {
  const labels = {
    property: "رزرو ملک",
    bus: "رزرو اتوبوس",
    food: "سفارش غذا",
  };
  return labels[type] || "نامشخص";
};

const TripCalendar = ({ reservations = [] }) => {
  const [selectedDate, setSelectedDate] = useState(null);

  // Helper function to get local date key (YYYY-MM-DD) without timezone conversion
  const getLocalDateKey = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Create a map of dates with reservations
  const reservationDates = {};
  reservations.forEach((reservation) => {
    if (reservation.itemType === "property" && reservation.checkInDate) {
      const checkIn = new Date(reservation.checkInDate);
      const checkOut = reservation.checkOutDate ? new Date(reservation.checkOutDate) : checkIn;
      
      // Add all dates between checkIn and checkOut (excluding checkOut day)
      let currentDate = new Date(checkIn);
      while (currentDate < checkOut) {
        const dateKey = getLocalDateKey(currentDate);
        if (!reservationDates[dateKey]) {
          reservationDates[dateKey] = [];
        }
        reservationDates[dateKey].push(reservation);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (reservation.itemType === "bus" && reservation.date) {
      const dateKey = getLocalDateKey(reservation.date);
      if (!reservationDates[dateKey]) {
        reservationDates[dateKey] = [];
      }
      reservationDates[dateKey].push(reservation);
    } else if (reservation.itemType === "food") {
      // Check for dates array first
      if (reservation.dates && reservation.dates.length > 0) {
        reservation.dates.forEach((date) => {
          const dateKey = getLocalDateKey(date);
          if (!reservationDates[dateKey]) {
            reservationDates[dateKey] = [];
          }
          reservationDates[dateKey].push(reservation);
        });
      } 
      // Fallback to single date field if dates array is empty
      else if (reservation.date) {
        const dateKey = getLocalDateKey(reservation.date);
        if (!reservationDates[dateKey]) {
          reservationDates[dateKey] = [];
        }
        reservationDates[dateKey].push(reservation);
      }
      // Also check createdAt as last resort for food orders without specific dates
      else if (reservation.createdAt) {
        const dateKey = getLocalDateKey(reservation.createdAt);
        if (!reservationDates[dateKey]) {
          reservationDates[dateKey] = [];
        }
        reservationDates[dateKey].push(reservation);
      }
    }
  });

  // Get reservations for selected date
  const selectedDateReservations = selectedDate
    ? reservationDates[getLocalDateKey(selectedDate)] || []
    : [];

  // Modifier for calendar to highlight dates with reservations
  const modifiers = {
    hasReservation: Object.keys(reservationDates).map(dateStr => {
      // Parse date string (YYYY-MM-DD) and create local date
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }),
  };

  const modifiersClassNames = {
    hasReservation: "bg-blue-100 text-blue-900 font-bold",
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarIcon className="w-6 h-6" />
          تقویم سفرهای من
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>تقویم رزروها</CardTitle>
            <p className="text-sm text-muted-foreground">
              تاریخ‌های دارای رزرو با رنگ آبی مشخص شده‌اند
            </p>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Selected Date Info */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? `رزروهای ${new Date(selectedDate).toLocaleDateString("fa-IR")}`
                : "اطلاعات رزرو"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              selectedDateReservations.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateReservations.map((reservation) => (
                    <div
                      key={reservation._id}
                      className="p-3 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {getItemTypeLabel(reservation.itemType)}
                        </span>
                        {getStatusBadge(reservation.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-bold text-green-600">
                          {(reservation.amount || 0).toLocaleString("fa-IR")} تومان
                        </span>
                      </div>
                      {reservation.guests && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>
                            {reservation.guests.adults || 0} بزرگسال،{" "}
                            {reservation.guests.children || 0} کودک
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>رزروی برای این تاریخ وجود ندارد</p>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>یک تاریخ را انتخاب کنید</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Reservations */}
      <Card>
        <CardHeader>
          <CardTitle>رزروهای آینده</CardTitle>
        </CardHeader>
        <CardContent>
          {reservations && reservations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reservations
                .filter((r) => {
                  // Filter upcoming reservations
                  const now = new Date();
                  now.setHours(0, 0, 0, 0);
                  if (r.itemType === "property" && r.checkInDate) {
                    return new Date(r.checkInDate) >= now;
                  } else if (r.itemType === "bus" && r.date) {
                    return new Date(r.date) >= now;
                  } else if (r.itemType === "food") {
                    // Check dates array first
                    if (r.dates && r.dates.length > 0) {
                      return r.dates.some((d) => new Date(d) >= now);
                    }
                    // Fallback to single date field
                    else if (r.date) {
                      return new Date(r.date) >= now;
                    }
                    // Fallback to createdAt - show if created within last 30 days
                    else if (r.createdAt) {
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      return new Date(r.createdAt) >= thirtyDaysAgo;
                    }
                  }
                  return false;
                })
                .slice(0, 6)
                .map((reservation) => (
                  <div
                    key={reservation._id}
                    className="p-4 border rounded-lg space-y-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {getItemTypeLabel(reservation.itemType)}
                      </span>
                      {getStatusBadge(reservation.status)}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarIcon className="w-4 h-4" />
                        <span>
                          {reservation.itemType === "property" && reservation.checkInDate
                            ? `${new Date(reservation.checkInDate).toLocaleDateString("fa-IR")} - ${new Date(reservation.checkOutDate || reservation.checkInDate).toLocaleDateString("fa-IR")}`
                            : reservation.itemType === "bus" && reservation.date
                            ? new Date(reservation.date).toLocaleDateString("fa-IR")
                            : reservation.itemType === "food"
                            ? reservation.dates && reservation.dates.length > 0
                              ? `${reservation.dates.length} روز - ${new Date(reservation.dates[0]).toLocaleDateString("fa-IR")}`
                              : reservation.date
                              ? new Date(reservation.date).toLocaleDateString("fa-IR")
                              : reservation.createdAt
                              ? new Date(reservation.createdAt).toLocaleDateString("fa-IR")
                              : "نامشخص"
                            : "نامشخص"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-bold text-green-600">
                          {(reservation.amount || 0).toLocaleString("fa-IR")} تومان
                        </span>
                      </div>

                      {reservation.guests && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>
                            {reservation.guests.adults || 0} بزرگسال،{" "}
                            {reservation.guests.children || 0} کودک
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>رزروی برای نمایش وجود ندارد</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TripCalendar;
