/**
 * تابع برای فرمت کردن تاریخ‌های رزرو بر اساس نوع آیتم
 */
export const formatReservationDate = (reservation) => {
    if (!reservation) return "تاریخ نامشخص";

    try {
        switch (reservation.itemType) {
            case "property":
                if (reservation.checkInDate && reservation.checkOutDate) {
                    const checkIn = new Date(reservation.checkInDate).toLocaleDateString("fa-IR");
                    const checkOut = new Date(reservation.checkOutDate).toLocaleDateString("fa-IR");
                    return `از ${checkIn} تا ${checkOut}`;
                } else if (reservation.checkInDate) {
                    return `از ${new Date(reservation.checkInDate).toLocaleDateString("fa-IR")}`;
                }
                break;

            case "bus":
                if (reservation.date) {
                    return `تاریخ: ${new Date(reservation.date).toLocaleDateString("fa-IR")}`;
                }
                break;

            case "food":
                if (reservation.dates && reservation.dates.length > 0) {
                    if (reservation.dates.length === 1) {
                        return `تاریخ: ${new Date(reservation.dates[0]).toLocaleDateString(
                            "fa-IR"
                        )}`;
                    } else {
                        const sortedDates = reservation.dates.sort(
                            (a, b) => new Date(a) - new Date(b)
                        );
                        const firstDate = new Date(sortedDates[0]).toLocaleDateString("fa-IR");
                        const lastDate = new Date(
                            sortedDates[sortedDates.length - 1]
                        ).toLocaleDateString("fa-IR");
                        return `${reservation.dates.length} روز (${firstDate} تا ${lastDate})`;
                    }
                }
                break;

            default:
                break;
        }

        // اگر هیچ تاریخ مشخصی نبود، از تاریخ ایجاد استفاده کن
        if (reservation.createdAt) {
            return `ایجاد شده: ${new Date(reservation.createdAt).toLocaleDateString("fa-IR")}`;
        }

        return "تاریخ نامشخص";
    } catch (error) {
        console.error("Error formatting reservation date:", error);
        return "تاریخ نامعتبر";
    }
};

/**
 * تابع برای فرمت کردن تاریخ ساده
 */
export const formatDate = (dateStr) => {
    if (!dateStr) return "تاریخ نامشخص";
    try {
        return new Date(dateStr).toLocaleDateString("fa-IR");
    } catch (error) {
        console.error("Error formatting date:", error);
        return "تاریخ نامعتبر";
    }
};

/**
 * تابع برای فرمت کردن تاریخ با ساعت
 */
export const formatDateTime = (dateStr) => {
    if (!dateStr) return "تاریخ نامشخص";
    try {
        return new Date(dateStr).toLocaleDateString("fa-IR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch (error) {
        console.error("Error formatting datetime:", error);
        return "تاریخ نامعتبر";
    }
};

/**
 * تابع برای دریافت نام نوع آیتم
 */
export const getItemTypeName = (itemType) => {
    switch (itemType) {
        case "property":
            return "ملک";
        case "bus":
            return "اتوبوس";
        case "food":
            return "غذا";
        default:
            return "نامشخص";
    }
};

/**
 * تابع برای دریافت وضعیت رزرو به فارسی
 */
export const getReservationStatusText = (status) => {
    switch (status) {
        case "pending":
            return "در انتظار";
        case "confirmed":
            return "تایید شده";
        case "cancelled":
            return "لغو شده";
        case "completed":
            return "تکمیل شده";
        default:
            return status || "نامشخص";
    }
};

/**
 * تابع برای دریافت رنگ وضعیت رزرو
 */
export const getReservationStatusColor = (status) => {
    switch (status) {
        case "pending":
            return "bg-yellow-500/10 text-yellow-500";
        case "confirmed":
            return "bg-blue-500/10 text-blue-500";
        case "cancelled":
            return "bg-red-500/10 text-red-500";
        case "completed":
            return "bg-green-500/10 text-green-500";
        default:
            return "bg-gray-500/10 text-gray-500";
    }
};
