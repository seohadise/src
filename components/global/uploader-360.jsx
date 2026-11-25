"use client";

import imageCompression from "browser-image-compression";

import { useEffect, useId, useState } from "react";

import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

import { buttonVariants } from "../ui/button";

import { cn } from "@/lib/utils";

import { Loader2, X, Eye } from "lucide-react";

const Uploader360 = ({ onUpload, title, className, reset, value = [] }) => {
  const uniqueId = useId();

  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [uploadedUrls, setUploadedUrls] = useState(value || []);

  useEffect(() => {
    setUploadedUrls(value || []);
  }, [value]);

  useEffect(() => {
    setUploadedCount(0);
    setError("");
    if (reset) {
      setUploadedUrls([]);
    }
  }, [reset]);

  const handleChange = async (e) => {
    const files = Array.from(e.target.files);

    if (!files.length) return;

    // بررسی تعداد فایل‌ها
    if (uploadedUrls.length + files.length > 3) {
      setError("حداکثر 3 تصویر 360 درجه مجاز است");
      return;
    }

    // بررسی نوع فایل‌ها
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setError("فقط فایل‌های تصویری (JPG, PNG, WebP) مجاز هستند");
      return;
    }

    // بررسی حجم فایل‌ها
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024); // 10MB
    if (oversizedFiles.length > 0) {
      setError("حجم هر تصویر نباید بیشتر از 10 مگابایت باشد");
      return;
    }

    setError("");

    try {
      setUploading(true);

      const options = {
        maxSizeMB: 2,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
      };

      const urls = [];
      const uploadPromises = files.map(async (file) => {
        const compressedFile = await imageCompression(file, options);

        const formData = new FormData();
        formData.append("file", compressedFile);
        formData.append("folder", "360-images");
        formData.append("originalName", file.name);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Upload failed");
        }

        const data = await res.json();
        urls.push(data.url);
        setUploadedCount((prev) => prev + 1);
      });

      await Promise.all(uploadPromises);

      const newUrls = [...uploadedUrls, ...urls];
      setUploadedUrls(newUrls);
      onUpload(newUrls);

      setUploading(false);
    } catch (error) {
      console.error("Upload error:", error);
      setError("خطا در آپلود تصاویر 360 درجه.");
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove) => {
    const newUrls = uploadedUrls.filter((_, index) => index !== indexToRemove);
    setUploadedUrls(newUrls);
    onUpload(newUrls);
  };

  const previewImage = (url) => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      <Label
        htmlFor={uniqueId}
        className={buttonVariants({
          className: cn(className, "cursor-pointer"),
          variant: "outline",
        })}
      >
        {uploading && <Loader2 className="animate-spin" />}
        <span className="text-xs">
          {uploadedCount > 0
            ? `${uploadedCount} تصویر 360 با موفقیت آپلود شد`
            : uploading
            ? "در حال آپلود..."
            : error
            ? error
            : title || "انتخاب تصاویر 360 درجه"}
        </span>
      </Label>
      
      <Input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        id={uniqueId}
        onChange={handleChange}
        multiple
        disabled={uploadedUrls.length >= 3}
      />

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {uploadedUrls.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {uploadedUrls.map((url, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={url}
                  alt={`تصویر 360 درجه ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => previewImage(url)}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => removeImage(index)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                360° {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        حداکثر 3 تصویر 360 درجه • فرمت‌های مجاز: JPG, PNG, WebP • حداکثر حجم: 10MB
      </p>
    </div>
  );
};

export default Uploader360;
