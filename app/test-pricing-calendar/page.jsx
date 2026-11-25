"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import UnifiedCalendarManager, { addAvailabilityRangeToCalendar } from "@/components/properties/unified-calendar-manager";

const toEnglishDigits = (str) => {
  if (str === null || str === undefined) return str;
  return String(str)
    .replace(/[\u06F0-\u06F9]/g, (d) => d.charCodeAt(0) - 0x06F0)
    .replace(/[\u0660-\u0669]/g, (d) => d.charCodeAt(0) - 0x0660)
    .replace(/[\u066B\u066C\u060C\u061B]/g, "");
};

const toNumber = (val) => {
  if (!val) return 0;
  const converted = toEnglishDigits(val);
  const num = Number(converted);
  return isNaN(num) ? 0 : num;
};

export default function TestPricingCalendarPage() {
  const [pricing, setPricing] = useState({
    regularPrice: 0,
    wednesdayPrice: 0,
    thursdayPrice: 0,
    fridayPrice: 0,
    peakPrice: 0,
    extraGuestPrice: 0,
    extraGuestPeakPrice: 0,
    longStayDiscount: 0,
    discount: 0,
    deposit: 0,
  });

  const [availabilityStartDate, setAvailabilityStartDate] = useState("");
  const [availabilityEndDate, setAvailabilityEndDate] = useState("");
  const [calendarSettings, setCalendarSettings] = useState([]);

  const updatePricing = (key, val) => {
    setPricing(prev => ({ ...prev, [key]: toNumber(val) }));
  };

  const pricingFields = [
    { key: "regularPrice", label: "قیمت شنبه تا سه‌شنبه (شبانه)", placeholder: "مثال: 2000000", min: 1000 },
    { key: "wednesdayPrice", label: "قیمت چهارشنبه‌ها (شبانه)", placeholder: "مثال: 40000", min: 0 },
    { key: "thursdayPrice", label: "قیمت پنج‌شنبه‌ها (شبانه)", placeholder: "مثال: 500000", min: 0 },
    { key: "fridayPrice", label: "قیمت جمعه‌ها (شبانه)", placeholder: "مثال: 600000", min: 0 },
    { key: "peakPrice", label: "قیمت روزهای پیک (شبانه)", placeholder: "مثال: 210000", min: 1000 },
    { key: "extraGuestPrice", label: "قیمت نفرات اضافه (شبانه)", placeholder: "مثال: 100000", min: 0 },
    { key: "extraGuestPeakPrice", label: "قیمت نفرات اضافه پیک (شبانه)", placeholder: "مثال: 150000", min: 0 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">تست مرحله قیمت‌گذاری و تقویم</h1>
          <p className="text-sm text-muted-foreground mt-2">
            این صفحه دقیقاً مانند مرحله قیمت‌گذاری در ثبت ملک جدید است
          </p>
        </div>

        <Card className="shadow-md">
          <CardHeader className="bg-gradient-to-l from-indigo-50 to-blue-50 rounded-t-lg">
            <CardTitle className="text-lg">قیمت‌گذاری</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pricingFields.map(({ key, label, placeholder, min }) => (
                <div key={key} className="space-y-2">
                  <Label className="text-sm font-medium">{label}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      min={min}
                      value={pricing[key] === 0 ? "" : pricing[key]}
                      onChange={(e) => updatePricing(key, e.target.value)}
                      placeholder={placeholder}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">تومان</span>
                  </div>
                  {pricing[key] !== 0 && (
                    <p className="text-sm font-bold">
                      {Number(pricing[key]).toLocaleString("fa-IR")} تومان
                    </p>
                  )}
                  {key === "regularPrice" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ۶٪ از این مبلغ به عنوان کارمزد سایت از بیعانه کسر می‌شود
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">تخفیف مدت رزرو (30+ روز - درصد)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  max={80}
                  min={0}
                  value={pricing.longStayDiscount === 0 ? "" : pricing.longStayDiscount}
                  onChange={(e) => updatePricing("longStayDiscount", e.target.value)}
                  placeholder="برای مثال 10 درصد"
                />
                {pricing.longStayDiscount !== 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    تخفیف {pricing.longStayDiscount}٪ برای رزروهای 30 روز و بیشتر
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">تخفیف (درصد)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  max={80}
                  min={0}
                  value={pricing.discount === 0 ? "" : pricing.discount}
                  onChange={(e) => updatePricing("discount", e.target.value)}
                  placeholder="برای مثال 5 درصد"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">بیعانه (درصد)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  min={10}
                  max={80}
                  value={pricing.deposit === 0 ? "" : pricing.deposit}
                  onChange={(e) => updatePricing("deposit", e.target.value)}
                  placeholder="برای مثال 10 درصد"
                />
                {pricing.deposit !== 0 && pricing.regularPrice > 0 && (
                  <p className="text-sm font-bold mt-2">
                    {pricing.deposit}٪ از قیمت عادی معادل :
                    <span className="mt-1 mr-2">
                      {Math.round(pricing.regularPrice * (pricing.deposit / 100)).toLocaleString("fa-IR")} تومان
                    </span>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="bg-gradient-to-l from-indigo-50 to-blue-50 rounded-t-lg">
            <CardTitle className="text-lg">بازه زمانی موجود بودن ملک</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">تاریخ شروع موجود بودن ملک</Label>
                <PersianDatePicker
                  value={availabilityStartDate || ""}
                  onChange={setAvailabilityStartDate}
                  placeholder="انتخاب تاریخ شروع"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">تاریخ پایان موجود بودن ملک</Label>
                <PersianDatePicker
                  value={availabilityEndDate || ""}
                  onChange={setAvailabilityEndDate}
                  placeholder="انتخاب تاریخ پایان"
                  defaultMonth={availabilityStartDate || undefined}
                />
              </div>
            </div>
            {availabilityStartDate && availabilityEndDate && (
              <div className="mt-4">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => addAvailabilityRangeToCalendar(
                    calendarSettings,
                    setCalendarSettings,
                    availabilityStartDate,
                    availabilityEndDate
                  )}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <CalendarIcon className="w-4 h-4 ml-1" />
                  افزودن بازه موجودی به تقویم
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 leading-relaxed">
          <p className="font-bold mb-1">راهنمای تقویم:</p>
          <p>با انتخاب هر روز یا کشیدن بازه‌ای از تاریخ‌ها در تقویم، می‌توانید نوع آن روزها را تغییر دهید. برای مثال می‌توانید روزهای انتخاب‌شده را به روزهای پیک تبدیل کنید، قیمت اختصاصی تعیین کنید، حداقل شب اقامت را مشخص کنید، یا روزها را مسدود کنید.</p>
        </div>

        <UnifiedCalendarManager
          value={calendarSettings}
          onChange={setCalendarSettings}
          pricing={pricing}
          availabilityStartDate={availabilityStartDate}
          availabilityEndDate={availabilityEndDate}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">خروجی داده‌ها (برای دیباگ)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-x-auto bg-slate-100 p-4 rounded-lg max-h-96 overflow-y-auto">
              {JSON.stringify({ pricing, availabilityStartDate, availabilityEndDate, calendarSettings }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
