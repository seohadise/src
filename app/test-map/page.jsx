"use client";

import { useEffect, useRef, useState } from "react";
import "@neshan-maps-platform/mapbox-gl/dist/NeshanMapboxGl.css";

export default function TestMapPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const loadMap = async () => {
      try {
        console.log("Starting to load Neshan map...");
        const nmp_mapboxgl = (await import("@neshan-maps-platform/mapbox-gl")).default;
        console.log("Neshan library loaded:", nmp_mapboxgl);

        const map = new nmp_mapboxgl.Map({
          mapType: nmp_mapboxgl.Map.mapTypes.neshanVector,
          container: mapContainerRef.current,
          zoom: 13,
          pitch: 0,
          center: [51.389, 35.6892],
          minZoom: 2,
          maxZoom: 21,
          trackResize: true,
          mapKey: "web.8e69555c36c14f24a3e27b1bef929d43",
          poi: true,
          traffic: false,
        });

        console.log("Map instance created:", map);

        map.on("load", () => {
          console.log("Map loaded successfully!");
          setIsLoaded(true);

          const marker = new nmp_mapboxgl.Marker()
            .setLngLat([51.389, 35.6892])
            .addTo(map);

          console.log("Marker added:", marker);
        });

        map.on("error", (e) => {
          console.error("Map error:", e);
          setError("Map error: " + e.error?.message || "Unknown error");
        });

        mapRef.current = map;
      } catch (error) {
        console.error("Error loading Neshan map:", error);
        setError(error.message);
      }
    };

    loadMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ marginBottom: "20px" }}>تست نقشه نشان</h1>
      
      {error && (
        <div style={{ 
          padding: "10px", 
          marginBottom: "20px", 
          backgroundColor: "#fee", 
          color: "#c00",
          borderRadius: "5px"
        }}>
          خطا: {error}
        </div>
      )}

      {isLoaded && (
        <div style={{ 
          padding: "10px", 
          marginBottom: "20px", 
          backgroundColor: "#efe", 
          color: "#060",
          borderRadius: "5px"
        }}>
          نقشه با موفقیت بارگذاری شد!
        </div>
      )}

      <div
        ref={mapContainerRef}
        style={{
          height: "500px",
          width: "100%",
          borderRadius: "10px",
          border: "2px solid #ddd"
        }}
      />

      <div style={{ marginTop: "20px", fontSize: "14px", color: "#666" }}>
        <p>مختصات مرکز نقشه: 51.389, 35.6892 (تهران)</p>
        <p>API Key: web.8e69555c36c14f24a3e27b1bef929d43</p>
        <p>کنسول مرورگر را برای لاگ‌ها بررسی کنید</p>
      </div>
    </div>
  );
}
