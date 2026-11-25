"use client";

import imageCompression from "browser-image-compression";

import { useEffect, useId, useState } from "react";

import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

import { buttonVariants } from "../ui/button";

import { cn } from "@/lib/utils";

import { Loader2, X, Eye, Upload as UploadIcon, CheckCircle } from "lucide-react";

const NationalIdUploader = ({
  onUpload,
  className,
  reset,
  value = "",
  uploadButtonLabel = "آپلود کارت ملی",
  uploadedBadgeText = "کارت ملی آپلود شده",
  previewAlt = "کارت ملی",
  tipsTitle = "نکات مهم:",
  tips = [
    "• تصویر کارت ملی باید واضح و خوانا باشد",
    "• تمام اطلاعات روی کارت باید قابل مشاهده باشد",
    "• فرمت‌های مجاز: JPG, PNG, WebP",
    "• حداکثر حجم: 5 مگابایت",
  ],
  errorMessages = {
    type: "فقط فایل‌های تصویری (JPG, PNG, WebP) مجاز هستند",
    size: "حجم تصویر نباید بیشتر از 5 مگابایت باشد",
    upload: "خطا در آپلود فایل.",
  },
}) => {
  const uniqueId = useId();

  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(value || "");

  useEffect(() => {
    setUploadedUrl(value || "");
  }, [value]);

  useEffect(() => {
    setError("");
    if (reset) {
      setUploadedUrl("");
    }
  }, [reset]);

  const handleChange = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // بررسی نوع فایل
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError(errorMessages.type);
      return;
    }

    // بررسی حجم فایل
    if (file.size > 5 * 1024 * 1024) { // 5MB
      setError(errorMessages.size);
      return;
    }

    setError("");

    try {
      setUploading(true);

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("folder", "national-ids");
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
      const publicUrl = data.url;

      setUploadedUrl(publicUrl);
      onUpload(publicUrl);

      setUploading(false);
    } catch (error) {
      console.error("Upload error:", error);
      setError(errorMessages.upload);
      setUploading(false);
    }
  };

  const removeImage = () => {
    setUploadedUrl("");
    onUpload("");
  };

  const previewImage = () => {
    window.open(uploadedUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      {!uploadedUrl ? (
        <>
          <Label
            htmlFor={uniqueId}
            className={buttonVariants({
              className: cn(className, "cursor-pointer w-full"),
              variant: "outline",
            })}
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                در حال آپلود...
              </>
            ) : (
              <>
                <UploadIcon className="mr-2 h-4 w-4" />
                {uploadButtonLabel}
              </>
            )}
          </Label>
          
          <Input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            id={uniqueId}
            onChange={handleChange}
            disabled={uploading}
          />
        </>
      ) : (
        <div className="relative group">
          <div className="aspect-[1.6/1] bg-gray-100 rounded-lg overflow-hidden border-2 border-green-200">
            <img
              src={uploadedUrl}
              alt={previewAlt}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={previewImage}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={removeImage}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            {uploadedBadgeText}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-xs text-blue-700 font-medium mb-1">{tipsTitle}</p>
        <ul className="text-xs text-blue-600 space-y-1">
          {tips.map((tip, index) => (
            <li key={`${uniqueId}-tip-${index}`}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default NationalIdUploader;
