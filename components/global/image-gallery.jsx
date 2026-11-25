"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ImageGallery = ({ images, initialIndex = 0, isOpen, onClose, title }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Update current index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case "Escape":
        onClose();
        break;
      case "ArrowLeft":
        // In RTL, left arrow goes to next image
        setCurrentIndex((prev) => (prev + 1) % images.length);
        break;
      case "ArrowRight":
        // In RTL, right arrow goes to previous image
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
        break;
    }
  }, [isOpen, images.length, onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when gallery is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !images || images.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white" dir="rtl">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h2 className="text-lg font-semibold truncate">{title}</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              تصویر {(currentIndex + 1).toLocaleString("fa-IR")} از {images.length.toLocaleString("fa-IR")}
            </span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="بستن گالری"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Image Container */}
      <div className="flex items-center justify-center h-full pt-16 pb-32 px-4">
        {/* Previous Button */}
        <button
          onClick={goToNext}
          className="absolute right-4 md:right-8 z-10 p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="تصویر بعدی"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Current Image */}
        <div className="relative w-full h-full max-w-5xl mx-auto">
          <Image
            src={images[currentIndex]}
            alt={`${title} - تصویر ${currentIndex + 1}`}
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Next Button */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 md:left-8 z-10 p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="تصویر قبلی"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Thumbnails */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t py-4 px-4">
        <div className="flex gap-2 overflow-x-auto max-w-7xl mx-auto justify-center">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                currentIndex === index
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent hover:border-gray-300"
              )}
            >
              <Image
                src={image}
                alt={`تصویر ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageGallery;
