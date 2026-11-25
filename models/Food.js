import mongoose from "mongoose";

import User from "./User";
import Reservation from "./Reservation";

const schema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        phone: {
            type: String,
            required: [true, "شماره تلفن الزامی است"],
        },
        address: {
            province: { type: String, required: [true, "استان الزامی است"] },
            city: { type: String, required: [true, "شهر الزامی است"] },
            fullAddress: {
                type: String,
                required: [true, "آدرس کامل الزامی است"],
            },
            location: {
                lat: { type: String, required: [true, "موقعیت جغرافیایی الزامی است"] },
                lng: { type: String, required: [true, "موقعیت جغرافیایی الزامی است"] },
            },
        },
        dailyCapacity: {
            type: Number,
            required: [true, "ظرفیت پخت روزانه الزامی است"],
            min: [1, "حداقل ظرفیت 1 پرس است"],
        },
        foods: [String],
        availableDates: [
            {
                date: {
                    type: Date,
                    required: [true, "available date is required"],
                },
                remainingCapacity: { type: Number },
                isReserved: { type: Boolean, default: false },
            },
        ],
        staff: {
            chef: {
                name: { type: String, required: [true, "نام سرآشپز الزامی است"] },
            },
            cooks: [
                {
                    name: { type: String, required: true },
                },
            ],
        },
        // مدارک بهداشتی
        documents: {
            healthCard: { type: String }, // تصویر کارت سلامت
        },
        // ساعات کاری
        workingHours: {
            startTime: {
                type: String,
                required: [true, "ساعت شروع کار الزامی است"],
                default: "08:00",
            },
            endTime: {
                type: String,
                required: [true, "ساعت پایان کار الزامی است"],
                default: "22:00",
            },
            workingDays: {
                type: [String],
                enum: [
                    "saturday",
                    "sunday",
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                ],
                default: ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday"],
            },
            isActive: {
                type: Boolean,
                default: true,
            },
        },
        images: [String],
        pricing: {
            basePrice: { type: Number, required: [true, "قیمت پایه الزامی است"] },
            minimumOrder: { type: Number, default: 1 },
        },
        comments: [
            {
                name: String,
                text: String,
                rating: {
                    type: Number,
                    min: [1, "Minimum Rating is 1"],
                    max: [5, "Maximum Rating is 5"],
                    default: 5,
                },
                reply: {
                    name: String,
                    text: String,
                },
                isApproved: { type: Boolean, default: false },
                createdAt: { type: Date, default: Date.now },
            },
        ],
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        rejectReason: {
            type: String,
            default: "",
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        reviewedAt: {
            type: Date,
        },
        averageRating: {
            type: Number,
            default: 0,
        },
        totalOrders: {
            type: Number,
            default: 0,
        },

        reservations: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Reservation",
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Virtual field برای قیمت نهایی (شامل کارمزد 6%)
schema.virtual("finalPrice").get(function () {
    if (this.pricing?.basePrice) {
        const commissionRate = 0.06; // 6% کارمزد سایت
        return Math.round(this.pricing.basePrice * (1 + commissionRate));
    }
    return this.pricing?.basePrice;
});

// Virtual field برای اطلاعات قیمت‌گذاری
schema.virtual("finalPricing").get(function () {
    if (this.pricing?.basePrice) {
        const commissionRate = 0.06; // 6% کارمزد سایت
        return {
            basePrice: Math.round(this.pricing.basePrice * (1 + commissionRate)),
            originalBasePrice: this.pricing.basePrice, // قیمت اصلی مالک
            minimumOrder: this.pricing.minimumOrder,
            commissionRate: commissionRate * 100, // درصد کارمزد
        };
    }
    return null;
});

schema.index({ "address.province": 1, "address.city": 1 });
schema.index({ status: 1 });
schema.index({ "availableDates.date": 1 });

const Food = mongoose.models?.Food || mongoose.model("Food", schema);

export default Food;
