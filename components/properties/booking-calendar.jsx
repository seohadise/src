"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Calendar } from "../ui/calendar";
import isIranianHoliday from "@/lib/iran-holidays";

const persianDayOfWeek = (date) => {
  const jsDay = date.getDay();
  return jsDay === 6 ? 0 : jsDay + 1;
};

const calculateNightPrice = (date, pricing, settings) => {
  if (!pricing) return 0;
  let price;
  if (settings && typeof settings.customPrice === "number" && settings.customPrice > 0) {
    price = settings.customPrice;
  } else if (settings && settings.peak && pricing.peakPrice) {
    price = pricing.peakPrice;
  } else {
    const pDay = persianDayOfWeek(date);
    if (pDay === 6) price = pricing.fridayPrice || pricing.regularPrice || 0;
    else if (pDay === 5) price = pricing.thursdayPrice || pricing.regularPrice || 0;
    else if (pDay === 4) price = pricing.wednesdayPrice || pricing.regularPrice || 0;
    else price = pricing.regularPrice || 0;
  }
  const discount = settings?.lastMinuteDiscount;
  if (typeof discount === "number" && discount > 0 && discount <= 100) {
    price = price - Math.round((price * discount) / 100);
  }
  return price;
};

const formatPrice = (price) => {
  if (!price && price !== 0) return "";
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)} میلیون`;
  }
  return `${(price / 1000).toFixed(0)} هزار`;
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const BookingCalendar = ({ property, checkInDate, checkOutDate, onChange }) => {
  const [monthsToShow, setMonthsToShow] = useState(2);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfDay(checkInDate || new Date()));

  useEffect(() => {
    const updateMonths = () => setMonthsToShow(window.innerWidth < 640 ? 1 : 2);
    updateMonths();
    window.addEventListener("resize", updateMonths);
    return () => window.removeEventListener("resize", updateMonths);
  }, []);

  const today = startOfDay(new Date());
  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  const availStart = property.availabilityStartDate ? startOfDay(property.availabilityStartDate) : null;
  const availEnd = property.availabilityEndDate ? startOfDay(property.availabilityEndDate) : null;

  const calendarMap = useMemo(() => {
    const map = new Map();
    (property.calendarSettings || []).forEach((item) => {
      map.set(new Date(item.date).toDateString(), item);
    });
    return map;
  }, [property.calendarSettings]);

  const reservedRanges = useMemo(
    () =>
      (property.reservedDateRanges || []).map((r) => ({
        start: startOfDay(r.checkInDate),
        end: startOfDay(r.checkOutDate),
      })),
    [property.reservedDateRanges]
  );

  const getSettings = useCallback((date) => calendarMap.get(date.toDateString()), [calendarMap]);

  const isBlocked = useCallback((date) => {
    const s = getSettings(date);
    return !!(s && (s.blocked || s.available === false));
  }, [getSettings]);

  const isReserved = useCallback((date) => {
    const d = startOfDay(date);
    return reservedRanges.some((r) => d >= r.start && d < r.end);
  }, [reservedRanges]);

  const isNightAvailable = useCallback((date) => {
    const d = startOfDay(date);
    if (d < today || d > maxDate) return false;
    if (availStart && d < availStart) return false;
    if (availEnd && d >= availEnd) return false;
    return !isBlocked(d) && !isReserved(d);
  }, [today, maxDate, availStart, availEnd, isBlocked, isReserved]);

  const isRangeAvailable = useCallback((from, to) => {
    const current = startOfDay(from);
    const end = startOfDay(to);
    while (current < end) {
      if (!isNightAvailable(current)) return false;
      current.setDate(current.getDate() + 1);
    }
    return true;
  }, [isNightAvailable]);

  const pickingCheckOut = !!checkInDate && !checkOutDate;

  const isDayDisabled = (date) => {
    const d = startOfDay(date);
    if (pickingCheckOut && d > startOfDay(checkInDate) && isRangeAvailable(checkInDate, d)) {
      return false;
    }
    return !isNightAvailable(d);
  };

  const handleDayClick = (date) => {
    const d = startOfDay(date);
    if (!checkInDate || checkOutDate || d <= startOfDay(checkInDate) || !isRangeAvailable(checkInDate, d)) {
      onChange({ checkInDate: d, checkOutDate: null });
      return;
    }
    onChange({ checkInDate, checkOutDate: d });
  };

  const getDayPrice = (date) => calculateNightPrice(date, property.pricing, getSettings(date));

  const selectedRange = { from: checkInDate || undefined, to: checkOutDate || undefined };

  return (
    <div className="space-y-3">
      <div className="rounded-xl p-2 sm:p-4 overflow-x-auto bg-gradient-to-b from-slate-50 to-white border-2 border-slate-100">
        <style>{`
          .booking-calendar { min-width: ${monthsToShow * 300}px !important; width: auto !important; }
          .booking-calendar table { width: 100% !important; border-collapse: separate !important; border-spacing: 0 !important; }
          .booking-calendar .rdp-weekdays_row { display: flex !important; gap: 2px !important; margin-bottom: 4px !important; padding: 0 1px !important; }
          .booking-calendar .rdp-weekday { width: 38px !important; min-width: 38px !important; flex: 0 0 38px !important; text-align: center !important; padding: 3px 0 !important; font-size: 10px !important; font-weight: 700 !important; color: #475569 !important; }
          .booking-calendar .rdp-week_row { display: flex !important; gap: 2px !important; margin-bottom: 2px !important; width: auto !important; padding: 0 1px !important; }
          .booking-calendar .rdp-day_cell { width: 38px !important; min-width: 38px !important; height: 44px !important; padding: 0 !important; flex: 0 0 38px !important; }
          .booking-calendar .rdp-day_btn {
            width: 38px !important; height: 44px !important;
            display: flex !important; flex-direction: column !important;
            align-items: center !important; justify-content: flex-start !important;
            padding: 4px 1px 2px !important; gap: 2px !important;
            border-radius: 8px !important; border: 1px solid #bfdbfe !important;
            background: #eff6ff !important; transition: all 0.15s ease !important;
            font-size: 12px !important; font-weight: 700 !important;
            line-height: 1 !important; overflow: hidden !important;
          }
          .booking-calendar .rdp-day_btn:hover { border-color: #3b82f6 !important; box-shadow: 0 2px 6px rgba(59,130,246,0.2) !important; }
          .booking-calendar .rdp-day_instant .rdp-day_btn { background: #d1fae5 !important; border-color: #34d399 !important; }
          .booking-calendar .rdp-day_peak .rdp-day_btn { background: #fef3c7 !important; border-color: #fbbf24 !important; }
          .booking-calendar .rdp-day_custom .rdp-day_btn { background: #dbeafe !important; border-color: #60a5fa !important; }
          .booking-calendar .rdp-day_unavailable .rdp-day_btn { background: #fee2e2 !important; border-color: #fca5a5 !important; opacity: 0.7 !important; }
          .booking-calendar .rdp-day_range_middle .rdp-day_btn { background: #bfdbfe !important; border-color: #93c5fd !important; border-radius: 4px !important; }
          .booking-calendar .rdp-day_selected .rdp-day_btn,
          .booking-calendar .rdp-day_range_start .rdp-day_btn,
          .booking-calendar .rdp-day_range_end .rdp-day_btn { background: #2563eb !important; border-color: #2563eb !important; color: #fff !important; box-shadow: 0 2px 8px rgba(37,99,235,0.3) !important; }
          .booking-calendar .rdp-day_selected .rdp-day_btn span,
          .booking-calendar .rdp-day_range_start .rdp-day_btn span,
          .booking-calendar .rdp-day_range_end .rdp-day_btn span { color: #fff !important; background: transparent !important; }
          .booking-calendar .rdp-day_selected.rdp-day_range_middle .rdp-day_btn { background: #bfdbfe !important; border-color: #93c5fd !important; color: #1e3a8a !important; box-shadow: none !important; border-radius: 4px !important; }
          .booking-calendar .rdp-day_selected.rdp-day_range_middle .rdp-day_btn span { color: #1e3a8a !important; }
          .booking-calendar .rdp-day_outside { opacity: 0.3 !important; }
          .booking-calendar .rdp-day_outside .rdp-day_btn { background: #f8fafc !important; border-color: #f1f5f9 !important; }
          .booking-calendar .rdp-day_disabled .rdp-day_btn { opacity: 0.35 !important; background: #f8fafc !important; border-color: #f1f5f9 !important; cursor: not-allowed !important; }
          .booking-calendar .rdp-day_disabled.rdp-day_unavailable .rdp-day_btn { opacity: 0.6 !important; background: #fee2e2 !important; border-color: #fecaca !important; }
        `}</style>
        <Calendar
          mode="range"
          selected={selectedRange}
          onSelect={(_, day, modifiers) => {
            if (!modifiers.disabled) handleDayClick(day);
          }}
          numberOfMonths={monthsToShow}
          className="rounded-lg booking-calendar"
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          startMonth={today}
          endMonth={maxDate}
          disabled={isDayDisabled}
          weekdayClassName="rdp-weekday"
          weekdaysClassName="rdp-weekdays_row"
          weekClassName="rdp-week_row"
          dayClassName="rdp-day_cell"
          dayButtonClassName="rdp-day_btn"
          outsideClassName="rdp-day_outside"
          disabledClassName="rdp-day_disabled"
          selectedClassName="rdp-day_selected"
          rangeMiddleClassName="rdp-day_range_middle"
          rangeStartClassName="rdp-day_range_start"
          rangeEndClassName="rdp-day_range_end"
          modifiers={{
            unavailable: (date) => {
              const d = startOfDay(date);
              return d >= today && (isBlocked(d) || isReserved(d));
            },
            instant: (date) => !!getSettings(date)?.instantBooking,
            peak: (date) => !!getSettings(date)?.peak,
            customPrice: (date) => !!getSettings(date)?.customPrice,
            weekend: (date) => persianDayOfWeek(date) === 6,
            holiday: (date) => isIranianHoliday(date) !== null,
          }}
          modifiersClassNames={{
            unavailable: "rdp-day_unavailable",
            instant: "rdp-day_instant",
            peak: "rdp-day_peak",
            customPrice: "rdp-day_custom",
            weekend: "[&>button]:text-red-600",
            holiday: "[&>button]:text-red-600",
          }}
          components={{
            DayButton: ({ day, modifiers, children, className, ...props }) => {
              const date = day?.date || day;
              const isUnavailable = modifiers?.unavailable;
              const showPrice = !modifiers?.outside && !isUnavailable && isNightAvailable(date);
              const price = showPrice ? getDayPrice(date) : 0;
              return (
                <button className={className} {...props}>
                  <span className="text-xs font-bold leading-none">{children}</span>
                  {showPrice && price > 0 && (
                    <span
                      className={`text-[8px] leading-none px-0.5 rounded font-medium ${
                        modifiers?.customPrice ? "bg-blue-300 text-blue-900" :
                        modifiers?.peak ? "bg-amber-300 text-amber-900" :
                        modifiers?.instant ? "bg-green-300 text-green-900" :
                        "bg-blue-200 text-blue-700"
                      }`}
                    >
                      {formatPrice(price)}
                    </span>
                  )}
                  {isUnavailable && !modifiers?.outside && (
                    <span className="text-[8px] leading-none text-red-600 font-bold">پر</span>
                  )}
                </button>
              );
            },
          }}
        />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {!checkInDate
          ? "تاریخ ورود را انتخاب کنید"
          : !checkOutDate
            ? "حالا تاریخ خروج را انتخاب کنید"
            : "برای تغییر، دوباره روی تاریخ ورود کلیک کنید"}
      </p>

      <div className="flex flex-wrap gap-3 text-xs bg-slate-50 rounded-lg p-3 border border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-blue-300 bg-blue-100"></div>
          <span>موجود</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-green-400 bg-green-100"></div>
          <span>رزرو سریع</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-amber-400 bg-amber-100"></div>
          <span>روز پیک</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-red-400 bg-red-100"></div>
          <span>پر / غیرقابل رزرو</span>
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;
