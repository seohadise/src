"use client";

import { useEffect, useState, useRef, useCallback } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

import { Button } from "../ui/button";

const SelectLocation = ({
  onPosition,
  readOnly,
  defaultPosition = [51.404343, 35.715298],
}) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [position, setPosition] = useState(defaultPosition);
  const [isPositionSelected, setIsPositionSelected] = useState(false);

  useEffect(() => {
    if (defaultPosition && defaultPosition.length === 2) {
      const lng = Number(defaultPosition[0]);
      const lat = Number(defaultPosition[1]);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        setPosition([lng, lat]);
        setIsPositionSelected(true);
      }
    }
  }, [defaultPosition[0], defaultPosition[1]]);

  const initMap = useCallback(
    (node) => {
      if (!node || mapRef.current) return;

      const loadMap = async () => {
        try {
          console.log("Loading Neshan map...");
          // Import CSS only when map is loaded
          await import("@neshan-maps-platform/mapbox-gl/dist/NeshanMapboxGl.css");
          const nmp_mapboxgl = (
            await import("@neshan-maps-platform/mapbox-gl")
          ).default;

          const map = new nmp_mapboxgl.Map({
            mapType: nmp_mapboxgl.Map.mapTypes.neshanVector,
            container: node,
            zoom: 13,
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
            console.log("Map loaded successfully!");

            const marker = new nmp_mapboxgl.Marker({ draggable: !readOnly })
              .setLngLat(position)
              .addTo(map);

            markerRef.current = marker;

            if (!readOnly) {
              marker.on("dragend", () => {
                const lngLat = marker.getLngLat();
                const newPos = [lngLat.lng, lngLat.lat];
                setPosition(newPos);
                onPosition([lngLat.lat, lngLat.lng]);
                setIsPositionSelected(true);
              });

              map.on("click", (e) => {
                const { lng, lat } = e.lngLat;
                const newPos = [lng, lat];
                setPosition(newPos);
                marker.setLngLat(newPos);
                onPosition([lat, lng]);
                setIsPositionSelected(true);
              });
            }
          });

          mapRef.current = map;
        } catch (error) {
          console.error("Error loading Neshan map:", error);
        }
      };

      loadMap();
    },
    [position, readOnly, onPosition]
  );

  const handleOpenChange = (open) => {
    if (!open && mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" className="bg-green-600 hover:bg-green-700 text-white">
          📍 انتخاب موقعیت
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[500px]">
        <DialogTitle>
          {readOnly ? "موقعیت مکانی دقیق" : "انتخاب موقعیت مکانی"}
        </DialogTitle>
        <DialogDescription>
          {readOnly
            ? "موقعیت دقیق ملک روی نقشه"
            : "روی نقشه کلیک کنید یا مارکر را بکشید تا موقعیت را انتخاب کنید"}
        </DialogDescription>
        <div
          ref={initMap}
          style={{
            height: "350px",
            width: "100%",
            borderRadius: "15px",
            backgroundColor: "#f0f0f0",
          }}
        />
        {!readOnly && (
          <DialogClose asChild>
            <Button disabled={!isPositionSelected}>ثبت موقعیت</Button>
          </DialogClose>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SelectLocation;
