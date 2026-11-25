"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

const PopularDestinations = ({ destinations = [] }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!destinations || destinations.length === 0) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">مقاصد پرطرفدار</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {destinations.map((destination, index) => (
          <Link
            key={index}
            href={`/search?type=properties&city=${encodeURIComponent(destination.city)}`}
            className="flex-shrink-0 group"
          >
            <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              {destination.image ? (
                <Image
                  src={destination.image}
                  alt={destination.city}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <h3 className="font-bold text-sm md:text-base">{destination.city}</h3>
                {destination.province && destination.province !== destination.city && (
                  <p className="text-xs text-gray-200">{destination.province}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default PopularDestinations;
