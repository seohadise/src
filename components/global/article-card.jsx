import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Eye } from "lucide-react";

const ArticleCard = ({ article }) => {
  return (
    <Link href={`/magazine/${article.slug}`}>
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
  );
};

export default ArticleCard;
