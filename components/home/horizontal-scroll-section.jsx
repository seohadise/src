"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const HorizontalScrollSection = ({ title, children, viewAllLink, viewAllText, backgroundImage, backgroundColor }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(true);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftStart, setScrollLeftStart] = useState(0);

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      
      if (maxScroll > 0) {
        // Left button: enabled when scrollLeft > 0 (can go back to right/start)
        setCanScrollLeft(scrollLeft > 10);
        // Right button: enabled when scrollLeft < maxScroll (can go further left/end)
        setCanScrollRight(scrollLeft < maxScroll - 10);
      } else {
        setCanScrollLeft(false);
        setCanScrollRight(false);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkScrollButtons();
    }, 100);
    
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", checkScrollButtons);
      window.addEventListener("resize", checkScrollButtons);
      return () => {
        clearTimeout(timer);
        scrollElement.removeEventListener("scroll", checkScrollButtons);
        window.removeEventListener("resize", checkScrollButtons);
      };
    }
    return () => clearTimeout(timer);
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      // Left button: decrease scrollLeft (show items on the left/go back)
      // Right button: increase scrollLeft (show items on the right/go forward)
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftStart(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftStart - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const sectionStyle = backgroundImage ? {
    backgroundImage: `url(${backgroundImage})`,
    backgroundRepeat: 'repeat',
    backgroundSize: 'auto',
  } : {};

  const sectionClasses = `space-y-5 relative rounded-2xl ${backgroundColor ? backgroundColor : ''} ${backgroundImage ? 'p-6' : ''}`;

  return (
    <section className={sectionClasses} style={sectionStyle}>
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${backgroundImage ? 'text-white' : ''}`}>{title}</h2>
        {viewAllLink && (
          <a
            href={viewAllLink}
            className={`text-sm flex items-center gap-1 ${backgroundImage ? 'text-white hover:text-gray-200' : 'text-green-600 hover:text-green-700'}`}
          >
            {viewAllText || "مشاهده همه"}
            <ChevronLeft className="w-4 h-4" />
          </a>
        )}
      </div>

      <div className="relative">
        {/* Right button - shows items on the right (decreases scrollLeft) */}
        <button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:shadow-xl transition-all translate-x-1/2 ${!canScrollRight ? 'opacity-40 cursor-not-allowed' : ''}`}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6 text-gray-700" />
        </button>

        <div
          ref={scrollRef}
          className={`flex gap-4 overflow-x-auto pb-4 px-6 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {children}
        </div>

        {/* Left button - shows items on the left (increases scrollLeft) */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:shadow-xl transition-all -translate-x-1/2"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
      </div>
    </section>
  );
};

export default HorizontalScrollSection;
