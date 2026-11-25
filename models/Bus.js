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
        vehicle: {
            color: { type: String, required: [true, "رنگ خودرو الزامی است"] },
            type: {
                type: String,
                enum: ["bus", "minibus", "van"],
                required: [true, "نوع خودرو الزامی است"],
            },
            plate: {
                type: String,
                required: [true, "پلاک خودرو الزامی است"],
            },
            name: { type: String, required: [true, "نام خودرو الزامی است"] },
            ownerName: {
                type: String,
                required: [true, "نام صاحاب خودرو الزامی است"],
            },
            model: { type: Number, required: [true, "مدل خودرو الزامی است"] },
            capacity: {
                type: Number,
                required: [true, "ظرفیت خودرو الزامی است"],
                min: [1, "حداقل ظرفیت 1 نفر است"],
            },
        },
        amenities: {
            heating: {
                type: Boolean,
                default: false,
            },
            cooling: {
                type: Boolean,
                default: false,
            },
        },
        company: {
            name: { type: String, required: [true, "نام شرکت الزامی است"] },
        },
        from: {
            province: { type: String, required: true },
            city: { type: String, required: true },
        },
        to: {
            province: { type: String, required: true },
            city: { type: String, required: true },
        },

        departureTime: { type: String, required: true },
        arrivalTime: { type: String, required: true },

        date: { type: Date, required: true }, // تاریخ اصلی (برای سازگاری با کد قدیمی)
        isReserved: { type: Boolean, default: false }, // وضعیت رزرو کلی (برای سازگاری)

        // تاریخ‌های قابل رزرو
        availableDates: [
            {
                date: { type: Date, required: true },
                isReserved: { type: Boolean, default: false },
                isPeakSeason: { type: Boolean, default: false },
                remainingCapacity: { type: Number }, // ظرفیت باقیمانده برای این تاریخ
            },
        ],

        price: { type: Number, required: true },

        images: [String],

        // مدارک قانونی
        documents: {
            driverLicense: { type: String }, // تصویر گواهینامه
            insurance: { type: String }, // تصویر بیمه شخص ثالث
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

        totalTrips: {
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
    if (this.price) {
        const commissionRate = 0.06; // 6% کارمزد سایت
        return Math.round(this.price * (1 + commissionRate));
    }
    return this.price;
});

// Virtual field برای اطلاعات قیمت‌گذاری
schema.virtual("finalPricing").get(function () {
    if (this.price) {
        const commissionRate = 0.06; // 6% کارمزد سایت
        return {
            regularPrice: Math.round(this.price * (1 + commissionRate)),
            basePrice: this.price, // قیمت اصلی مالک
            commissionRate: commissionRate * 100, // درصد کارمزد
        };
    }
    return null;
});

schema.index({ status: 1 });
schema.index({ "vehicle.plate": 1 }, { unique: true });
schema.index({ "routes.date": 1 });
schema.index({ "routes.from.province": 1, "routes.from.city": 1 });
schema.index({ "routes.to.province": 1, "routes.to.city": 1 });

const Bus = mongoose.models?.Bus || mongoose.model("Bus", schema);

export default Bus;
