"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Calendar } from "../ui/calendar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { formatDateInPersian } from "@/lib/date";
import isIranianHoliday from "@/lib/iran-holidays";
import { X, Calendar as CalendarIcon, DollarSign, Zap, Lock, TrendingUp } from "lucide-react";

// Get day of week: 0=Saturday(شنبه), 1=Sunday, ..., 6=Friday(جمعه) in JS getDay()
// JS: 0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday
// We need: Saturday=0, Sunday=1, Monday=2, Tuesday=3, Wednesday=4, Thursday=5, Friday=6
const persianDayOfWeek = (date) => {
  const jsDay = date.getDay();
  // JS: Sat=6, Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5
  // Persian: Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6
  return jsDay === 6 ? 0 : jsDay + 1;
};

// Calculate price for a date based on pricing config
const calculateDayPrice = (date, pricing) => {
  if (!pricing) return 0;
  const pDay = persianDayOfWeek(date);
  // 0=شنبه, 1=یکشنبه, 2=دوشنبه, 3=سه‌شنبه, 4=چهارشنبه, 5=پنج‌شنبه, 6=جمعه
  if (pDay === 6) return pricing.fridayPrice || pricing.regularPrice || 0;
  if (pDay === 5) return pricing.thursdayPrice || pricing.regularPrice || 0;
  if (pDay === 4) return pricing.wednesdayPrice || pricing.regularPrice || 0;
  // شنبه تا سه‌شنبه
  return pricing.regularPrice || 0;
};

const formatPrice = (price) => {
  if (!price && price !== 0) return "";
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)} میلیون`;
  }
  return `${(price / 1000).toFixed(0)} هزار`;
};

export const addAvailabilityRangeToCalendar = (value, onChange, startDate, endDate) => {
  if (!startDate || !endDate) return;
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  if (start > end) return;

  const newSettings = [...value];
  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toDateString();
    const existingIndex = newSettings.findIndex(
      item => new Date(item.date).toDateString() === dateStr
    );
    if (existingIndex < 0) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, "0");
      const d = String(current.getDate()).padStart(2, "0");
      newSettings.push({
        date: `${y}-${m}-${d}`,
        instantBooking: false,
        lastMinuteDiscount: 0,
        blocked: false,
        customPrice: undefined,
        minimumNights: undefined,
        available: true,
        peak: false,
      });
    }
    current.setDate(current.getDate() + 1);
  }
  onChange(newSettings);
};

const UnifiedCalendarManager = ({ value = [], onChange, pricing = null, availabilityStartDate = null, availabilityEndDate = null }) => {
  const [selectedRange, setSelectedRange] = useState(undefined);
  const [monthsToShow, setMonthsToShow] = useState(2);
  const [rangePrice, setRangePrice] = useState("");
  const [rangePeak, setRangePeak] = useState(false);
  const [rangeInstant, setRangeInstant] = useState(false);
  const [rangeBlocked, setRangeBlocked] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Convert value to Map for quick lookup
  const calendarMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(value)) {
      value.forEach(item => {
        const dateStr = new Date(item.date).toDateString();
        map.set(dateStr, item);
      });
    }
    return map;
  }, [value]);

  const getDateSettings = useCallback((date) => {
    const dateStr = new Date(date).toDateString();
    return calendarMap.get(dateStr) || {
      date: date.toISOString(),
      instantBooking: false,
      lastMinuteDiscount: 0,
      blocked: false,
      customPrice: undefined,
      minimumNights: undefined,
      available: true,
      peak: false,
    };
  }, [calendarMap]);

  const getDayPrice = useCallback((date) => {
    const settings = getDateSettings(date);
    if (settings.customPrice) return settings.customPrice;
    if (settings.peak && pricing?.peakPrice) return pricing.peakPrice;
    return calculateDayPrice(date, pricing);
  }, [getDateSettings, pricing]);

  // Expand selected range to individual dates
  const expandRange = (range) => {
    if (!range || !range.from) return [];
    const dates = [];
    const current = new Date(range.from);
    current.setHours(0, 0, 0, 0);
    const end = range.to ? new Date(range.to) : new Date(range.from);
    end.setHours(0, 0, 0, 0);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const selectedDates = expandRange(selectedRange);

  // Apply settings to all dates in the selected range
  const applyRangeSettings = () => {
    if (selectedDates.length === 0) return;
    const newCalendarSettings = [...value];

    selectedDates.forEach(date => {
      const dateStr = date.toDateString();
      const existingIndex = newCalendarSettings.findIndex(
        item => new Date(item.date).toDateString() === dateStr
      );

      const existing = existingIndex >= 0 ? newCalendarSettings[existingIndex] : getDateSettings(date);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      const newSettings = {
        date: `${y}-${m}-${d}`,
        instantBooking: rangeInstant ? true : existing.instantBooking,
        lastMinuteDiscount: existing.lastMinuteDiscount || 0,
        blocked: rangeBlocked ? true : existing.blocked,
        customPrice: rangePrice ? Number(rangePrice) : existing.customPrice,
        minimumNights: existing.minimumNights,
        available: rangeBlocked ? false : (existing.available !== false),
        peak: rangePeak ? true : existing.peak,
      };

      if (existingIndex >= 0) {
        newCalendarSettings[existingIndex] = { ...newCalendarSettings[existingIndex], ...newSettings };
      } else {
        newCalendarSettings.push(newSettings);
      }
    });

    onChange(newCalendarSettings);
    setSelectedRange(undefined);
    setRangePrice("");
    setRangePeak(false);
    setRangeInstant(false);
    setRangeBlocked(false);
  };

  // Remove a day's settings
  const removeDateSettings = (date) => {
    const dateStr = new Date(date).toDateString();
    onChange(value.filter(item => new Date(item.date).toDateString() !== dateStr));
  };

  // Categorize dates for calendar display
  const getDatesWithSettings = useMemo(() => {
    const dates = {
      blocked: [],
      instant: [],
      peak: [],
      customPrice: [],
      available: [],
    };
    if (Array.isArray(value)) {
      value.forEach(item => {
        const dateObj = new Date(item.date);
        const date = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
        if (item.blocked || item.available === false) {
          dates.blocked.push(date);
        } else {
          dates.available.push(date);
          if (item.instantBooking) dates.instant.push(date);
          if (item.peak) dates.peak.push(date);
          if (item.customPrice) dates.customPrice.push(date);
        }
      });
    }
    return dates;
  }, [value]);

  // All dates with settings (for list display)
  const filteredDates = useMemo(() => {
    if (!Array.isArray(value)) return [];
    return [...value].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [value]);

  useEffect(() => {
    const updateMonths = () => {
      const width = window.innerWidth;
      setMonthsToShow(width < 640 ? 1 : 2);
    };
    updateMonths();
    window.addEventListener("resize", updateMonths);
    return () => window.removeEventListener("resize", updateMonths);
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  return (
    <div className="space-y-4">
      <Card className="border-2 border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-l from-blue-50 to-indigo-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            تقویم قیمت و رزرو
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Calendar */}
          <div className="rounded-xl p-2 sm:p-4 overflow-x-auto bg-gradient-to-b from-slate-50 to-white border-2 border-slate-100">
            <style>{`
              .pricing-calendar { min-width: ${monthsToShow * 300}px !important; width: auto !important; }
              .pricing-calendar table { width: 100% !important; border-collapse: separate !important; border-spacing: 0 !important; }
              .pricing-calendar .rdp-weekdays_row { display: flex !important; gap: 2px !important; margin-bottom: 4px !important; padding: 0 1px !important; }
              .pricing-calendar .rdp-weekday { width: 38px !important; min-width: 38px !important; flex: 0 0 38px !important; text-align: center !important; padding: 3px 0 !important; font-size: 10px !important; font-weight: 700 !important; color: #475569 !important; }
              .pricing-calendar .rdp-week_row { display: flex !important; gap: 2px !important; margin-bottom: 2px !important; width: auto !important; padding: 0 1px !important; }
              .pricing-calendar .rdp-day_cell { width: 38px !important; min-width: 38px !important; height: 44px !important; padding: 0 !important; flex: 0 0 38px !important; }
              .pricing-calendar .rdp-day_btn {
                width: 38px !important; height: 44px !important;
                display: flex !important; flex-direction: column !important;
                align-items: center !important; justify-content: flex-start !important;
                padding: 4px 1px 2px !important; gap: 2px !important;
                border-radius: 8px !important; border: 1px solid #e2e8f0 !important;
                background: #fff !important; transition: all 0.15s ease !important;
                font-size: 12px !important; font-weight: 700 !important;
                line-height: 1 !important; overflow: hidden !important;
              }
              .pricing-calendar .rdp-day_btn:hover {
                border-color: #3b82f6 !important; box-shadow: 0 2px 6px rgba(59,130,246,0.2) !important;
              }
              .pricing-calendar .rdp-day_available .rdp-day_btn { background: #eff6ff !important; border-color: #bfdbfe !important; }
              .pricing-calendar .rdp-day_instant .rdp-day_btn { background: #d1fae5 !important; border-color: #34d399 !important; }
              .pricing-calendar .rdp-day_peak .rdp-day_btn { background: #fef3c7 !important; border-color: #fbbf24 !important; }
              .pricing-calendar .rdp-day_custom .rdp-day_btn { background: #dbeafe !important; border-color: #60a5fa !important; }
              .pricing-calendar .rdp-day_blocked .rdp-day_btn { background: #fee2e2 !important; border-color: #f87171 !important; }
              .pricing-calendar .rdp-day_range_middle .rdp-day_btn { background: #dbeafe !important; border-color: #93c5fd !important; border-radius: 4px !important; }
              .pricing-calendar .rdp-day_selected .rdp-day_btn { background: #2563eb !important; border-color: #2563eb !important; color: #fff !important; box-shadow: 0 2px 8px rgba(37,99,235,0.3) !important; }
              .pricing-calendar .rdp-day_selected .rdp-day_btn span { color: #fff !important; }
              .pricing-calendar .rdp-day_range_start .rdp-day_btn { background: #2563eb !important; border-color: #2563eb !important; color: #fff !important; border-radius: 8px 4px 4px 8px !important; }
              .pricing-calendar .rdp-day_range_start .rdp-day_btn span { color: #fff !important; }
              .pricing-calendar .rdp-day_range_end .rdp-day_btn { background: #2563eb !important; border-color: #2563eb !important; color: #fff !important; border-radius: 4px 8px 8px 4px !important; }
              .pricing-calendar .rdp-day_range_end .rdp-day_btn span { color: #fff !important; }
              .pricing-calendar .rdp-day_outside { opacity: 0.3 !important; }
              .pricing-calendar .rdp-day_outside .rdp-day_btn { background: #f8fafc !important; border-color: #f1f5f9 !important; }
              .pricing-calendar .rdp-day_disabled .rdp-day_btn { opacity: 0.35 !important; background: #f8fafc !important; border-color: #f1f5f9 !important; }
            `}</style>
            <Calendar
              mode="range"
              selected={selectedRange}
              onSelect={setSelectedRange}
              numberOfMonths={monthsToShow}
              className="rounded-lg pricing-calendar"
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              startMonth={today}
              endMonth={maxDate}
              disabled={[
                { before: today },
                { after: maxDate },
              ]}
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
                blocked: getDatesWithSettings.blocked,
                instant: getDatesWithSettings.instant,
                peak: getDatesWithSettings.peak,
                customPrice: getDatesWithSettings.customPrice,
                available: getDatesWithSettings.available,
                weekend: (date) => persianDayOfWeek(date) === 6,
                holiday: (date) => isIranianHoliday(date) !== null,
              }}
              modifiersClassNames={{
                blocked: "rdp-day_blocked",
                instant: "rdp-day_instant",
                peak: "rdp-day_peak",
                customPrice: "rdp-day_custom",
                available: "rdp-day_available",
                weekend: "[&>button]:text-red-600",
                holiday: "[&>button]:text-red-600",
              }}
              components={{
                DayButton: ({ day, modifiers, children, className, ...props }) => {
                  const date = day?.date || day;
                  const price = getDayPrice(date);
                  const isBlocked = modifiers?.blocked || modifiers?.disabled;
                  const isPeak = modifiers?.peak;
                  const isInstant = modifiers?.instant;
                  const isCustomPrice = modifiers?.customPrice;
                  const isAvailable = modifiers?.available;
                  const hasSettings = calendarMap.has(date.toDateString());
                  return (
                    <button
                      className={className}
                      {...props}
                    >
                      <span className="text-xs font-bold leading-none">{children}</span>
                      {hasSettings && !isBlocked && price > 0 && (
                        <span
                          className={`text-[8px] leading-none px-0.5 rounded font-medium ${
                            isCustomPrice ? 'bg-blue-300 text-blue-900' :
                            isPeak ? 'bg-amber-300 text-amber-900' :
                            isInstant ? 'bg-green-300 text-green-900' :
                            isAvailable ? 'bg-blue-200 text-blue-700' :
                            'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {formatPrice(price)}
                        </span>
                      )}
                      {isBlocked && (
                        <span className="text-[8px] leading-none text-red-600 font-bold">بلاک</span>
                      )}
                    </button>
                  );
                },
              }}
            />

            {selectedRange && selectedRange.from && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800">
                  {selectedDates.length} روز انتخاب شده
                  {selectedRange.to && (
                    <span className="text-blue-600 mr-2">
                      از {formatDateInPersian("single", selectedRange.from)} تا {formatDateInPersian("single", selectedRange.to)}
                    </span>
                  )}
                </p>
                {!selectedRange.to && (
                  <p className="text-xs text-blue-500 mt-1">
                    تاریخ پایان را نیز انتخاب کنید
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Range editing panel */}
          {selectedDates.length > 0 && selectedRange?.to && (
            <div className="space-y-4 p-4 rounded-xl bg-gradient-to-l from-amber-50 to-yellow-50 border-2 border-amber-300 shadow-sm">
              <p className="text-sm font-bold text-amber-800">
                ویرایش تنظیمات {selectedDates.length} روز انتخاب شده
                <span className="text-amber-600 mr-2 text-xs font-normal">
                  از {formatDateInPersian("single", selectedRange.from)} تا {formatDateInPersian("single", selectedRange.to)}
                </span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Edit Price */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1 text-amber-800">
                    <DollarSign className="w-3 h-3" /> ویرایش قیمت (تومان)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={rangePrice}
                    onChange={(e) => setRangePrice(e.target.value)}
                    placeholder="مثال: 1500000"
                    className="h-9 border-amber-300"
                  />
                </div>
                {/* Peak toggle */}
                <div className="flex items-center justify-between rounded-lg border-2 border-amber-200 bg-white p-2">
                  <Label className="text-xs flex items-center gap-1 text-amber-800">
                    <TrendingUp className="w-3 h-3" /> روز پیک
                  </Label>
                  <Switch checked={rangePeak} onCheckedChange={setRangePeak} />
                </div>
                {/* Instant booking toggle */}
                <div className="flex items-center justify-between rounded-lg border-2 border-green-200 bg-white p-2">
                  <Label className="text-xs flex items-center gap-1 text-green-800">
                    <Zap className="w-3 h-3" /> رزرو سریع
                  </Label>
                  <Switch checked={rangeInstant} onCheckedChange={setRangeInstant} />
                </div>
                {/* Block toggle */}
                <div className="flex items-center justify-between rounded-lg border-2 border-red-200 bg-white p-2">
                  <Label className="text-xs flex items-center gap-1 text-red-800">
                    <Lock className="w-3 h-3" /> بلاک
                  </Label>
                  <Switch checked={rangeBlocked} onCheckedChange={setRangeBlocked} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={applyRangeSettings} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                  اعمال تغییرات به {selectedDates.length} روز
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  setSelectedRange(undefined);
                  setRangePrice("");
                  setRangePeak(false);
                  setRangeInstant(false);
                  setRangeBlocked(false);
                }}>
                  لغو انتخاب
                </Button>
              </div>
            </div>
          )}

          {/* Price legend */}
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
              <div className="w-4 h-4 rounded border-2 border-blue-400 bg-blue-200"></div>
              <span>قیمت سفارشی</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-red-400 bg-red-100"></div>
              <span>بلاک شده</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List of all configured dates with prices */}
      {filteredDates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              روزهای تقویم ({filteredDates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredDates.map((item, index) => {
                const dateObj = new Date(item.date);
                const price = item.customPrice || (item.peak && pricing?.peakPrice) || calculateDayPrice(dateObj, pricing);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-medium text-sm">
                        {formatDateInPersian("single", dateObj)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {price ? `${price.toLocaleString("fa-IR")} تومان` : "—"}
                      </Badge>
                      {item.peak && (
                        <Badge className="bg-amber-500 text-xs">پیک</Badge>
                      )}
                      {item.instantBooking && (
                        <Badge className="bg-green-500 text-xs">رزرو سریع</Badge>
                      )}
                      {item.blocked && (
                        <Badge variant="destructive" className="text-xs">بلاک</Badge>
                      )}
                      {item.minimumNights && (
                        <Badge className="bg-purple-500 text-xs">حداقل {item.minimumNights} شب</Badge>
                      )}
                      {item.lastMinuteDiscount > 0 && (
                        <Badge className="bg-orange-500 text-xs">{item.lastMinuteDiscount}% تخفیف</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDateSettings(item.date)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UnifiedCalendarManager;
