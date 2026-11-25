"use client";

import imageCompression from "browser-image-compression";

import { useEffect, useId, useState } from "react";

import { Label } from "../ui/label";
import { Input } from "../ui/input";

import { buttonVariants } from "../ui/button";

import { cn } from "@/lib/utils";

import { Loader2 } from "lucide-react";

const Uploader = ({ onUpload, title, className, reset, multiple = false }) => {
  const uniqueId = useId();

  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [uploadedUrls, setUploadedUrls] = useState([]);

  useEffect(() => {
    setUploadedCount(0);
    setError("");
    setUploadedUrls([]);
  }, [reset]);

  const handleChange = async (e) => {
    setError(null);
    setUploadedCount(0);
    setUploadedUrls([]);

    const files = multiple
      ? Array.from(e.target.files || [])
      : [e.target.files?.[0]];

    if (files.length === 0 || !files[0]) {
      setError("لطفا ابتدا فایل خود را انتخاب نمایید .");
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const invalidFile = files.find((file) => !validTypes.includes(file.type));

    if (invalidFile) {
      setError("فقط فایل های تصویری مجاز هستند");
      return;
    }

    try {
      setUploading(true);

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      const urls = [];
      const uploadPromises = files.map(async (file) => {
        const compressedFile = await imageCompression(file, options);

        const formData = new FormData();
        formData.append("file", compressedFile);
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

      setUploadedUrls(urls);

      if (multiple) {
        onUpload(urls);
      } else {
        onUpload(urls[0] || "");
      }

      setUploading(false);
    } catch (error) {
      console.error("Upload error:", error);
      setError("خطا در آپلود.");
      setUploading(false);
    }
  };

  return (
    <>
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
            ? `${uploadedCount} تصویر با موفقیت آپلود شد`
            : uploading
            ? "در حال آپلود..."
            : error
            ? error
            : title}
        </span>
      </Label>
      <Input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        id={uniqueId}
        onChange={handleChange}
        multiple={multiple}
      />
    </>
  );
};

export default Uploader;
