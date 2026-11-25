"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

const ShareButton = ({ title }) => {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    try {
      setIsSharing(true);

      const url = window.location.href;

      if (navigator.share) {
        await navigator.share({
          title: title || "",
          url,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch (error) {
      // Intentionally ignore errors for share/copy
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleShare} disabled={isSharing}>
      <Share2 className="w-4 h-4 ml-2" />
      اشتراکگذاری
    </Button>
  );
};

export default ShareButton;
