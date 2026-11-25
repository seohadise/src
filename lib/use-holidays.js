"use client";

import { useEffect, useState, useCallback } from "react";

const CACHE_TTL = 24 * 60 * 60 * 1000;
const holidayCache = new Map();

export function useHolidays(year, month) {
  const [holidays, setHolidays] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!year || !month) return;

    const cacheKey = `${year}-${month}`;
    const cached = holidayCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setHolidays(cached.data);
      return;
    }

    setLoading(true);
    fetch(`/api/holidays?year=${year}&month=${month}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.holidays) {
          holidayCache.set(cacheKey, {
            data: data.holidays,
            timestamp: Date.now(),
          });
          setHolidays(data.holidays);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  return { holidays, loading };
}

export function useHolidaysForRange(startDate, endDate) {
  const [holidays, setHolidays] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchRange = useCallback(async (start, end) => {
    if (!start || !end) return;

    const startYear = start.getFullYear();
    const startMonth = start.getMonth() + 1;
    const endYear = end.getFullYear();
    const endMonth = end.getMonth() + 1;

    const monthsToFetch = [];
    let y = startYear;
    let m = startMonth;
    while (y < endYear || (y === endYear && m <= endMonth)) {
      const cacheKey = `${y}-${m}`;
      const cached = holidayCache.get(cacheKey);
      if (!cached || Date.now() - cached.timestamp > CACHE_TTL) {
        monthsToFetch.push({ year: y, month: m });
      }
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }

    const allHolidays = {};
    for (const { year: cy, month: cm } of monthsToFetch) {
      const cacheKey = `${cy}-${cm}`;
      const cached = holidayCache.get(cacheKey);
      if (cached) {
        Object.assign(allHolidays, cached.data);
      }
    }
    setHolidays((prev) => ({ ...prev, ...allHolidays }));

    if (monthsToFetch.some(({ year: cy, month: cm }) => {
      const ck = `${cy}-${cm}`;
      const c = holidayCache.get(ck);
      return !c || Date.now() - c.timestamp > CACHE_TTL;
    })) {
      setLoading(true);
      try {
        for (const { year: cy, month: cm } of monthsToFetch) {
          const cacheKey = `${cy}-${cm}`;
          const cached = holidayCache.get(cacheKey);
          if (cached && Date.now() - cached.timestamp < CACHE_TTL) continue;

          const resp = await fetch(`/api/holidays?year=${cy}&month=${cm}`);
          const data = await resp.json();
          if (data.holidays) {
            holidayCache.set(cacheKey, {
              data: data.holidays,
              timestamp: Date.now(),
            });
            Object.assign(allHolidays, data.holidays);
          }
        }
        setHolidays((prev) => ({ ...prev, ...allHolidays }));
      } catch {
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const startTs = startDate ? startDate.getTime() : 0;
  const endTs = endDate ? endDate.getTime() : 0;

  useEffect(() => {
    if (!startTs || !endTs) return;
    const sd = new Date(startTs);
    const ed = new Date(endTs);
    fetchRange(sd, ed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchRange, startTs, endTs]);

  const isHoliday = useCallback(
    (date) => {
      const d = date instanceof Date ? date : new Date(date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return holidays[key] || null;
    },
    [holidays]
  );

  return { holidays, isHoliday, loading };
}
