import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Visit from "@/models/Visit";
import { getUser } from "@/lib/helpers";

export const POST = async (req) => {
  try {
    await connectDB();

    const body = await req.json();
    const { path, pageType, itemId, itemType, referrer } = body;

    // Get IP address
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : req.headers.get("x-real-ip") || "unknown";

    // Get user agent
    const userAgent = req.headers.get("user-agent") || "";

    // Get logged in user (optional)
    let user = null;
    try {
      const userData = await getUser();
      if (userData) {
        user = userData._id;
      }
    } catch (error) {
      // User not logged in, continue without user
    }

    // Create visit record
    const visit = await Visit.create({
      path,
      pageType: pageType || "other",
      itemId: itemId || undefined,
      itemType: itemType || undefined,
      ip,
      userAgent,
      user,
      referrer,
      visitDate: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Visit recorded",
    });
  } catch (error) {
    console.error("Error recording visit:", error);
    return NextResponse.json(
      { success: false, message: "Error recording visit" },
      { status: 500 }
    );
  }
};

// GET endpoint for admin to fetch visit stats
export const GET = async (req) => {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days")) || 7;

    const [dailyStats, todayStats, pageTypeStats] = await Promise.all([
      Visit.getDailyStats(days),
      Visit.getTodayStats(),
      Visit.getPageTypeStats(days),
    ]);

    // Get total visits
    const totalVisits = await Visit.countDocuments();

    return NextResponse.json({
      success: true,
      data: {
        dailyStats,
        todayStats,
        pageTypeStats,
        totalVisits,
      },
    });
  } catch (error) {
    console.error("Error fetching visit stats:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching visit stats" },
      { status: 500 }
    );
  }
};
