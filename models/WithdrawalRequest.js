import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "کاربر الزامی است"],
        },
        amount: {
            type: Number,
            required: [true, "مبلغ درخواست الزامی است"],
            min: [1000, "حداقل مبلغ برداشت 1,000 تومان است"],
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "completed"],
            default: "pending",
        },
        bankInfo: {
            shebaNumber: {
                type: String,
                required: [true, "شماره شبا الزامی است"],
            },
            accountNumber: {
                type: String,
                required: [true, "شماره حساب الزامی است"],
            },
            cardNumber: {
                type: String,
                required: [true, "شماره کارت الزامی است"],
            },
            ownerName: {
                type: String,
                required: [true, "نام صاحب حساب الزامی است"],
            },
        },
        adminNotes: {
            type: String,
            default: "",
        },
        processedAt: {
            type: Date,
            default: null,
        },
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        trackingCode: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// ایندکس‌ها
schema.index({ user: 1, status: 1 });
schema.index({ status: 1, createdAt: -1 });

const WithdrawalRequest =
    mongoose.models?.WithdrawalRequest || mongoose.model("WithdrawalRequest", schema);

export default WithdrawalRequest;
