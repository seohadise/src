"use client";

import Image from "next/image";
import Link from "next/link";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { toast } from "sonner";
import { Eye, Pencil, Trash2 } from "lucide-react";

const ArticleDetailsDialog = ({ article }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>جزئیات مقاله</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {article.coverImage && (
            <div className="relative aspect-video w-full">
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">عنوان:</span>
              <p className="font-medium">{article.title}</p>
            </div>
            <div>
              <span className="text-muted-foreground">نویسنده:</span>
              <p className="font-medium">{article.author?.fullName || "نامشخص"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">وضعیت:</span>
              <Badge variant={article.status === "published" ? "success" : "secondary"}>
                {article.status === "published" ? "منتشر شده" : "پیش‌نویس"}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">بازدید:</span>
              <p className="font-medium">{article.views?.toLocaleString("fa-IR") || 0}</p>
            </div>
            <div>
              <span className="text-muted-foreground">تاریخ ایجاد:</span>
              <p className="font-medium">
                {new Date(article.createdAt).toLocaleDateString("fa-IR")}
              </p>
            </div>
            {article.publishedAt && (
              <div>
                <span className="text-muted-foreground">تاریخ انتشار:</span>
                <p className="font-medium">
                  {new Date(article.publishedAt).toLocaleDateString("fa-IR")}
                </p>
              </div>
            )}
          </div>

          {article.summary && (
            <div>
              <span className="text-muted-foreground text-sm">خلاصه:</span>
              <p className="text-sm mt-1">{article.summary}</p>
            </div>
          )}

          {article.tags && article.tags.length > 0 && (
            <div>
              <span className="text-muted-foreground text-sm">برچسب‌ها:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {article.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <span className="text-muted-foreground text-sm">محتوا:</span>
            <div 
              className="prose prose-sm max-w-none mt-2 p-4 bg-muted/50 rounded-lg"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DeleteArticleButton = ({ articleId }) => {
  const [open, setOpen] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const response = await axios.delete(`/api/admin/articles/${articleId}`);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setOpen(false);
        setTimeout(() => location.reload(), 1000);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "خطا در حذف مقاله");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>حذف مقاله</DialogTitle>
        </DialogHeader>
        <p>آیا از حذف این مقاله اطمینان دارید؟</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            انصراف
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutate()}
            disabled={isPending}
          >
            {isPending ? "در حال حذف..." : "حذف"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const columns = [
  {
    accessorKey: "coverImage",
    header: "تصویر",
    cell: ({ row }) => {
      const article = row.original;
      return article.coverImage ? (
        <div className="relative w-16 h-12">
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            className="object-cover rounded"
          />
        </div>
      ) : (
        <div className="w-16 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
          بدون تصویر
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    header: "عنوان",
  },
  {
    accessorKey: "author.fullName",
    header: "نویسنده",
    cell: ({ row }) => row.original.author?.fullName || "نامشخص",
  },
  {
    accessorKey: "status",
    header: "وضعیت",
    cell: ({ row }) => {
      const article = row.original;
      return (
        <Badge variant={article.status === "published" ? "success" : "secondary"}>
          {article.status === "published" ? "منتشر شده" : "پیش‌نویس"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "views",
    header: "بازدید",
    cell: ({ row }) => row.original.views?.toLocaleString("fa-IR") || 0,
  },
  {
    accessorKey: "createdAt",
    header: "تاریخ ایجاد",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("fa-IR"),
  },
  {
    id: "actions",
    header: "عملیات",
    cell: ({ row }) => {
      const article = row.original;
      return (
        <div className="flex items-center gap-2">
          <ArticleDetailsDialog article={article} />
          <Link href={`/iso/magazine/edit/${article._id}`}>
            <Button variant="outline" size="sm">
              <Pencil className="w-4 h-4" />
            </Button>
          </Link>
          <DeleteArticleButton articleId={article._id} />
        </div>
      );
    },
  },
];
