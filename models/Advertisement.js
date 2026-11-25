import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "ملک الزامی است"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "مالک الزامی است"],
    },
    type: {
      type: String,
      enum: ["featured", "premium", "boost", "highlight"],
      required: [true, "نوع تبلیغ الزامی است"],
    },
    duration: {
      type: Number, // تعداد روز
      required: [true, "مدت زمان تبلیغ الزامی است"],
      min: [1, "حداقل مدت تبلیغ 1 روز است"],
      max: [365, "حداکثر مدت تبلیغ 365 روز است"],
    },
    price: {
      type: Number,
      required: [true, "قیمت تبلیغ الزامی است"],
      min: [0, "قیمت نمی‌تواند منفی باشد"],
    },
    startDate: {
      type: Date,
      required: [true, "تاریخ شروع الزامی است"],
    },
    endDate: {
      type: Date,
      required: [true, "تاریخ پایان الزامی است"],
    },
    status: {
      type: String,
      enum: ["pending", "active", "expired", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentTrackingCode: {
      type: String,
      default: null,
    },
    views: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    impressions: {
      type: Number,
      default: 0,
    },
    // تنظیمات تبلیغ
    settings: {
      showOnHomepage: {
        type: Boolean,
        default: false,
      },
      showInSearch: {
        type: Boolean,
        default: true,
      },
      priority: {
        type: Number,
        default: 1,
        min: [1, "حداقل اولویت 1 است"],
        max: [10, "حداکثر اولویت 10 است"],
      },
    },
    // یادداشت‌های مدیریت
    adminNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ایندکس‌ها
schema.index({ property: 1, status: 1 });
schema.index({ owner: 1, status: 1 });
schema.index({ status: 1, endDate: 1 });
schema.index({ type: 1, status: 1 });

// متد محاسبه CTR (Click Through Rate)
schema.methods.getCTR = function() {
  if (this.impressions === 0) return 0;
  return ((this.clicks / this.impressions) * 100).toFixed(2);
};

// متد بررسی انقضا
schema.methods.isExpired = function() {
  return new Date() > this.endDate;
};

// متد استاتیک برای دریافت تبلیغات فعال
schema.statics.getActiveAds = function(type = null) {
  const query = {
    status: "active",
    paymentStatus: "paid",
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  };
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query)
    .populate("property")
    .populate("owner", "fullName")
    .sort({ "settings.priority": -1, createdAt: -1 });
};

// متد استاتیک برای آمار تبلیغات
schema.statics.getAdStats = async function(ownerId, startDate, endDate) {
  const matchStage = { owner: ownerId };
  
  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: "$price" },
        totalAds: { $sum: 1 },
        totalViews: { $sum: "$views" },
        totalClicks: { $sum: "$clicks" },
        totalImpressions: { $sum: "$impressions" },
        activeAds: {
          $sum: {
            $cond: [{ $eq: ["$status", "active"] }, 1, 0]
          }
        },
      },
    },
  ]);
  
  return stats[0] || {
    totalSpent: 0,
    totalAds: 0,
    totalViews: 0,
    totalClicks: 0,
    totalImpressions: 0,
    activeAds: 0,
  };
};

// Pre-save middleware برای بروزرسانی وضعیت
schema.pre('save', function(next) {
  if (this.isExpired() && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

const Advertisement = mongoose.models?.Advertisement || mongoose.model("Advertisement", schema);

export default Advertisement;
