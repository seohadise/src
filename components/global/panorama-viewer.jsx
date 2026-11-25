"use client";

import { useEffect, useRef, useState } from "react";

const PanoramaViewer = ({ src, alt = "360° view" }) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !src) return;

    let viewer = null;

    const initViewer = async () => {
      try {
        const { Viewer } = await import("@photo-sphere-viewer/core");
        await import("@photo-sphere-viewer/core/index.css");

        if (!containerRef.current) return;

        viewer = new Viewer({
          container: containerRef.current,
          panorama: src,
          defaultZoomLvl: 50,
          navbar: ["zoom", "fullscreen"],
          loadingTxt: "در حال بارگذاری...",
          touchmoveTwoFingers: false,
          mousewheelCtrlKey: true,
        });

        viewer.addEventListener("ready", () => {
          setIsLoading(false);
        });

        viewerRef.current = viewer;
      } catch (error) {
        console.error("Error initializing panorama viewer:", error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    initViewer();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [src]);

  if (hasError) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">خطا در بارگذاری تصویر 360 درجه</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">در حال بارگذاری تصویر 360°...</p>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full rounded-lg" />
    </div>
  );
};

export default PanoramaViewer;
