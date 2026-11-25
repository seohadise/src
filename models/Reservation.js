import mongoose from "mongoose";

// Import all models that can be referenced
import "./User";
import "./Property";
import "./Bus";
import "./Food";

const schema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        targetUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        itemType: {
            type: String,
            enum: ["property", "bus", "food"],
            required: true,
        },
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: "itemModel",
        },
        itemModel: {
            type: String,
            enum: ["Property", "Bus", "Food"],
        },
        // برای رزرو ملک
        checkInDate: {
            type: Date,
        },
        checkOutDate: {
            type: Date,
        },
        // برای رزرو اتوبوس
        date: {
            type: Date,
        },
        // برای رزرو غذا
        dates: [
            {
                type: Date,
            },
        ],
        quantity: {
            type: Number,
            default: 1,
        },
        guests: {
            adults: { type: Number, default: 1 },
            children: { type: Number, default: 0 },
        },
        // فیلدهای مختلف برای مبلغ
        amount: {
            type: Number,
            required: true,
        },
        totalPrice: {
            type: Number,
        },
        basePrice: {
            type: Number,
        },
        commissionAmount: {
            type: Number,
        },
        depositAmount: {
            type: Number,
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled", "completed", "rejected"],
            default: "pending",
        },
        specialRequests: {
            type: String,
            default: "",
        },
        // ارتباط با پرداخت
        payment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Payment",
        },
        contactInfo: {
            name: String,
            phone: String,
            email: String,
        },
        // اطلاعات مالی برای واریز پس از تایید
        financialDetails: {
            basePrice: Number,
            taxAmount: Number,
            commissionAmount: Number,
            adminAmount: Number,
            ownerAmount: Number,
            totalPaid: Number,
            isPaid: { type: Boolean, default: false }, // آیا واریز انجام شده؟
        },
    },
    {
        timestamps: true,
    }
);

schema.index({ user: 1, status: 1 });
schema.index({ itemType: 1, itemId: 1 });
schema.index({ startDate: 1, endDate: 1 });

const Reservation = mongoose.models?.Reservation || mongoose.model("Reservation", schema);

export default Reservation;
