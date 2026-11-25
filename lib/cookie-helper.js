/**
 * تابع کمکی برای تنظیم کوکی‌ها با تنظیمات سازگار با تمام مرورگرها
 * این تابع به ویژه برای رفع مشکل کوکی در Firefox طراحی شده است
 */

export const setCookieWithBrowserSupport = (cookieStore, name, value, options = {}) => {
    // تنظیمات پیش‌فرض برای کوکی‌ها
    // maxAge در Next.js باید بر حسب ثانیه باشد (نه میلی‌ثانیه)
    // در development برای اطمینان از کارکرد، secure را false می‌کنیم
    // در production باید true باشد
    const defaultOptions = {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 روز بر حسب ثانیه
        path: "/",
    };

    // ترکیب تنظیمات پیش‌فرض با تنظیمات ارسالی
    const mergedOptions = {
        ...defaultOptions,
        ...options,
    };

    // تنظیم کوکی با تنظیمات نهایی
    cookieStore.set(name, value, mergedOptions);
};

export const clearCookieWithBrowserSupport = (cookieStore, name) => {
    // حذف کوکی با تنظیم مسیر یکسان و تاریخ انقضای گذشته
    cookieStore.set(name, "", {
        path: "/",
        sameSite: "lax",
        httpOnly: true,
        secure: false,
        expires: new Date(0), // تنظیم تاریخ انقضا به گذشته
        maxAge: 0,
    });

    // همچنین تلاش برای حذف مستقیم
    try {
        cookieStore.delete(name);
    } catch (error) {
        // Silent fail - using expiry method instead
    }
};
