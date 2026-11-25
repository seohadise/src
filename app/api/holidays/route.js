import { NextResponse } from "next/server";

const TIME_IR_API_KEY = process.env.TIME_IR_API_KEY || "ZAVdqwuySASubByCed5KYuYMzb9uB2f7";
const TIME_IR_BASE_URL = "https://api.time.ir/v1/event/fa/events/calendar";

const CACHE_TTL = 24 * 60 * 60 * 1000;
const holidayCache = new Map();

const div = (a, b) => Math.floor(a / b);

const gregorianToJalali = (gy, gm, gd) => {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy;
  if (gy > 1600) {
    jy = 979;
    gy -= 1600;
  } else {
    jy = 0;
    gy -= 621;
  }
  const days =
    365 * gy +
    div(gy + 3, 4) -
    div(gy + 99, 100) +
    div(gy + 399, 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * div(days, 12053);
  let rem = days % 12053;
  jy += 4 * div(rem, 1461);
  rem %= 1461;
  if (rem > 365) {
    jy += div(rem - 1, 365);
    rem = (rem - 1) % 365;
  }
  const jm = rem < 186 ? 1 + div(rem, 31) : 7 + div(rem - 186, 30);
  const jd = 1 + (rem < 186 ? rem % 31 : (rem - 186) % 30);
  return { jy, jm, jd };
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const gYear = parseInt(searchParams.get("year"));
  const gMonth = parseInt(searchParams.get("month"));

  if (!gYear || !gMonth) {
    return NextResponse.json(
      { error: "year and month parameters are required" },
      { status: 400 }
    );
  }

  const cacheKey = `${gYear}-${gMonth}`;
  const cached = holidayCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const startJalali = gregorianToJalali(gYear, gMonth, 1);
  const lastDay = new Date(gYear, gMonth, 0).getDate();
  const endJalali = gregorianToJalali(gYear, gMonth, lastDay);

  const jalaliMonthsToFetch = new Set();
  jalaliMonthsToFetch.add(`${startJalali.jy}-${startJalali.jm}`);
  jalaliMonthsToFetch.add(`${endJalali.jy}-${endJalali.jm}`);

  try {
    const holidays = {};

    for (const jalaliKey of jalaliMonthsToFetch) {
      const [jy, jm] = jalaliKey.split("-").map(Number);

      const monthCacheKey = `jalali-${jalaliKey}`;
      const monthCached = holidayCache.get(monthCacheKey);
      let monthHolidays = null;

      if (monthCached && Date.now() - monthCached.timestamp < CACHE_TTL) {
        monthHolidays = monthCached.data;
      } else {
        const url = `${TIME_IR_BASE_URL}?year=${jy}&month=${jm}`;
        const resp = await fetch(url, {
          headers: {
            "x-api-key": TIME_IR_API_KEY,
          },
          next: { revalidate: 86400 },
        });

        if (!resp.ok) {
          throw new Error(`time.ir API returned ${resp.status}`);
        }

        const json = await resp.json();
        const eventList = json.data?.event_list || [];

        monthHolidays = {};
        for (const event of eventList) {
          if (event.is_holiday === true) {
            const gDate = `${event.gregorian_year}-${String(event.gregorian_month).padStart(2, "0")}-${String(event.gregorian_day).padStart(2, "0")}`;
            if (monthHolidays[gDate]) {
              monthHolidays[gDate] += " / " + event.title;
            } else {
              monthHolidays[gDate] = event.title;
            }
          }
        }

        holidayCache.set(monthCacheKey, {
          data: monthHolidays,
          timestamp: Date.now(),
        });
      }

      Object.assign(holidays, monthHolidays);
    }

    const result = { holidays, year: gYear, month: gMonth };

    holidayCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch holidays from time.ir", details: error.message },
      { status: 502 }
    );
  }
}
