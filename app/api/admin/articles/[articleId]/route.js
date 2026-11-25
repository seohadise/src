import { NextResponse } from "next/server";

import connectDB from "@/config/db";
import Article from "@/models/Article";
import { getUser } from "@/lib/helpers";

// GET - Get single article
export async function GET(request, { params }) {
    try {
        const user = await getUser();
        
        if (!user || !user.isAdmin) {
            return NextResponse.json(
                { success: false, message: "دسترسی غیرمجاز" },
                { status: 403 }
            );
        }

        const { articleId } = await params;

        await connectDB();

        const article = await Article.findById(articleId)
            .populate("author", "fullName")
            .lean();

        if (!article) {
            return NextResponse.json(
                { success: false, message: "مقاله یافت نشد" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            article,
        });
    } catch (error) {
        console.error("Error fetching article:", error);
        return NextResponse.json(
            { success: false, message: "خطا در دریافت مقاله" },
            { status: 500 }
        );
    }
}

// PUT - Update article
export async function PUT(request, { params }) {
    try {
        const user = await getUser();
        
        if (!user || !user.isAdmin) {
            return NextResponse.json(
                { success: false, message: "دسترسی غیرمجاز" },
                { status: 403 }
            );
        }

        const { articleId } = await params;

        await connectDB();

        const body = await request.json();
        const { title, summary, content, coverImage, status, tags } = body;

        const article = await Article.findById(articleId);

        if (!article) {
            return NextResponse.json(
                { success: false, message: "مقاله یافت نشد" },
                { status: 404 }
            );
        }

        // Update fields
        if (title) article.title = title;
        if (summary !== undefined) article.summary = summary;
        if (content) article.content = content;
        if (coverImage !== undefined) article.coverImage = coverImage;
        if (tags) article.tags = tags;
        
        // Handle status change
        if (status && status !== article.status) {
            article.status = status;
            if (status === "published" && !article.publishedAt) {
                article.publishedAt = new Date();
            }
        }

        await article.save();

        return NextResponse.json({
            success: true,
            message: "مقاله با موفقیت بروزرسانی شد",
            article,
        });
    } catch (error) {
        console.error("Error updating article:", error);
        return NextResponse.json(
            { success: false, message: "خطا در بروزرسانی مقاله" },
            { status: 500 }
        );
    }
}

// DELETE - Delete article
export async function DELETE(request, { params }) {
    try {
        const user = await getUser();
        
        if (!user || !user.isAdmin) {
            return NextResponse.json(
                { success: false, message: "دسترسی غیرمجاز" },
                { status: 403 }
            );
        }

        const { articleId } = await params;

        await connectDB();

        const article = await Article.findByIdAndDelete(articleId);

        if (!article) {
            return NextResponse.json(
                { success: false, message: "مقاله یافت نشد" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "مقاله با موفقیت حذف شد",
        });
    } catch (error) {
        console.error("Error deleting article:", error);
        return NextResponse.json(
            { success: false, message: "خطا در حذف مقاله" },
            { status: 500 }
        );
    }
}
