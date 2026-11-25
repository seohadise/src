import mongoose from "mongoose";

import User from "./User";
import "./Property";
import "./Bus";
import "./Food";

const schema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        targetUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        authority: {
            type: String,
            required: [true, "Payment Authority is required"],
        },
        amount: {
            type: Number,
            required: [true, "Payment Amount is required"],
        },
        status: {
            type: String,
            enum: ["pending", "paid", "failed", "success"],
            default: "pending",
        },
        trackingCode: {
            type: String,
            default: null,
        },
        // اطلاعات رزرو
        propertyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            default: null,
        },
        basePrice: {
            type: Number,
            default: null,
        },
        finalPrice: {
            type: Number,
            default: null,
        },
        depositAmount: {
            type: Number,
            default: null,
        },
        commissionAmount: {
            type: Number,
            default: null,
        },
        taxAmount: {
            type: Number,
            default: null,
        },
        taxRate: {
            type: Number,
            default: 10,
        },
        depositRate: {
            type: Number,
            default: null,
        },
        commissionRate: {
            type: Number,
            default: 6,
        },
        checkInDate: {
            type: Date,
            default: null,
        },
        checkOutDate: {
            type: Date,
            default: null,
        },
        guests: {
            adults: { type: Number, default: 1 },
            children: { type: Number, default: 0 },
        },
        // اطلاعات رزرو اتوبوس
        busId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Bus",
            default: null,
        },
        busDate: {
            type: Date,
            default: null,
        },
        // اطلاعات رزرو غذا
        foodId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Food",
            default: null,
        },
        foodDates: {
            type: [Date],
            default: [],
        },
        // فیلدهای اضافی برای سازگاری
        date: {
            type: Date,
            default: null,
        },
        dates: {
            type: [Date],
            default: [],
        },
        quantity: {
            type: Number,
            default: 1,
        },
        // فیلدهای اضافی برای تأیید پرداخت
        refId: {
            type: String,
            default: null,
        },
        cardPan: {
            type: String,
            default: null,
        },
        cardHash: {
            type: String,
            default: null,
        },
        errorCode: {
            type: Number,
            default: null,
        },
        errorMessage: {
            type: String,
            default: null,
        },
        // فیلدهای عمومی
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        itemType: {
            type: String,
            enum: ["property", "bus", "food", "wallet"],
            default: null,
        },
        description: {
            type: String,
            default: "",
        },
        // فیلدهای کیف پول
        walletUsed: {
            type: Number,
            default: 0,
        },
        remainingAmount: {
            type: Number,
            default: null,
        },
        nights: {
            type: Number,
            default: 1,
        },
    },
    {
        timestamps: true,
    }
);

const Payment = mongoose.models?.Payment || mongoose.model("Payment", schema);

export default Payment;
