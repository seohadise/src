import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "کاربر الزامی است"],
    },
    itemType: {
      type: String,
      enum: ["property", "bus", "food"],
      required: [true, "نوع آیتم الزامی است"],
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "شناسه آیتم الزامی است"],
    },
    text: {
      type: String,
      required: [true, "متن نظر الزامی است"],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, "امتیاز الزامی است"],
      min: [1, "حداقل امتیاز 1 است"],
      max: [5, "حداکثر امتیاز 5 است"],
    },
    reply: {
      type: String,
      default: null,
    },
    replyDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
  },
  {
    timestamps: true,
  }
);

// ایندکس برای جستجوی سریع‌تر
schema.index({ itemType: 1, itemId: 1 });
schema.index({ user: 1 });

const Comment = mongoose.models?.Comment || mongoose.model("Comment", schema);

export default Comment;
