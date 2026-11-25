"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import axios from "axios";

const VisitTracker = ({ pageType = "other", itemId = null, itemType = null }) => {
  const pathname = usePathname();

  useEffect(() => {
    const trackVisit = async () => {
      try {
        await axios.post("/api/visit", {
          path: pathname,
          pageType,
          itemId,
          itemType,
          referrer: document.referrer || null,
        });
      } catch (error) {
        // Silently fail - don't interrupt user experience
        console.error("Failed to track visit:", error);
      }
    };

    trackVisit();
  }, [pathname, pageType, itemId, itemType]);

  return null;
};

export default VisitTracker;
