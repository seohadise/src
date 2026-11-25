import { NextResponse } from "next/server";

import connectDB from "@/config/db";
import Article from "@/models/Article";
import { getUser } from "@/lib/helpers";

// GET - Get all articles (admin)
export async function GET(request) {
    try {
        const user = await getUser();
        
        if (!user || !user.isAdmin) {
            return NextResponse.json(
                { success: false, message: "دسترسی غیرمجاز" },
                { status: 403 }
            );
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 10;
        const status = searchParams.get("status");

        const query = {};
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const [articles, total] = await Promise.all([
            Article.find(query)
                .populate("author", "fullName")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
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

// POST - Create new article
export async function POST(request) {
    try {
        const user = await getUser();
        
        if (!user || !user.isAdmin) {
            return NextResponse.json(
                { success: false, message: "دسترسی غیرمجاز" },
                { status: 403 }
            );
        }

        await connectDB();

        const body = await request.json();
        const { title, summary, content, coverImage, status, tags } = body;

        if (!title || !content) {
            return NextResponse.json(
                { success: false, message: "عنوان و محتوا الزامی است" },
                { status: 400 }
            );
        }

        // Generate unique slug
        let slug = title
            .toLowerCase()
            .replace(/[^\u0600-\u06FFa-z0-9\s]/g, "")
            .replace(/\s+/g, "-")
            .substring(0, 100);

        // Check if slug exists
        const existingArticle = await Article.findOne({ slug });
        if (existingArticle) {
            slug = `${slug}-${Date.now()}`;
        }

        const article = await Article.create({
            title,
            slug,
            summary: summary || "",
            content,
            coverImage: coverImage || "",
            author: user._id,
            status: status || "draft",
            tags: tags || [],
            publishedAt: status === "published" ? new Date() : null,
        });

        return NextResponse.json({
            success: true,
            message: "مقاله با موفقیت ایجاد شد",
            article,
        });
    } catch (error) {
        console.error("Error creating article:", error);
        return NextResponse.json(
            { success: false, message: "خطا در ایجاد مقاله" },
            { status: 500 }
        );
    }
}
