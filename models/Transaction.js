import mongoose from "mongoose";

import User from "./User";

const schema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        amount: {
            type: Number,
            required: [true, "Transaction Amount is required"],
        },
        type: {
            type: String,
            enum: ["withdraw", "deposit", "income", "expense", "refund"],
        },
        description: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "completed",
        },
        relatedModel: {
            type: String,
            enum: ["Reservation", "Payment", "Commission", "WithdrawalRequest"],
            default: null,
        },
        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Transaction = mongoose.models?.Transaction || mongoose.model("Transaction", schema);

export default Transaction;
