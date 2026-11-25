import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Property from "@/models/Property";
import Reservation from "@/models/Reservation";

// Get Persian day of week: 0=Saturday(شنبه), ..., 6=Friday(جمعه)
const persianDayOfWeek = (date) => {
  const jsDay = date.getUTCDay();
  return jsDay === 6 ? 0 : jsDay + 1;
};

// Normalize date to YYYY-MM-DD string (UTC, timezone-safe)
const normalizeDate = (date) => {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
};

// Calculate price for a date based on pricing config and calendar settings
const calculateDayPrice = (date, pricing, settings) => {
  if (!pricing) return 0;
  // If custom price is set for this date, use it
  if (settings && typeof settings.customPrice === "number" && settings.customPrice > 0) {
    return settings.customPrice;
  }
  // If peak flag is set, use peak price
  if (settings && settings.peak && pricing.peakPrice) {
    return pricing.peakPrice;
  }
  // Otherwise, use day-of-week pricing
  const pDay = persianDayOfWeek(date);
  // 0=شنبه, 1=یکشنبه, 2=دوشنبه, 3=سه‌شنبه, 4=چهارشنبه, 5=پنج‌شنبه, 6=جمعه
  if (pDay === 6) return pricing.fridayPrice || pricing.regularPrice || 0;
  if (pDay === 5) return pricing.thursdayPrice || pricing.regularPrice || 0;
  if (pDay === 4) return pricing.wednesdayPrice || pricing.regularPrice || 0;
  // شنبه تا سه‌شنبه
  return pricing.regularPrice || 0;
};

export async function POST(request, { params }) {
    try {
        await connectDB();

        const { propertyId } = await params;
        const { checkInDate, checkOutDate } = await request.json();

        if (!checkInDate || !checkOutDate) {
            return NextResponse.json(
                { success: false, message: "تاریخ ورود و خروج الزامی است." },
                { status: 400 }
            );
        }

        // دریافت اطلاعات ملک
        const property = await Property.findById(propertyId);
        if (!property) {
            return NextResponse.json(
                { success: false, message: "ملک مورد نظر یافت نشد." },
                { status: 404 }
            );
        }

        // بررسی صحت تاریخ‌ها
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (checkIn < now) {
            return NextResponse.json(
                { success: false, message: "تاریخ ورود نمی‌تواند در گذشته باشد." },
                { status: 400 }
            );
        }

        if (checkOut <= checkIn) {
            return NextResponse.json(
                { success: false, message: "تاریخ خروج باید بعد از تاریخ ورود باشد." },
                { status: 400 }
            );
        }

        // بررسی بازه موجود بودن ملک
        const availStart = property.availabilityStartDate ? new Date(property.availabilityStartDate) : null;
        const availEnd = property.availabilityEndDate ? new Date(property.availabilityEndDate) : null;

        // بررسی تداخل تاریخ‌ها با رزروهای موجود
        const conflictingDates = [];
        const unavailableDates = [];
        const currentDate = new Date(checkIn);

        while (currentDate < checkOut) {
            // بررسی بازه موجود بودن ملک
            if (availStart && availEnd) {
                if (currentDate < availStart || currentDate > availEnd) {
                    unavailableDates.push(currentDate.toLocaleDateString("fa-IR"));
                }
            }

            // بررسی در calendarSettings ملک - فقط تاریخ‌های بلاک شده
            const dateObj = property.calendarSettings && property.calendarSettings.length > 0
                ? property.calendarSettings.find(
                    (d) => normalizeDate(d.date) === normalizeDate(currentDate)
                )
                : null;

            // اگر تاریخ بلاک شده باشد
            if (dateObj && (dateObj.blocked || dateObj.available === false)) {
                conflictingDates.push(currentDate.toLocaleDateString("fa-IR"));
            }

            // بررسی رزروهای فعال
            const activeReservation = await Reservation.findOne({
                itemType: "property",
                itemId: propertyId,
                status: "confirmed",
                checkInDate: { $lte: new Date(currentDate) },
                checkOutDate: { $gt: new Date(currentDate) },
            });

            if (activeReservation) {
                conflictingDates.push(currentDate.toLocaleDateString("fa-IR"));
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // اگر تاریخ‌هایی در دسترس نیستند
        if (unavailableDates.length > 0) {
            return NextResponse.json({
                success: false,
                available: false,
                message: `تاریخ‌های زیر در دسترس نیستند: ${unavailableDates.join(", ")}`,
                unavailableDates,
            });
        }

        if (conflictingDates.length > 0) {
            return NextResponse.json({
                success: false,
                message: "برخی از تاریخ‌های انتخابی قبلاً رزرو شده‌اند.",
                conflictingDates: conflictingDates,
                available: false,
            });
        }

        // محاسبه تعداد شب‌ها و قیمت با درنظرگرفتن calendarSettings
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

        const calendarMap = new Map();

        if (Array.isArray(property.calendarSettings)) {
            property.calendarSettings.forEach((setting) => {
                if (!setting?.date) return;
                const dateStr = normalizeDate(setting.date);
                calendarMap.set(dateStr, setting);
            });
        }

        let totalBasePrice = 0;
        let priceCurrent = new Date(checkIn);
        let maxMinimumNights = 0;
        const nightlyBreakdown = [];

        while (priceCurrent < checkOut) {
            const dateStr = normalizeDate(priceCurrent);
            const settings = calendarMap.get(dateStr);

            if (settings) {
                // احترام به بلاک/غیرقابل رزرو بودن در تقویم
                if (settings.blocked || settings.available === false) {
                    return NextResponse.json({
                        success: false,
                        available: false,
                        message: `تاریخ ${priceCurrent.toLocaleDateString("fa-IR")} در دسترس نیست.`,
                    });
                }
            }

            // Calculate price based on day of week, peak status, or custom price
            let nightlyPrice = calculateDayPrice(priceCurrent, property.pricing, settings);

            if (settings) {
                if (
                    typeof settings.lastMinuteDiscount === "number" &&
                    settings.lastMinuteDiscount > 0 &&
                    settings.lastMinuteDiscount <= 100
                ) {
                    const discountAmount = Math.round(
                        (nightlyPrice * settings.lastMinuteDiscount) / 100
                    );
                    nightlyPrice = nightlyPrice - discountAmount;
                }

                // پیدا کردن بیشترین حداقل شب در بازه انتخابی
                if (
                    typeof settings.minimumNights === "number" &&
                    settings.minimumNights > maxMinimumNights
                ) {
                    maxMinimumNights = settings.minimumNights;
                }
            }

            totalBasePrice += nightlyPrice;
            nightlyBreakdown.push({
                date: new Date(priceCurrent),
                price: nightlyPrice,
            });
            priceCurrent.setDate(priceCurrent.getDate() + 1);
        }

        // اعمال قانون حداقل شب بر اساس تنظیمات تقویم
        if (maxMinimumNights > 0 && nights < maxMinimumNights) {
            return NextResponse.json({
                success: false,
                available: false,
                message: `حداقل ${maxMinimumNights} شب برای این تاریخ‌ها الزامی است`,
            });
        }

        const depositRate = property.pricing?.deposit || 10;
        // بیعانه از قیمت پایه (بدون کارمزد) محاسبه می‌شود
        const depositAmount = Math.round((totalBasePrice * depositRate) / 100);

        return NextResponse.json({
            success: true,
            available: true,
            message: "تاریخ‌های انتخابی در دسترس هستند.",
            pricing: {
                nights,
                basePricePerNight: totalBasePrice / nights, // میانگین قیمت هر شب (بدون کارمزد)
                totalBasePrice, // قیمت کل (بدون کارمزد)
                depositAmount, // بیعانه از قیمت پایه
                depositRate,
                nightlyBreakdown, // قیمت هر شب به تفکیک
            },
        });
    } catch (error) {
        console.error("Availability check error:", error);
        return NextResponse.json(
            { success: false, message: "خطای داخلی سرور", error: error.message },
            { status: 500 }
        );
    }
}
