"use server";

import connectDB from "@/config/db";
import Property from "@/models/Property";
import Reservation from "@/models/Reservation";

import { getUser } from "@/lib/helpers";
import { propertySchema } from "@/schemas/property";
import {
    DEFAULT_CANCELLATION_POLICY,
    getPolicyByKey,
} from "@/constants/cancellation-policies";

await connectDB();

const LEGACY_POLICY_MAP = {
    flexible: "easy",
    moderate: "balanced",
    strict: "strict",
    "super-strict": "strict",
};

const normalizePolicyKey = (key) => LEGACY_POLICY_MAP[key] || key || DEFAULT_CANCELLATION_POLICY;

const buildCancellationRulesPayload = (policyKey) => {
    const policy = getPolicyByKey(policyKey || DEFAULT_CANCELLATION_POLICY);
    return {
        penalties: policy.penalties.map((penalty) => ({ ...penalty })),
    };
};

export const createProperty = async (data) => {
    const user = await getUser();

    if (!user || !user.isVerified || user?.isBanned) {
        return { success: false, message: "Not Allowed" };
    }

    try {
        // Convert availability dates to ISO strings before schema validation
        if (data.availabilityStartDate) {
            data.availabilityStartDate = new Date(data.availabilityStartDate).toISOString();
        }
        if (data.availabilityEndDate) {
            data.availabilityEndDate = new Date(data.availabilityEndDate).toISOString();
        }

        const safeData = propertySchema.parse(data);

        // اگر کارت شناسایی ارسال شده، آن را در User ذخیره کن
        if (data.nationalIdCard) {
            user.identityInfo = user.identityInfo || {};
            user.identityInfo.nationalIdImage = data.nationalIdCard;
            await user.save();
        }

        // ذخیره nationalIdCard در Property نیز برای backup
        const newProperty = await Property.create({
            ...safeData,
            owner: user._id,
        });

        user.properties.push(newProperty._id);
        await user.save();

        console.log("Property created with nationalIdCard:", newProperty.nationalIdCard);

        return { success: true, message: "ملک با موفقیت ایجاد شد" };
    } catch (error) {
        console.error("Create property error:", error);
        return {
            success: false,
            message: error.message || "خطایی رخ داده است",
        };
    }
};

export const editProperty = async (propertyId, data) => {
    const user = await getUser();

    if (!user || !user.isVerified || user?.isBanned) {
        return { success: false, message: "Not Allowed" };
    }

    try {
        const property = await Property.findById(propertyId);

        if (!property) {
            return { success: false, message: "ملک مورد نظر یافت نشد" };
        }

        if (property.owner.toString() !== user._id.toString()) {
            return { success: false, message: "شما اجازه ویرایش این ملک را ندارید" };
        }

        const normalizedData = { ...data };

        // اگر کارت شناسایی ارسال شده، آن را در User ذخیره/بروزرسانی کن
        if (data.nationalIdCard) {
            user.identityInfo = user.identityInfo || {};
            user.identityInfo.nationalIdImage = data.nationalIdCard;
            await user.save();
        }

        // جلوگیری از پاک شدن ناخواسته کارت شناسایی در ویرایش
        normalizedData.nationalIdCard =
            normalizedData.nationalIdCard ||
            property.nationalIdCard ||
            "";

        normalizedData.ownershipDocument =
            normalizedData.ownershipDocument ||
            property.ownershipDocument ||
            property.ownerDocument ||
            "";

        normalizedData.maxCapacity = Number(
            normalizedData.maxCapacity ??
            property.maxCapacity ??
            normalizedData.capacity ??
            property.capacity ??
            1
        );

        normalizedData.cancellationPolicy = normalizePolicyKey(
            normalizedData.cancellationPolicy || property.cancellationPolicy
        );

        if (
            !normalizedData.cancellationRules ||
            typeof normalizedData.cancellationRules !== "object" ||
            !Array.isArray(normalizedData.cancellationRules.penalties) ||
            normalizedData.cancellationRules.penalties.length === 0
        ) {
            normalizedData.cancellationRules = buildCancellationRulesPayload(
                normalizedData.cancellationPolicy
            );
        }

        if (!normalizedData.ownershipDocument) {
            return {
                success: false,
                message: "مدرک سند مالکیت الزامی است",
            };
        }

        if (!Array.isArray(normalizedData.calendarSettings)) {
            normalizedData.calendarSettings = [];
        } else {
            normalizedData.calendarSettings = normalizedData.calendarSettings.map((item) => ({
                date: item?.date ? new Date(item.date).toISOString() : undefined,
                instantBooking: Boolean(item?.instantBooking),
                lastMinuteDiscount:
                    typeof item?.lastMinuteDiscount === "number" ? item.lastMinuteDiscount : 0,
                blocked: Boolean(item?.blocked),
                customPrice:
                    item?.customPrice !== undefined && item.customPrice !== null
                        ? Number(item.customPrice)
                        : undefined,
                minimumNights:
                    item?.minimumNights !== undefined && item.minimumNights !== null
                        ? Number(item.minimumNights)
                        : undefined,
                available:
                    item?.available !== undefined && item.available !== null
                        ? Boolean(item.available)
                        : true,
            }));
        }

        if (normalizedData.availabilityStartDate) {
            normalizedData.availabilityStartDate = new Date(normalizedData.availabilityStartDate).toISOString();
        }
        if (normalizedData.availabilityEndDate) {
            normalizedData.availabilityEndDate = new Date(normalizedData.availabilityEndDate).toISOString();
        }

        if (normalizedData.pricing && typeof normalizedData.pricing === "object") {
            const pricing = normalizedData.pricing;

            const toNumberOrDefault = (value, fallback = 0) => {
                const num = Number(value);
                return Number.isFinite(num) ? num : fallback;
            };

            pricing.regularPrice = toNumberOrDefault(pricing.regularPrice, 0);
            pricing.peakPrice = toNumberOrDefault(
                pricing.peakPrice,
                pricing.regularPrice > 0 ? pricing.regularPrice : 0
            );

            // New day-of-week prices
            pricing.wednesdayPrice = toNumberOrDefault(pricing.wednesdayPrice, 0);
            pricing.thursdayPrice = toNumberOrDefault(pricing.thursdayPrice, 0);
            pricing.fridayPrice = toNumberOrDefault(pricing.fridayPrice, 0);

            if (pricing.weekendPrice === undefined || pricing.weekendPrice === null) {
                // keep it undefined (optional field)
                delete pricing.weekendPrice;
            } else {
                const weekend = Number(pricing.weekendPrice);
                if (!Number.isFinite(weekend) || weekend <= 0) {
                    // اگر مقدار نامعتبر یا غیرمثبت بود، به عنوان فیلد اختیاری حذف می‌کنیم
                    delete pricing.weekendPrice;
                } else {
                    pricing.weekendPrice = weekend;
                }
            }

            pricing.extraGuestPrice = toNumberOrDefault(pricing.extraGuestPrice, 0);
            pricing.extraGuestPeakPrice = toNumberOrDefault(pricing.extraGuestPeakPrice, 0);
            pricing.longStayDiscount = toNumberOrDefault(pricing.longStayDiscount, 0);
            pricing.discount = toNumberOrDefault(pricing.discount, 0);
            pricing.deposit = toNumberOrDefault(pricing.deposit, 10);

            normalizedData.pricing = pricing;
        }

        const safeData = propertySchema.parse(normalizedData);

        // پس از هر ویرایش، ملک باید دوباره به حالت انتظار تایید برود
        await Property.findByIdAndUpdate(
            propertyId,
            { ...safeData, status: "pending" },
            { new: true, runValidators: true }
        );

        return {
            success: true,
            message: "ملک با موفقیت ویرایش شد و در انتظار تایید مجدد است",
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || "خطا در ویرایش ملک",
        };
    }
};

export const deleteProperty = async (propertyId) => {
    const user = await getUser();

    if (!user || !user.isVerified) {
        return { success: false, message: "Not Allowed" };
    }

    try {
        const property = await Property.findById(propertyId);

        if (!property) {
            return { success: false, message: "Not Found" };
        }

        if (property.owner.toString() !== user._id.toString()) {
            return { success: false, message: "Not Allowed" };
        }

        user.properties.pull(property._id);
        await user.save();

        await Property.findByIdAndDelete(property._id);

        return { success: true, message: "ملک با موفقیت حذف گردید" };
    } catch (error) {
        return {
            success: false,
            message: error.message || "خطایی رخ داده است",
        };
    }
};
