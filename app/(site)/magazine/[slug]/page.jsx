import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import connectDB from "@/config/db";
import Article from "@/models/Article";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Eye } from "lucide-react";
import ShareButton from "@/components/magazine/share-button";

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

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  await connectDB();
  const article = await Article.findOne(buildArticleSlugQuery(slug)).lean();
  
  if (!article) {
    return {
      title: "مقاله یافت نشد",
    };
  }
  
  return {
    title: `${article.title} | مجله تریپ گود`,
    description: article.summary || article.title,
    openGraph: {
      title: article.title,
      description: article.summary || article.title,
      images: article.coverImage ? [article.coverImage] : [],
    },
  };
}

const ArticlePage = async ({ params }) => {
  const { slug } = await params;
  
  await connectDB();

  // Find and increment views
  const article = await Article.findOneAndUpdate(
    buildArticleSlugQuery(slug),
    { $inc: { views: 1 } },
    { new: true }
  )
    .lean();

  if (!article) {
    notFound();
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link href="/magazine">
          <Button variant="outline" size="sm">
            <ArrowRight className="w-4 h-4 ml-2" />
            بازگشت به مجله
          </Button>
        </Link>
      </div>

      <article className="max-w-4xl mx-auto">
        {/* Cover Image */}
        {article.coverImage && (
          <div className="relative aspect-video mb-8 rounded-xl overflow-hidden">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Title and Meta */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {article.publishedAt
                ? new Date(article.publishedAt).toLocaleDateString("fa-IR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : new Date(article.createdAt).toLocaleDateString("fa-IR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {article.views?.toLocaleString("fa-IR") || 0} بازدید
            </span>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {article.tags.map((tag, index) => (
                <Link key={index} href={`/magazine?tag=${tag}`}>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </header>

        {/* Summary */}
        {article.summary && (
          <div className="bg-muted/50 p-4 rounded-lg mb-8 text-lg text-muted-foreground">
            {article.summary}
          </div>
        )}

        {/* Content */}
        <div 
          className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-primary prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Share */}
        <div className="mt-10 pt-6 border-t">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">اشتراک‌گذاری:</span>
            <ShareButton title={article.title} />
          </div>
        </div>
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">مقالات مرتبط</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((relatedArticle) => (
              <Link key={relatedArticle._id} href={`/magazine/${relatedArticle.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group">
                  <div className="relative aspect-video">
                    {relatedArticle.coverImage ? (
                      <Image
                        src={relatedArticle.coverImage}
                        alt={relatedArticle.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="text-3xl">📰</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold line-clamp-2 group-hover:text-primary transition-colors">
                      {relatedArticle.title}
                    </h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ArticlePage;
