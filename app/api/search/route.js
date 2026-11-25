import connectDB from "@/config/db";

import Property from "@/models/Property";
import Bus from "@/models/Bus";
import Food from "@/models/Food";
import Reservation from "@/models/Reservation";

import { NextResponse } from "next/server";
import { getPolicyByKey, DEFAULT_CANCELLATION_POLICY } from "@/constants/cancellation-policies";

const normalizeCancellationRules = (property) => {
  // If cancellationRules is a string (legacy), convert to structured format
  if (typeof property.cancellationRules === 'string' || !property.cancellationRules?.penalties) {
    const policyKey = property.cancellationPolicy || DEFAULT_CANCELLATION_POLICY;
    const policy = getPolicyByKey(policyKey);
    property.cancellationRules = {
      penalties: policy.penalties.map((penalty) => ({ ...penalty })),
    };
  }
  return property;
};

export const GET = async (req) => {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    // Get search parameters
    const query = searchParams.get("q") || "";
    const city = searchParams.get("city") || "";
    const type = searchParams.get("type") || "all";
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const guests = parseInt(searchParams.get("guests")) || 1;
    const propertyType = searchParams.get("propertyType") || "";
    const environment = searchParams.get("environment") || "";
    const region = searchParams.get("region") || "";

    // Region-based province mapping
    const regionProvinces = {
      north: ["مازندران", "گیلان", "گلستان"],
      south: ["هرمزگان", "بوشهر", "خوزستان", "سیستان و بلوچستان"],
      tehran: ["تهران"],
    };

    await connectDB();

    const baseSearchQuery = {
      status: "approved",
    };

    let results = {
      properties: [],
      buses: [],
      foods: [],
      filters: {
        city,
        checkIn,
        checkOut,
        guests,
        type,
      },
    };

    // Build search text query
    const searchText = city || query;

    if (type === "all" || type === "properties") {
      let propertyQuery = { ...baseSearchQuery };

      // Text search
      if (searchText) {
        propertyQuery.$or = [
          { name: { $regex: searchText, $options: "i" } },
          { description: { $regex: searchText, $options: "i" } },
          { "address.province": { $regex: searchText, $options: "i" } },
          { "address.city": { $regex: searchText, $options: "i" } },
        ];
      }

      // Property type filter (villa, apartment, garden)
      if (propertyType) {
        propertyQuery.type = propertyType;
      }

      // Environment filter (forest, coastal, desert, etc.)
      if (environment) {
        propertyQuery.environment = environment;
      }

      // Region filter (north, south)
      if (region && regionProvinces[region]) {
        propertyQuery["address.province"] = { $in: regionProvinces[region] };
      }

      // Capacity filter
      if (guests > 1) {
        propertyQuery.maxCapacity = { $gte: guests };
      }

      const properties = await Property.find(propertyQuery)
        .populate("owner", "name fullName number")
        .sort({ createdAt: -1 })
        .limit(50);

      // Filter by date availability if dates provided
      let filteredProperties = properties;
      if (checkIn) {
        const checkInDate = new Date(checkIn);
        checkInDate.setHours(0, 0, 0, 0);
        const checkOutDate = checkOut ? new Date(checkOut) : new Date(checkInDate);
        checkOutDate.setHours(23, 59, 59, 999);

        // Get all confirmed reservations for these properties in the date range
        const propertyIds = properties.map(p => p._id);
        const existingReservations = await Reservation.find({
          itemType: "property",
          itemId: { $in: propertyIds },
          status: { $in: ["confirmed", "pending"] },
          $or: [
            // Check-in is within the requested range
            { checkInDate: { $gte: checkInDate, $lte: checkOutDate } },
            // Check-out is within the requested range
            { checkOutDate: { $gte: checkInDate, $lte: checkOutDate } },
            // Reservation spans the entire requested range
            { checkInDate: { $lte: checkInDate }, checkOutDate: { $gte: checkOutDate } }
          ]
        }).select("itemId").lean();

        const reservedPropertyIds = new Set(
          existingReservations.map(r => r.itemId.toString())
        );

        filteredProperties = properties.filter((property) => {
          // Check if property has existing reservation
          if (reservedPropertyIds.has(property._id.toString())) {
            return false; // Property is already reserved
          }

          // Build maps for both calendar systems
          const calendarMap = new Map();
          const availableDatesMap = new Map();
          
          // Map calendarSettings
          if (property.calendarSettings?.length > 0) {
            property.calendarSettings.forEach((setting) => {
              if (setting?.date) {
                const dateStr = new Date(setting.date).toDateString();
                calendarMap.set(dateStr, setting);
              }
            });
          }
          
          // Map availableDates
          if (property.availableDates?.length > 0) {
            property.availableDates.forEach((dateEntry) => {
              if (dateEntry?.date) {
                const dateStr = new Date(dateEntry.date).toDateString();
                availableDatesMap.set(dateStr, dateEntry);
              }
            });
          }

          // If no calendar data at all, consider available
          if (calendarMap.size === 0 && availableDatesMap.size === 0) {
            return true;
          }

          // Check if ALL dates in range are available
          for (
            let d = new Date(checkInDate);
            d <= checkOutDate;
            d.setDate(d.getDate() + 1)
          ) {
            const dateStr = d.toDateString();
            const calendarSetting = calendarMap.get(dateStr);
            const availableDate = availableDatesMap.get(dateStr);
            
            // Check calendarSettings first
            if (calendarSetting) {
              if (calendarSetting.blocked) {
                return false; // Date is blocked
              }
              if (calendarSetting.available === false) {
                return false; // Date is not available
              }
            }
            
            // Check availableDates
            if (availableDate) {
              if (availableDate.isReserved) {
                return false; // Date is already reserved
              }
            }
            
            // If property uses availableDates system and date is not in it
            if (availableDatesMap.size > 0 && !availableDate && !calendarSetting) {
              return false; // Date not in available dates list
            }
          }

          return true;
        });
      }

      // Normalize cancellation rules for legacy properties
      results.properties = filteredProperties.map((prop) => {
        const plainProp = JSON.parse(JSON.stringify(prop));
        return normalizeCancellationRules(plainProp);
      });
    }

    if (type === "all" || type === "buses") {
      let busQuery = { ...baseSearchQuery };

      // Text search
      if (searchText) {
        busQuery.$or = [
          { "vehicle.name": { $regex: searchText, $options: "i" } },
          { "vehicle.ownerName": { $regex: searchText, $options: "i" } },
          { "company.name": { $regex: searchText, $options: "i" } },
          { "from.province": { $regex: searchText, $options: "i" } },
          { "from.city": { $regex: searchText, $options: "i" } },
          { "to.province": { $regex: searchText, $options: "i" } },
          { "to.city": { $regex: searchText, $options: "i" } },
        ];
      }

      // Date filter for buses
      if (checkIn) {
        const checkInDate = new Date(checkIn);
        checkInDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(checkInDate);
        nextDay.setDate(nextDay.getDate() + 1);

        busQuery.date = {
          $gte: checkInDate,
          $lt: nextDay,
        };
      }

      const buses = await Bus.find(busQuery)
        .populate("owner", "name fullName number")
        .sort({ createdAt: -1 })
        .limit(50);

      results.buses = JSON.parse(JSON.stringify(buses));
    }

    if (type === "all" || type === "foods") {
      let foodQuery = { ...baseSearchQuery };

      const getLocalDateKey = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const parseQueryDateToLocalKey = (value) => {
        if (!value) return null;
        // If ISO string
        if (value.includes("T")) {
          return getLocalDateKey(new Date(value));
        }
        // If YYYY-MM-DD
        const parts = value.split("-");
        if (parts.length === 3) {
          const year = Number(parts[0]);
          const month = Number(parts[1]);
          const day = Number(parts[2]);
          return getLocalDateKey(new Date(year, month - 1, day));
        }
        return getLocalDateKey(new Date(value));
      };

      // Text search
      if (searchText) {
        foodQuery.$or = [
          { name: { $regex: searchText, $options: "i" } },
          { "staff.chef.name": { $regex: searchText, $options: "i" } },
          { foods: { $regex: searchText, $options: "i" } },
          { "address.province": { $regex: searchText, $options: "i" } },
          { "address.city": { $regex: searchText, $options: "i" } },
          { "staff.cooks.name": { $regex: searchText, $options: "i" } },
        ];
      }

      const foods = await Food.find(foodQuery)
        .populate("owner", "name fullName number")
        .sort({ createdAt: -1 })
        .limit(50);

      // Filter by date availability if dates provided
      let filteredFoods = foods;
      if (checkIn) {
        const checkInKey = parseQueryDateToLocalKey(checkIn);

        filteredFoods = foods.filter((food) => {
          // Check if food has available dates
          if (!food.availableDates || food.availableDates.length === 0) {
            return true; // No date restrictions
          }

          // Check if the date is in available dates and not reserved
          return food.availableDates.some((availableDateObj) => {
            // availableDates is array of objects with { date, isReserved }
            const dateValue = availableDateObj.date || availableDateObj;
            const availKey = getLocalDateKey(new Date(dateValue));
            const isReserved = availableDateObj.isReserved || false;
            return availKey === checkInKey && !isReserved;
          });
        });
      }

      results.foods = JSON.parse(JSON.stringify(filteredFoods));
    }

    // Calculate total results
    results.totalResults =
      results.properties.length + results.buses.length + results.foods.length;

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "خطا در جستجو" }, { status: 500 });
  }
};
