import Link from "next/link";
import Image from "next/image";

import connectDB from "@/config/db";
import Article from "@/models/Article";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Eye } from "lucide-react";

export const metadata = {
  title: "مجله تریپ گود | مقالات گردشگری و سفر",
  description: "آخرین مقالات و راهنماهای سفر و گردشگری در ایران",
};

const MagazinePage = async ({ searchParams }) => {
  await connectDB();

  const page = parseInt(searchParams?.page) || 1;
  const limit = 12;
  const skip = (page - 1) * limit;
  const tag = searchParams?.tag;

  const query = { status: "published" };
  if (tag) {
    query.tags = tag;
  }

  const [articles, total] = await Promise.all([
    Article.find(query)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Article.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">مجله تریپ گود</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          آخرین مقالات، راهنماها و نکات سفر برای تجربه بهتر گردشگری در ایران
        </p>
      </div>

      {tag && (
        <div className="mb-6 flex items-center gap-2">
          <span className="text-muted-foreground">برچسب:</span>
          <Badge variant="secondary">{tag}</Badge>
          <Link href="/magazine" className="text-sm text-primary hover:underline">
            حذف فیلتر
          </Link>
        </div>
      )}

      {articles.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link key={article._id} href={`/magazine/${article.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group">
                  <div className="relative aspect-video">
                    {article.coverImage ? (
                      <Image
                        src={article.coverImage}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="text-4xl">📰</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h2 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h2>
                    {article.summary && (
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {article.summary}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {article.views?.toLocaleString("fa-IR") || 0}
                        </span>
                      </div>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {article.publishedAt
                          ? new Date(article.publishedAt).toLocaleDateString("fa-IR")
                          : new Date(article.createdAt).toLocaleDateString("fa-IR")}
                      </span>
                    </div>
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {article.tags.slice(0, 3).map((articleTag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {articleTag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {page > 1 && (
                <Link
                  href={`/magazine?page=${page - 1}${tag ? `&tag=${tag}` : ""}`}
                  className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                >
                  قبلی
                </Link>
              )}
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <Link
                    key={pageNum}
                    href={`/magazine?page=${pageNum}${tag ? `&tag=${tag}` : ""}`}
                    className={`px-4 py-2 border rounded-lg transition-colors ${
                      page === pageNum
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {pageNum.toLocaleString("fa-IR")}
                  </Link>
                );
              })}
              
              {page < totalPages && (
                <Link
                  href={`/magazine?page=${page + 1}${tag ? `&tag=${tag}` : ""}`}
                  className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                >
                  بعدی
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">هنوز مقاله‌ای منتشر نشده است</p>
        </div>
      )}
    </div>
  );
};

export default MagazinePage;
