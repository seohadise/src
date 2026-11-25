"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Uploader from "@/components/global/uplodaer";
import RichTextEditor from "@/components/magazine/rich-text-editor";

import { toast } from "sonner";
import { ArrowRight, Loader2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const NewArticlePage = () => {
  const router = useRouter();
  
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] = useState("draft");
  const [tags, setTags] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post("/api/admin/articles", data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        router.push("/iso/magazine");
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "خطا در ایجاد مقاله");
    },
  });

  const handleImageUpload = (url) => {
    setCoverImage(url);
    toast.success("تصویر با موفقیت آپلود شد");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("عنوان مقاله الزامی است");
      return;
    }

    if (!content.trim()) {
      toast.error("محتوای مقاله الزامی است");
      return;
    }

    const tagsArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);

    mutate({
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      coverImage,
      status,
      tags: tagsArray,
    });
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/iso/magazine">
          <Button variant="outline" size="icon">
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">مقاله جدید</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>تصویر کاور</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                {coverImage ? (
                  <div className="relative w-full aspect-video">
                    <Image
                      src={coverImage}
                      alt="Cover"
                      fill
                      className="object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 left-2"
                      onClick={() => setCoverImage("")}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-full aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center">
                    <Uploader
                      title="آپلود تصویر کاور"
                      onUpload={handleImageUpload}
                      className="mb-2"
                    />
                    <span className="text-sm text-muted-foreground">
                      فرمت‌های مجاز: JPG, PNG, WebP
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>اطلاعات مقاله</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">عنوان مقاله *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="عنوان مقاله را وارد کنید"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="summary">خلاصه</Label>
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="خلاصه‌ای از مقاله (اختیاری)"
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="content">محتوای مقاله *</Label>
                <div className="mt-1">
                  <RichTextEditor value={content} onChange={setContent} />
                </div>
              </div>

              <div>
                <Label htmlFor="tags">برچسب‌ها</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="برچسب‌ها را با کاما جدا کنید (مثال: سفر، گردشگری، طبیعت)"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="status">وضعیت</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="انتخاب وضعیت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">پیش‌نویس</SelectItem>
                    <SelectItem value="published">انتشار</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  در حال ذخیره...
                </>
              ) : (
                "ذخیره مقاله"
              )}
            </Button>
            <Link href="/iso/magazine" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                انصراف
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewArticlePage;
