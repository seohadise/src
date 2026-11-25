/**
 * SMS Service for sending notifications
 * Uses Melipayamak package with shared service line and pattern (bodyId)
 */

import https from "https";
import querystring from "querystring";

// Get admin phone number from environment or use default
const ADMIN_PHONE = process.env.ADMIN_PHONE || "09359376321";

const MELI_USERNAME = process.env.MELI_PAYAMAK_USERNAME;
const MELI_PASSWORD = process.env.MELI_PAYAMAK_PASSWORD;

// Direct REST call to melipayamak (the package has a path-bug in RestAsync)
function callMelipayamak(method, params) {
    return new Promise((resolve, reject) => {
        const data = querystring.stringify({
            username: MELI_USERNAME,
            password: MELI_PASSWORD,
            ...params,
        });

        const options = {
            hostname: "rest.payamak-panel.com",
            path: `/api/SendSMS/${method}`,
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "Content-Length": Buffer.byteLength(data),
            },
        };

        const req = https.request(options, (res) => {
            let chunks = "";
            res.setEncoding("utf8");
            res.on("data", (chunk) => { chunks += chunk; });
            res.on("end", () => {
                try {
                    resolve(JSON.parse(chunks));
                } catch {
                    resolve(chunks);
                }
            });
        });

        req.on("error", (err) => reject(err));
        req.write(data, "utf8");
        req.end();
    });
}

/**
 * Pattern codes (bodyId) from melipayamak console
 */
const PATTERNS = {
    // ملک
    PROPERTY_RESERVATION_PENDING_USER: 437683,      // درخواست رزرو ملک {0} شما ثبت شد و در انتظار تایید است.
    PROPERTY_RESERVATION_CONFIRMED_USER: 437704,    // درخواست رزرو ملک {0} شما توسط ملکدار {1} تایید شد سفر خوش!
    PROPERTY_RESERVATION_CANCELLED_USER: 441095,    // رزرو ملک "{0}" توسط شما لغو شد.
    PROPERTY_RESERVATION_REJECTED_USER: 437575,     // متاسفانه درخواست رزرو ملک {0} شما توسط {1} رد شد.
    PROPERTY_RESERVATION_NOTIFY_OWNER: 441091,      // کاربر {0} درخواست رزرو ملک "{1}" داده است و در انتظار تایید شماست.
    PROPERTY_RESERVATION_CANCEL_OWNER: 441093,      // کاربر {0} رزرو ملک "{1}" را لغو کرد.
    PROPERTY_RESERVATION_NOTIFY_ADMIN: 441065,      // رزرو جدید: کاربر {0} درخواست رزرو ملک "{1}" (مالک: {2}) داده است.
    PROPERTY_RESERVATION_CANCEL_ADMIN: 441111,      // لغو رزرو: کاربر{0} رزرو ملک "{1}" را لغو کرد.
    PROPERTY_APPROVED: 441094,                      // ملک "{0}" شما توسط مدیریت تایید شد و اکنون در سایت نمایش داده می‌شود.

    // غذا
    FOOD_RESERVATION_PENDING_USER: 452019,          // درخواست رزرو غذا {0} شما ثبت شد و در انتظار تایید است
    FOOD_RESERVATION_CONFIRMED_USER: 452020,        // درخواست رزرو غذا {0} شما توسط غذا دار {1} تایید شد. سفر خوش!
    FOOD_RESERVATION_REJECTED_USER: 452022,         // متاسفانه درخواست رزرو غذا {0} شما توسط {1} رد شد.
    FOOD_RESERVATION_CANCELLED_USER: 441154,       // رزرو غذا "{0}" توسط شما لغو شد.
    FOOD_RESERVATION_NOTIFY_OWNER: 441151,          // کاربر {0} درخواست رزرو غذا "{1}" داده و در انتظار تایید شماست.
    FOOD_RESERVATION_CANCEL_OWNER: 441152,          // کاربر {0} رزرو غذا "{1}" را لغو کرد.
    FOOD_RESERVATION_NOTIFY_ADMIN: 441118,          // رزرو جدید: کاربر {0} درخواست رزرو غذا "{1}" (مالک: {2}) داده است.
    FOOD_RESERVATION_CANCEL_ADMIN: 441115,          // لغو رزرو: کاربر {0} رزرو غذا "{1}" را لغو کرد.
    FOOD_APPROVED: 441153,                          // غذا "{0}" شما توسط مدیریت تایید شد و اکنون در سایت نمایش داده می‌شود.

    // اتوبوس
    BUS_RESERVATION_PENDING_USER: 452024,           // درخواست رزرو اتوبوس {0} شما ثبت شد و در انتظار تایید است
    BUS_RESERVATION_CONFIRMED_USER: 452026,         // درخواست رزرو اتوبوس {0} شما توسط اتوبوس دار {1} تایید شد. سفر خوش!
    BUS_RESERVATION_REJECTED_USER: 452028,          // متاسفانه درخواست رزرو اتوبوس {0} شما توسط {1} رد شد.
    BUS_RESERVATION_CANCELLED_USER: 441148,         // رزرو اتوبوس "{0}" توسط شما لغو شد.
    BUS_RESERVATION_NOTIFY_OWNER: 441142,           // کاربر {0} درخواست رزرو اتوبوس "{1}" داده و در انتظار تایید شماست.
    BUS_RESERVATION_CANCEL_OWNER: 441143,           // رزرو اتوبوس "{1}" را لغوکرد.
    BUS_RESERVATION_NOTIFY_ADMIN: 441126,           // رزرو جدید: کاربر {0} درخواست رزرو اتوبوس "{1}" (مالک: {2}) داده است.
    BUS_RESERVATION_CANCEL_ADMIN: 441121,           // لغو رزرو: کاربر {0} رزرو اتوبوس "{1}" را لغو کرد.
    BUS_APPROVED: 441147,                           // اتوبوس "{0}" شما توسط مدیریت تایید شد و اکنون در سایت نمایش داده می‌شود.

    // عمومی
    OTP_CODE: 314582,                               // کد تایید شما : {0}
};

/**
 * Send SMS using melipayamak package sendByBaseNumber
 * @param {string} to - Recipient phone number
 * @param {number} bodyId - Pattern code (bodyId) from melipayamak console
 * @param {Array<string>} values - Values to replace in pattern ({0}, {1}, {2}, ...)
 * @returns {Promise<{success: boolean, message: string}>}
 */
// Normalize Iranian phone numbers for melipayamak
function normalizePhone(phone) {
    if (!phone) return "";
    let p = String(phone).trim();
    // Remove +98 prefix and replace with 0
    if (p.startsWith("+98")) p = "0" + p.slice(3);
    // Remove 98 prefix if present
    if (p.startsWith("98") && p.length === 12) p = "0" + p.slice(2);
    // Ensure it starts with 0
    if (!p.startsWith("0")) p = "0" + p;
    return p;
}

export async function sendSMSByPattern(to, bodyId, values = []) {
    try {
        if (!MELI_USERNAME || !MELI_PASSWORD) {
            console.warn("[sms] MELI_PAYAMAK_USERNAME or MELI_PAYAMAK_PASSWORD not set");
            return { success: false, message: "تنظیمات SMS تکمیل نشده" };
        }
        const normalizedTo = normalizePhone(to);
        if (!normalizedTo || normalizedTo.length !== 11) {
            console.warn(`[sms] Invalid phone number: ${to} (normalized: ${normalizedTo})`);
            return { success: false, message: "شماره تلفن نامعتبر", errorMessage: "Invalid phone" };
        }
        const text = values.join(";");
        console.log(`[sms] Sending pattern SMS: to=${normalizedTo}, bodyId=${bodyId}, text="${text}"`);
        const result = await callMelipayamak("BaseServiceNumber", { text, to: normalizedTo, bodyId });
        console.log(`[sms] Raw result:`, JSON.stringify(result));

        // Check melipayamak response
        const retStatus = result?.RetStatus ?? result?.retStatus ?? result?.status;
        const strStatus = result?.StrRetStatus ?? result?.strRetStatus ?? result?.message ?? "";
        const value = result?.Value ?? result?.value;

        if (retStatus === 1 || retStatus === "1" || (value && value !== "0")) {
            console.log(`[sms] Sent successfully. ID:`, value);
            return { success: true, message: "پیامک با موفقیت ارسال شد", result };
        } else {
            console.error(`[sms] API returned error status:`, { retStatus, strStatus, result });
            return { success: false, message: `خطا در ارسال پیامک: ${strStatus || "unknown"}`, errorMessage: strStatus, result };
        }
    } catch (error) {
        console.error("[sms] Exception sending pattern SMS:", {
            to,
            bodyId,
            values,
            errorMessage: error?.message,
            error,
        });
        return { success: false, message: "خطا در ارسال پیامک", errorMessage: error?.message };
    }
}

/**
 * Legacy sendSMS function - now uses pattern-based sending
 * For backward compatibility, maps message to the closest pattern
 */
export async function sendSMS(to, message, bodyId = 0) {
    if (bodyId > 0) {
        return await sendSMSByPattern(to, bodyId, [message]);
    }
    // Fallback: try to send with a generic approach
    try {
        const normalizedTo = normalizePhone(to);
        if (!normalizedTo || normalizedTo.length !== 11) {
            return { success: false, message: "شماره تلفن نامعتبر" };
        }
        const result = await callMelipayamak("BaseServiceNumber", { text: message, to: normalizedTo, bodyId });
        console.log("[sms] send result:", { to, bodyId, result });
        return { success: true, message: "پیامک با موفقیت ارسال شد", result };
    } catch (error) {
        console.error("[sms] Error sending SMS:", { to, errorMessage: error?.message });
        return { success: false, message: "خطا در ارسال پیامک", errorMessage: error?.message };
    }
}

/**
 * Get item type label in Persian
 * @param {string} itemType - property, food, or bus
 * @returns {string}
 */
function getItemTypeLabel(itemType) {
    const labels = {
        property: "ملک",
        food: "غذا",
        bus: "اتوبوس",
    };
    return labels[itemType] || "آیتم";
}

/**
 * Get the correct bodyId based on item type and action
 */
function getPatternId(itemType, action) {
    const patterns = {
        property: {
            reservationPendingUser: PATTERNS.PROPERTY_RESERVATION_PENDING_USER,
            reservationConfirmedUser: PATTERNS.PROPERTY_RESERVATION_CONFIRMED_USER,
            reservationCancelledUser: PATTERNS.PROPERTY_RESERVATION_CANCELLED_USER,
            reservationRejectedUser: PATTERNS.PROPERTY_RESERVATION_REJECTED_USER,
            reservationNotifyOwner: PATTERNS.PROPERTY_RESERVATION_NOTIFY_OWNER,
            reservationCancelOwner: PATTERNS.PROPERTY_RESERVATION_CANCEL_OWNER,
            reservationNotifyAdmin: PATTERNS.PROPERTY_RESERVATION_NOTIFY_ADMIN,
            reservationCancelAdmin: PATTERNS.PROPERTY_RESERVATION_CANCEL_ADMIN,
            approved: PATTERNS.PROPERTY_APPROVED,
        },
        food: {
            reservationPendingUser: PATTERNS.FOOD_RESERVATION_PENDING_USER,
            reservationConfirmedUser: PATTERNS.FOOD_RESERVATION_CONFIRMED_USER,
            reservationCancelledUser: PATTERNS.FOOD_RESERVATION_CANCELLED_USER,
            reservationRejectedUser: PATTERNS.FOOD_RESERVATION_REJECTED_USER,
            reservationNotifyOwner: PATTERNS.FOOD_RESERVATION_NOTIFY_OWNER,
            reservationCancelOwner: PATTERNS.FOOD_RESERVATION_CANCEL_OWNER,
            reservationNotifyAdmin: PATTERNS.FOOD_RESERVATION_NOTIFY_ADMIN,
            reservationCancelAdmin: PATTERNS.FOOD_RESERVATION_CANCEL_ADMIN,
            approved: PATTERNS.FOOD_APPROVED,
        },
        bus: {
            reservationPendingUser: PATTERNS.BUS_RESERVATION_PENDING_USER,
            reservationConfirmedUser: PATTERNS.BUS_RESERVATION_CONFIRMED_USER,
            reservationCancelledUser: PATTERNS.BUS_RESERVATION_CANCELLED_USER,
            reservationRejectedUser: PATTERNS.BUS_RESERVATION_REJECTED_USER,
            reservationNotifyOwner: PATTERNS.BUS_RESERVATION_NOTIFY_OWNER,
            reservationCancelOwner: PATTERNS.BUS_RESERVATION_CANCEL_OWNER,
            reservationNotifyAdmin: PATTERNS.BUS_RESERVATION_NOTIFY_ADMIN,
            reservationCancelAdmin: PATTERNS.BUS_RESERVATION_CANCEL_ADMIN,
            approved: PATTERNS.BUS_APPROVED,
        },
    };
    return patterns[itemType]?.[action] || 0;
}

/**
 * Send SMS to user when they create a reservation (pending status)
 * الگو: درخواست رزرو ملک {0} شما ثبت شد و در انتظار تایید است.
 */
export async function sendReservationPendingSMSToUser(userPhone, itemType, itemName) {
    const bodyId = getPatternId(itemType, "reservationPendingUser");
    if (!bodyId) {
        console.warn(`[sms] No pattern found for ${itemType}.reservationPendingUser`);
        return { success: false, message: "الگوی پیامک یافت نشد" };
    }
    return await sendSMSByPattern(userPhone, bodyId, [itemName]);
}

/**
 * Send SMS to owner when a user creates a reservation
 * الگو: کاربر {0} درخواست رزرو ملک "{1}" داده است و در انتظار تایید شماست.
 */
export async function sendReservationNotificationToOwner(ownerPhone, userName, itemType, itemName) {
    const bodyId = getPatternId(itemType, "reservationNotifyOwner");
    if (!bodyId) {
        console.warn(`[sms] No pattern found for ${itemType}.reservationNotifyOwner`);
        return { success: false, message: "الگوی پیامک یافت نشد" };
    }
    return await sendSMSByPattern(ownerPhone, bodyId, [userName, itemName]);
}

/**
 * Send SMS to user when owner confirms their reservation
 * الگو: درخواست رزرو ملک {0} شما توسط ملکدار {1} تایید شد سفر خوش!
 */
export async function sendReservationConfirmedSMSToUser(userPhone, ownerName, itemType, itemName) {
    const bodyId = getPatternId(itemType, "reservationConfirmedUser");
    if (!bodyId) {
        console.warn(`[sms] No pattern found for ${itemType}.reservationConfirmedUser`);
        return { success: false, message: "الگوی پیامک یافت نشد" };
    }
    return await sendSMSByPattern(userPhone, bodyId, [itemName, ownerName]);
}

/**
 * Send SMS to admin when a new reservation is created
 * الگو: رزرو جدید: کاربر {0} درخواست رزرو ملک "{1}" (مالک: {2}) داده است.
 */
export async function sendReservationNotificationToAdmin(userName, itemType, itemName, ownerName) {
    const bodyId = getPatternId(itemType, "reservationNotifyAdmin");
    if (!bodyId) {
        console.warn(`[sms] No pattern found for ${itemType}.reservationNotifyAdmin`);
        return { success: false, message: "الگوی پیامک یافت نشد" };
    }
    return await sendSMSByPattern(ADMIN_PHONE, bodyId, [userName, itemName, ownerName]);
}

/**
 * Send all reservation notifications at once
 */
export async function sendAllReservationNotifications({
    userPhone,
    userName,
    ownerPhone,
    ownerName,
    itemType,
    itemName,
}) {
    const results = {
        user: null,
        owner: null,
        admin: null,
    };

    if (userPhone) {
        results.user = await sendReservationPendingSMSToUser(userPhone, itemType, itemName);
    }

    if (ownerPhone) {
        results.owner = await sendReservationNotificationToOwner(ownerPhone, userName, itemType, itemName);
    }

    results.admin = await sendReservationNotificationToAdmin(userName, itemType, itemName, ownerName);

    return results;
}

/**
 * Send confirmation notification to user
 */
export async function sendConfirmationNotification({
    userPhone,
    ownerName,
    itemType,
    itemName,
}) {
    if (userPhone) {
        return await sendReservationConfirmedSMSToUser(userPhone, ownerName, itemType, itemName);
    }
    return { success: false, message: "شماره تلفن کاربر موجود نیست" };
}

/**
 * Send SMS to user when their reservation is cancelled
 * الگو: رزرو ملک {0} با موفقیت لغو شد. / رزرو غذا"{1}" توسط شما لغو شد. / رزرو اتوبوس"{0}" توسط شما لغو شد.
 */
export async function sendReservationCancelledSMSToUser(userPhone, itemType, itemName, cancelledBy = 'owner') {
    const bodyId = getPatternId(itemType, "reservationCancelledUser");
    if (!bodyId) {
        console.warn(`[sms] No pattern found for ${itemType}.reservationCancelledUser`);
        return { success: false, message: "الگوی پیامک یافت نشد" };
    }
    return await sendSMSByPattern(userPhone, bodyId, [itemName]);
}

/**
 * Send SMS to owner when a reservation is cancelled
 * الگو: کاربر {0} رزرو ملک "{1}" را لغو کرد.
 */
export async function sendReservationCancelledSMSToOwner(ownerPhone, userName, itemType, itemName, cancelledBy = 'user') {
    const bodyId = getPatternId(itemType, "reservationCancelOwner");
    if (!bodyId) {
        console.warn(`[sms] No pattern found for ${itemType}.reservationCancelOwner`);
        return { success: false, message: "الگوی پیامک یافت نشد" };
    }
    return await sendSMSByPattern(ownerPhone, bodyId, [userName, itemName]);
}

/**
 * Send SMS to admin when a reservation is cancelled
 * الگو: لغو رزرو: کاربر{0} رزرو ملک "{1}" را لغو کرد.
 */
export async function sendReservationCancelledSMSToAdmin(userName, itemType, itemName, ownerName, cancelledBy = 'user') {
    const bodyId = getPatternId(itemType, "reservationCancelAdmin");
    if (!bodyId) {
        console.warn(`[sms] No pattern found for ${itemType}.reservationCancelAdmin`);
        return { success: false, message: "الگوی پیامک یافت نشد" };
    }
    return await sendSMSByPattern(ADMIN_PHONE, bodyId, [userName, itemName]);
}

/**
 * Send SMS to owner when admin approves their item
 * الگو: ملک "{0}" شما توسط مدیریت تایید شد و اکنون در سایت نمایش داده می‌شود.
 */
export async function sendItemApprovedSMSToOwner(ownerPhone, itemType, itemName) {
    const bodyId = getPatternId(itemType, "approved");
    if (!bodyId) {
        console.warn(`[sms] No pattern found for ${itemType}.approved`);
        return { success: false, message: "الگوی پیامک یافت نشد" };
    }
    return await sendSMSByPattern(ownerPhone, bodyId, [itemName]);
}

/**
 * Send SMS to owner when admin rejects their item
 */
export async function sendItemRejectedSMSToOwner(ownerPhone, itemType, itemName) {
    const itemLabel = getItemTypeLabel(itemType);
    console.warn(`[sms] No reject pattern defined for ${itemType}, skipping`);
    return { success: false, message: "الگوی پیامک رد آیتم تعریف نشده" };
}

/**
 * Send SMS notification to admin when a new withdrawal request is created
 */
export async function sendWithdrawalNotificationToAdmin(userName, amount, userType) {
    const typeLabel =
        userType === "property-owner" ? "ملک‌دار" :
        userType === "food-owner" ? "غذادار" :
        userType === "bus-owner" ? "اتوبوس‌دار" : "کاربر";
    const message = `درخواست برداشت جدید: ${typeLabel} ${userName} درخواست برداشت ${amount.toLocaleString("fa-IR")} تومان داده است.`;
    return await sendSMS(ADMIN_PHONE, message);
}

/**
 * Send SMS to user when owner rejects their reservation request
 * الگو: متاسفانه درخواست رزرو ملک {0} شما توسط {1} رد شد.
 */
export async function sendReservationRejectedSMSToUser(userPhone, itemType, itemName, ownerName) {
    const bodyId = getPatternId(itemType, "reservationRejectedUser");
    if (!bodyId) {
        console.warn(`[sms] No pattern found for ${itemType}.reservationRejectedUser`);
        return { success: false, message: "الگوی پیامک یافت نشد" };
    }
    return await sendSMSByPattern(userPhone, bodyId, [itemName, ownerName]);
}

/**
 * Send all cancellation notifications at once
 */
export async function sendAllCancellationNotifications({
    userPhone,
    userName,
    ownerPhone,
    ownerName,
    itemType,
    itemName,
    cancelledBy = 'user',
}) {
    const results = {
        user: null,
        owner: null,
        admin: null,
    };

    if (userPhone) {
        results.user = await sendReservationCancelledSMSToUser(userPhone, itemType, itemName, cancelledBy);
    }

    if (ownerPhone) {
        results.owner = await sendReservationCancelledSMSToOwner(ownerPhone, userName, itemType, itemName, cancelledBy);
    }

    results.admin = await sendReservationCancelledSMSToAdmin(userName, itemType, itemName, ownerName, cancelledBy);

    return results;
}

const smsService = {
    sendSMS,
    sendSMSByPattern,
    sendReservationPendingSMSToUser,
    sendReservationNotificationToOwner,
    sendReservationConfirmedSMSToUser,
    sendReservationNotificationToAdmin,
    sendAllReservationNotifications,
    sendConfirmationNotification,
    sendReservationCancelledSMSToUser,
    sendReservationCancelledSMSToOwner,
    sendReservationCancelledSMSToAdmin,
    sendAllCancellationNotifications,
    sendItemApprovedSMSToOwner,
    sendItemRejectedSMSToOwner,
    sendReservationRejectedSMSToUser,
    sendWithdrawalNotificationToAdmin,
    PATTERNS,
};

export default smsService;
