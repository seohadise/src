import mongoose from "mongoose";

const visitSchema = new mongoose.Schema(
  {
    // Page path visited
    path: {
      type: String,
      required: true,
    },
    // Page type (home, property, bus, food, search, etc.)
    pageType: {
      type: String,
      enum: ["home", "property", "bus", "food", "search", "other"],
      default: "other",
    },
    // Item ID if visiting a specific item (property, bus, food)
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "itemType",
    },
    itemType: {
      type: String,
      enum: ["Property", "Bus", "Food"],
    },
    // Visitor info
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    // Logged in user (optional)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Referrer
    referrer: {
      type: String,
    },
    // Visit date (stored separately for easier querying)
    visitDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
visitSchema.index({ visitDate: -1 });
visitSchema.index({ pageType: 1, visitDate: -1 });
visitSchema.index({ path: 1, visitDate: -1 });
visitSchema.index({ ip: 1, visitDate: -1 });

const IRAN_TZ = "+03:30";

// Static method to get daily visit stats
visitSchema.statics.getDailyStats = async function (days = 7) {
  const now = new Date();
  const startDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tehran" }));
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const stats = await this.aggregate([
    {
      $match: {
        visitDate: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: { date: "$visitDate", timezone: IRAN_TZ } },
          month: { $month: { date: "$visitDate", timezone: IRAN_TZ } },
          day: { $dayOfMonth: { date: "$visitDate", timezone: IRAN_TZ } },
        },
        totalVisits: { $sum: 1 },
        uniqueVisitors: { $addToSet: "$ip" },
      },
    },
    {
      $project: {
        _id: 0,
        date: {
          $dateFromParts: {
            year: "$_id.year",
            month: "$_id.month",
            day: "$_id.day",
            timezone: IRAN_TZ,
          },
        },
        totalVisits: 1,
        uniqueVisitors: { $size: "$uniqueVisitors" },
      },
    },
    {
      $sort: { date: 1 },
    },
  ]);

  return stats;
};

// Static method to get today's stats
visitSchema.statics.getTodayStats = async function () {
  const now = new Date();
  const nowIran = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tehran" }));
  const todayStart = new Date(nowIran);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(nowIran);
  todayEnd.setHours(23, 59, 59, 999);

  const stats = await this.aggregate([
    {
      $match: {
        visitDate: { $gte: todayStart, $lte: todayEnd },
      },
    },
    {
      $group: {
        _id: null,
        totalVisits: { $sum: 1 },
        uniqueVisitors: { $addToSet: "$ip" },
      },
    },
    {
      $project: {
        _id: 0,
        totalVisits: 1,
        uniqueVisitors: { $size: "$uniqueVisitors" },
      },
    },
  ]);

  return stats[0] || { totalVisits: 0, uniqueVisitors: 0 };
};

// Static method to get page type stats
visitSchema.statics.getPageTypeStats = async function (days = 7) {
  const now = new Date();
  const startDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tehran" }));
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const stats = await this.aggregate([
    {
      $match: {
        visitDate: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$pageType",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  return stats;
};

const Visit = mongoose.models.Visit || mongoose.model("Visit", visitSchema);

export default Visit;
