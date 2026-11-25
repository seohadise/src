"use client";

import { useEffect, useRef } from "react";

const ReadOnlyMap = ({ lat, lng }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const loadMap = async () => {
      try {
        // Import CSS only when map is loaded
        await import("@neshan-maps-platform/mapbox-gl/dist/NeshanMapboxGl.css");
        const nmp_mapboxgl = (await import("@neshan-maps-platform/mapbox-gl")).default;

        const position = [Number(lng), Number(lat)];

        const map = new nmp_mapboxgl.Map({
          mapType: nmp_mapboxgl.Map.mapTypes.neshanVector,
          container: mapContainerRef.current,
          zoom: 14,
          pitch: 0,
          center: position,
          minZoom: 2,
          maxZoom: 21,
          trackResize: true,
          mapKey: "web.8e69555c36c14f24a3e27b1bef929d43",
          poi: true,
          traffic: false,
        });

        map.on("load", () => {
          new nmp_mapboxgl.Marker()
            .setLngLat(position)
            .addTo(map);
        });

        mapRef.current = map;
      } catch (error) {
        console.error("Error loading Neshan map:", error);
      }
    };

    loadMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height: "400px", width: "100%" }}
    />
  );
};

export default ReadOnlyMap;
