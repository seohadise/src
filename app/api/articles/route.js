import { NextResponse } from "next/server";

import connectDB from "@/config/db";
import Article from "@/models/Article";

// GET - Get published articles (public)
export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 12;
        const tag = searchParams.get("tag");

        const query = { status: "published" };
        if (tag) {
            query.tags = tag;
        }

        const skip = (page - 1) * limit;

        const [articles, total] = await Promise.all([
            Article.find(query)
                .populate("author", "fullName")
                .sort({ publishedAt: -1 })
                .skip(skip)
                .limit(limit)
                .select("-content")
                .lean(),
            Article.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            articles,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching articles:", error);
        return NextResponse.json(
            { success: false, message: "خطا در دریافت مقالات" },
            { status: 500 }
        );
    }
}
