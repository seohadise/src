"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Search,
  MapPin,
  CalendarIcon,
  Users,
  Home,
  Bus,
  UtensilsCrossed,
  ChevronDown,
} from "lucide-react";

const AdvancedSearch = () => {
  const router = useRouter();

  const [city, setCity] = useState("");
  const [date, setDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [guests, setGuests] = useState(1);
  const [itemType, setItemType] = useState("all");
  const [isGuestsOpenMobile, setIsGuestsOpenMobile] = useState(false);
  const [isGuestsOpenDesktop, setIsGuestsOpenDesktop] = useState(false);

  const getLocalDateKey = (d) => {
    if (!d) return "";
    const dateObj = new Date(d);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatPersianDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (city.trim()) {
      params.set("city", city.trim());
    }

    if (date) {
      params.set("checkIn", getLocalDateKey(date));
    }

    if (endDate) {
      params.set("checkOut", getLocalDateKey(endDate));
    }

    if (guests > 1) {
      params.set("guests", guests.toString());
    }

    if (itemType !== "all") {
      params.set("type", itemType);
    }

    router.push(`/search?${params.toString()}`);
  };

  const getItemTypeLabel = () => {
    switch (itemType) {
      case "properties":
        return "اقامتگاه";
      case "buses":
        return "اتوبوس";
      case "foods":
        return "غذا";
      default:
        return "همه موارد";
    }
  };

  const getItemTypeIcon = () => {
    switch (itemType) {
      case "properties":
        return <Home className="w-4 h-4" />;
      case "buses":
        return <Bus className="w-4 h-4" />;
      case "foods":
        return <UtensilsCrossed className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-2 md:p-2">
        {/* Mobile Layout */}
        <div className="flex flex-col gap-2 md:hidden">
          {/* Row 1: Type + City */}
          <div className="flex gap-2">
            <div className="w-1/3">
              <Select value={itemType} onValueChange={setItemType}>
                <SelectTrigger className="w-full h-10 border-0 bg-gray-50 rounded-lg text-xs" onMouseDown={(e) => e.preventDefault()}>
                  <div className="flex items-center gap-1">
                    {getItemTypeIcon()}
                    <span className="truncate">{getItemTypeLabel()}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      همه
                    </div>
                  </SelectItem>
                  <SelectItem value="properties">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      اقامتگاه
                    </div>
                  </SelectItem>
                  <SelectItem value="buses">
                    <div className="flex items-center gap-2">
                      <Bus className="w-4 h-4" />
                      اتوبوس
                    </div>
                  </SelectItem>
                  <SelectItem value="foods">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4" />
                      غذا
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <div className="relative">
                <MapPin className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="شهر یا کد آگهی"
                  className="h-10 pr-8 border-0 bg-gray-50 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Row 2: Date + Guests + Search */}
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className={cn(
                    "flex-1 h-10 justify-start text-right font-normal bg-gray-50 rounded-lg hover:bg-gray-100 text-xs px-2",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="ml-1 h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">
                    {date ? formatPersianDate(date).split(' ').slice(0,2).join(' ') : "تاریخ"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => d < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Popover open={isGuestsOpenMobile} onOpenChange={setIsGuestsOpenMobile}>
              <PopoverTrigger asChild>
                <div
                  role="button"
                  tabIndex={0}
                  className="w-20 h-10 justify-center font-normal bg-gray-50 rounded-lg hover:bg-gray-100 text-xs px-2 inline-flex items-center gap-1 cursor-pointer select-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsGuestsOpenMobile(!isGuestsOpenMobile);
                    }
                  }}
                >
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>{guests}</span>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="center">
                <div className="space-y-3">
                  <Label className="text-sm">تعداد نفرات</Label>
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      disabled={guests <= 1}
                    >
                      -
                    </Button>
                    <span className="text-lg font-bold">{guests}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setGuests(Math.min(20, guests + 1))}
                      disabled={guests >= 20}
                    >
                      +
                    </Button>
                  </div>
                  <Button
                    type="button"
                    className="w-full h-8 text-sm"
                    onClick={() => setIsGuestsOpenMobile(false)}
                  >
                    تایید
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button
              type="submit"
              className="h-10 px-4 rounded-lg bg-green-600 hover:bg-green-700"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Desktop Layout */}
        <div className="hidden md:flex flex-row items-stretch gap-2">
        {/* Item Type Selector */}
        <div className="flex-shrink-0">
          <Select value={itemType} onValueChange={setItemType}>
            <SelectTrigger className="w-full md:w-[140px] h-12 border-0 bg-gray-50 rounded-lg" onMouseDown={(e) => e.preventDefault()}>
              <div className="flex items-center gap-2">
                {getItemTypeIcon()}
                <SelectValue placeholder="نوع آیتم" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  همه موارد
                </div>
              </SelectItem>
              <SelectItem value="properties">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  اقامتگاه
                </div>
              </SelectItem>
              <SelectItem value="buses">
                <div className="flex items-center gap-2">
                  <Bus className="w-4 h-4" />
                  اتوبوس
                </div>
              </SelectItem>
              <SelectItem value="foods">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4" />
                  غذا
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-gray-200 self-stretch my-2" />

        {/* City Input */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="نام شهر یا کد آگهی"
              className="h-12 pr-10 border-0 bg-gray-50 rounded-lg text-base"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-gray-200 self-stretch my-2" />

        {/* Date Picker */}
        <div className="flex-shrink-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className={cn(
                  "w-full md:w-[200px] h-12 justify-start text-right font-normal bg-gray-50 rounded-lg hover:bg-gray-100",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="ml-2 h-5 w-5 text-gray-400" />
                {date ? (
                  <span className="truncate">
                    {formatPersianDate(date)}
                    {endDate && ` - ${formatPersianDate(endDate)}`}
                  </span>
                ) : (
                  <span>تاریخ سفر</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 border-b">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={date && !endDate ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEndDate(null)}
                  >
                    یک روزه
                  </Button>
                  <Button
                    type="button"
                    variant={date && endDate ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (date && !endDate) {
                        const nextDay = new Date(date);
                        nextDay.setDate(nextDay.getDate() + 1);
                        setEndDate(nextDay);
                      }
                    }}
                  >
                    چند روزه
                  </Button>
                </div>
              </div>
              <div className="flex">
                <div className="p-2">
                  <Label className="text-xs text-muted-foreground px-2">
                    تاریخ شروع
                  </Label>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      setDate(newDate);
                      if (endDate && newDate && newDate >= endDate) {
                        setEndDate(null);
                      }
                    }}
                    disabled={(d) => d < new Date()}
                    initialFocus
                  />
                </div>
                {(endDate || (date && endDate !== null)) && (
                  <div className="p-2 border-r">
                    <Label className="text-xs text-muted-foreground px-2">
                      تاریخ پایان
                    </Label>
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(d) => d < new Date() || (date && d <= date)}
                      initialFocus
                    />
                  </div>
                )}
              </div>
              {(date || endDate) && (
                <div className="p-2 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setDate(null);
                      setEndDate(null);
                    }}
                  >
                    پاک کردن تاریخ
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-gray-200 self-stretch my-2" />

        {/* Guests Selector */}
        <div className="flex-shrink-0">
          <Popover open={isGuestsOpenDesktop} onOpenChange={setIsGuestsOpenDesktop}>
            <PopoverTrigger asChild>
              <div
                role="button"
                tabIndex={0}
                className="w-full md:w-[140px] h-12 justify-between font-normal bg-gray-50 rounded-lg hover:bg-gray-100 inline-flex items-center px-3 cursor-pointer select-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsGuestsOpenDesktop(!isGuestsOpenDesktop);
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-400" />
                  <span>{guests} نفر</span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-4">
                <Label>تعداد نفرات</Label>
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    disabled={guests <= 1}
                  >
                    -
                  </Button>
                  <span className="text-xl font-bold">{guests}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setGuests(Math.min(20, guests + 1))}
                    disabled={guests >= 20}
                  >
                    +
                  </Button>
                </div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setIsGuestsOpenDesktop(false)}
                >
                  تایید
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Search Button */}
        <Button
          type="submit"
          size="lg"
          className="h-12 px-6 rounded-lg bg-green-600 hover:bg-green-700"
        >
          <Search className="w-5 h-5 ml-2" />
          جستجو
        </Button>
        </div>
      </div>
    </form>
  );
};

export default AdvancedSearch;
