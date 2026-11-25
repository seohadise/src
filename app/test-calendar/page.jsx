"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import isIranianHoliday from "@/lib/iran-holidays";
import { formatDateInPersian } from "@/lib/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const jalaliMonthNames = [
  "", "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

const hijriMonthNames = [
  "", "محرم", "صفر", "ربیع‌الاول", "ربیع‌الثانی", "جمادی‌الاول", "جمادی‌الثانی",
  "رجب", "شعبان", "رمضان", "شوال", "ذی‌القعده", "ذی‌الحجه",
];

// تبدیل میلادی به جلالی (بر اساس jalaali-js)
const div = (a, b) => Math.floor(a / b);
const gregorianToJalali = (gy, gm, gd) => {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy;
  if (gy > 1600) { jy = 979; gy -= 1600; } else { jy = 0; gy -= 621; }
  const days = 365 * gy + div(gy + 3, 4) - div(gy + 99, 100) + div(gy + 399, 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * div(days, 12053);
  let rem = days % 12053;
  jy += 4 * div(rem, 1461);
  rem %= 1461;
  if (rem > 365) { jy += div(rem - 1, 365); rem = (rem - 1) % 365; }
  const jm = rem < 186 ? 1 + div(rem, 31) : 7 + div(rem - 186, 30);
  const jd = 1 + (rem < 186 ? rem % 31 : (rem - 186) % 30);
  return { jy, jm, jd };
};

export default function TestCalendarPage() {
  const [selectedRange, setSelectedRange] = useState(undefined);

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

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">تست تقویم - تعطیلات رسمی ایران</h1>
      <p className="text-sm text-muted-foreground mb-6">
        روزهای تعطیل (جمعه‌ها و تعطیلات رسمی) با رنگ قرمز نمایش داده می‌شوند
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>تقویم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 overflow-x-auto">
              <Calendar
                mode="range"
                selected={selectedRange}
                onSelect={setSelectedRange}
                numberOfMonths={2}
                className="rounded-md"
                modifiers={{
                  weekend: (date) => date.getDay() === 5,
                  holiday: (date) => isIranianHoliday(date) !== null,
                }}
                modifiersClassNames={{
                  weekend: "text-red-600 font-bold",
                  holiday: "text-red-600 font-bold bg-red-100",
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>اطلاعات روزهای انتخاب شده</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                روزی را از تقویم انتخاب کنید
              </p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {selectedDates.map((date, index) => {
                  const holidayName = isIranianHoliday(date);
                  const isFriday = date.getDay() === 5;
                  const { jy, jm, jd } = gregorianToJalali(
                    date.getFullYear(),
                    date.getMonth() + 1,
                    date.getDate()
                  );
                  return (
                    <div
                      key={index}
                      className="p-3 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">
                          {formatDateInPersian("single", date)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {date.toDateString()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        شمسی: {jd} {jalaliMonthNames[jm]} {jy}
                      </div>
                      <div className="text-sm">
                        {holidayName ? (
                          <span className="text-red-600 font-bold">
                            تعطیل: {holidayName}
                          </span>
                        ) : isFriday ? (
                          <span className="text-red-600 font-bold">
                            جمعه (آخر هفته)
                          </span>
                        ) : (
                          <span className="text-green-600">
                            روز کاری
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 p-4 border rounded-lg bg-muted/30">
        <h2 className="font-bold mb-2">راهنما:</h2>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li><span className="text-red-600 font-bold">قرمز پررنگ:</span> روزهای تعطیل رسمی یا جمعه‌ها</li>
          <li><span className="text-red-600 bg-red-100 px-1 rounded">قرمز با پس‌زمینه:</span> تعطیلات رسمی ایران (شمسی و قمری)</li>
          <li>با کلیک روی هر روز، اطلاعات کامل (تاریخ شمسی + وضعیت تعطیلی) نمایش داده می‌شود</li>
        </ul>
      </div>
    </div>
  );
}
