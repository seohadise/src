import { NextResponse } from "next/server";

import connectDB from "@/config/db";
import Article from "@/models/Article";

const buildSlugCandidates = (rawSlug) => {
    const candidates = new Set();
    const push = (value) => {
        if (typeof value !== "string") return;
        const v = value.trim();
        if (v) candidates.add(v);
    };

    push(rawSlug);

    try {
        push(decodeURIComponent(rawSlug));
    } catch {
        // Ignore invalid URI sequences
    }

    for (const base of Array.from(candidates)) {
        push(base.normalize("NFKC"));

        const normalizedFa = base
            .normalize("NFKC")
            .replace(/\u200c/g, "-")
            .replace(/ي/g, "ی")
            .replace(/ك/g, "ک")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
            .toLowerCase();

        push(normalizedFa);
    }

    return Array.from(candidates);
};

const buildArticleSlugQuery = (slug) => {
    const slugCandidates = buildSlugCandidates(slug);
    return {
        status: "published",
        slug: { $in: slugCandidates },
    };
};

// GET - Get single article by slug (public)
export async function GET(request, { params }) {
    try {
        const { slug } = await params;

        await connectDB();

        const article = await Article.findOneAndUpdate(
            buildArticleSlugQuery(slug),
            { $inc: { views: 1 } },
            { new: true }
        )
            .populate("author", "fullName")
            .lean();

        if (!article) {
            return NextResponse.json(
                { success: false, message: "مقاله یافت نشد" },
                { status: 404 }
            );
        }

        // Get related articles
        const relatedArticles = await Article.find({
            _id: { $ne: article._id },
            status: "published",
            tags: { $in: article.tags || [] },
        })
            .select("-content")
            .limit(3)
            .lean();

        return NextResponse.json({
            success: true,
            article,
            relatedArticles,
        });
    } catch (error) {
        console.error("Error fetching article:", error);
        return NextResponse.json(
            { success: false, message: "خطا در دریافت مقاله" },
            { status: 500 }
        );
    }
}
