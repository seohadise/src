import Property from "@/models/Property";

const normalizeDate = (date) => {
    const d = new Date(date);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
};

/**
 * بلاک کردن تاریخ‌های رزرو شده در ملک
 */
export const blockPropertyDates = async (propertyId, checkInDate, checkOutDate) => {
    try {
        const property = await Property.findById(propertyId);
        if (!property) {
            throw new Error("ملک یافت نشد");
        }

        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        
        // تولید لیست تاریخ‌های بین ورود و خروج
        const datesToBlock = [];
        const currentDate = new Date(checkIn);
        
        while (currentDate < checkOut) {
            datesToBlock.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // بروزرسانی یا اضافه کردن تاریخ‌ها
        for (const dateToBlock of datesToBlock) {
            const existingDateIndex = property.availableDates.findIndex(
                (d) => normalizeDate(d.date) === normalizeDate(dateToBlock)
            );

            if (existingDateIndex >= 0) {
                // اگر تاریخ موجود است، آن را بلاک کن
                property.availableDates[existingDateIndex].isReserved = true;
            } else {
                // اگر تاریخ موجود نیست، آن را اضافه کن
                property.availableDates.push({
                    date: dateToBlock,
                    isReserved: true,
                    isPeakSeason: false
                });
            }
        }

        await property.save();
        return { success: true, blockedDates: datesToBlock.length };
    } catch (error) {
        console.error("Error blocking property dates:", error);
        throw error;
    }
};

/**
 * آزاد کردن تاریخ‌های رزرو شده در ملک
 */
export const unblockPropertyDates = async (propertyId, checkInDate, checkOutDate) => {
    try {
        const property = await Property.findById(propertyId);
        if (!property) {
            throw new Error("ملک یافت نشد");
        }

        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        
        // تولید لیست تاریخ‌های بین ورود و خروج
        const datesToUnblock = [];
        const currentDate = new Date(checkIn);
        
        while (currentDate < checkOut) {
            datesToUnblock.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // آزاد کردن تاریخ‌ها
        for (const dateToUnblock of datesToUnblock) {
            const existingDateIndex = property.availableDates.findIndex(
                (d) => normalizeDate(d.date) === normalizeDate(dateToUnblock)
            );

            if (existingDateIndex >= 0) {
                property.availableDates[existingDateIndex].isReserved = false;
            }
        }

        await property.save();
        return { success: true, unblockedDates: datesToUnblock.length };
    } catch (error) {
        console.error("Error unblocking property dates:", error);
        throw error;
    }
};

/**
 * بررسی در دسترس بودن تاریخ‌ها
 */
export const checkPropertyAvailability = async (propertyId, checkInDate, checkOutDate) => {
    try {
        const property = await Property.findById(propertyId);
        if (!property) {
            throw new Error("ملک یافت نشد");
        }

        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        
        // بررسی تاریخ‌های بین ورود و خروج
        const conflictingDates = [];
        const currentDate = new Date(checkIn);
        
        while (currentDate < checkOut) {
            const dateObj = property.availableDates.find(
                (d) => normalizeDate(d.date) === normalizeDate(currentDate)
            );
            
            if (dateObj && dateObj.isReserved) {
                conflictingDates.push(new Date(currentDate));
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return {
            available: conflictingDates.length === 0,
            conflictingDates: conflictingDates
        };
    } catch (error) {
        console.error("Error checking property availability:", error);
        throw error;
    }
};

/**
 * محاسبه قیمت رزرو ملک
 */
export const calculatePropertyPrice = (property, checkInDate, checkOutDate) => {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    const basePricePerNight = property.pricing.regularPrice;
    const totalBasePrice = basePricePerNight * nights;
    
    // محاسبه کارمزد 6% از قیمت پایه
    const commissionRate = 6;
    const commissionAmount = Math.round((totalBasePrice * commissionRate) / 100);
    const finalPrice = totalBasePrice + commissionAmount;
    
    // محاسبه بیعانه از قیمت پایه (نه قیمت نهایی)
    const depositRate = property.pricing.deposit || 10;
    const depositAmount = Math.round((totalBasePrice * depositRate) / 100);
    
    // محاسبه مالیات 10% از بیعانه
    const taxRate = 10;
    const taxAmount = Math.round((depositAmount * taxRate) / 100);
    
    // مبلغ کل قابل پرداخت (بیعانه + مالیات)
    const totalAmount = depositAmount + taxAmount;
    
    return {
        nights,
        basePricePerNight,
        totalBasePrice,
        commissionAmount,
        commissionRate,
        finalPrice,
        depositAmount,
        depositRate,
        taxAmount,
        taxRate,
        totalAmount
    };
};
