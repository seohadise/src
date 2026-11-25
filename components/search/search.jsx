"use client";

import axios from "axios";

import PropertyCard from "@/components/global/property-card";
import BusCard from "@/components/global/bus-card";
import FoodCard from "../global/food-card";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  SearchIcon,
  MapPin,
  Calendar,
  Users,
  X,
  SlidersHorizontal,
  Home,
  Bus,
  UtensilsCrossed,
  Loader2,
} from "lucide-react";

const Search = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get all search params
  const query = searchParams.get("q") || "";
  const city = searchParams.get("city") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guests = searchParams.get("guests") || "";
  const type = searchParams.get("type") || "all";
  const propertyType = searchParams.get("propertyType") || "";
  const region = searchParams.get("region") || "";

  const [activeTab, setActiveTab] = useState(type);

  // Sync activeTab with URL changes (for client-side navigation between search types)
  useEffect(() => {
    setActiveTab(type);
  }, [type]);
  const [sortBy, setSortBy] = useState("newest");
  const [results, setResults] = useState({
    properties: [],
    buses: [],
    foods: [],
    totalResults: 0,
    loading: true,
  });

  // Format date for display
  const formatPersianDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("fa-IR", {
      month: "short",
      day: "numeric",
    });
  };

  // Build search URL
  const buildSearchUrl = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (city) params.set("city", city);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", guests);
    if (propertyType) params.set("propertyType", propertyType);
    if (region) params.set("region", region);
    params.set("type", activeTab);
    return `/api/search?${params.toString()}`;
  };

  // Fetch results
  useEffect(() => {
    const fetchResults = async () => {
      setResults((prev) => ({ ...prev, loading: true }));

      try {
        const res = await axios.get(buildSearchUrl());
        const data = res?.data;

        setResults({
          properties: data.properties || [],
          buses: data.buses || [],
          foods: data.foods || [],
          totalResults: data.totalResults || 0,
          loading: false,
        });
      } catch (error) {
        console.error("Search error:", error);
        setResults((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchResults();
  }, [query, city, checkIn, checkOut, guests, activeTab, propertyType, region]);

  // Handle tab change
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", newTab);
    router.push(`/search?${params.toString()}`);
  };

  // Remove filter
  const removeFilter = (filterName) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(filterName);
    if (filterName === "checkIn") params.delete("checkOut");
    router.push(`/search?${params.toString()}`);
  };

  // Sort results
  const sortResults = (items) => {
    if (!items) return [];
    const sorted = [...items];
    switch (sortBy) {
      case "newest":
        return sorted.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      case "oldest":
        return sorted.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      case "price-low":
        return sorted.sort(
          (a, b) =>
            (a.pricing?.regularPrice || a.pricing?.basePrice || 0) -
            (b.pricing?.regularPrice || b.pricing?.basePrice || 0)
        );
      case "price-high":
        return sorted.sort(
          (a, b) =>
            (b.pricing?.regularPrice || b.pricing?.basePrice || 0) -
            (a.pricing?.regularPrice || a.pricing?.basePrice || 0)
        );
      case "popular":
        return sorted.sort(
          (a, b) => (b.rating?.average || 0) - (a.rating?.average || 0)
        );
      default:
        return sorted;
    }
  };

  // Get active filters
  const activeFilters = [];
  if (city) activeFilters.push({ key: "city", label: city, icon: MapPin });
  if (checkIn)
    activeFilters.push({
      key: "checkIn",
      label: `${formatPersianDate(checkIn)}${checkOut ? ` تا ${formatPersianDate(checkOut)}` : ""}`,
      icon: Calendar,
    });
  if (guests)
    activeFilters.push({
      key: "guests",
      label: `${guests} نفر`,
      icon: Users,
    });

  // Get search title based on type and filters
  const getSearchTitle = () => {
    const typeLabels = {
      all: "همه",
      properties: "اقامتگاه‌ها",
      buses: "اتوبوس‌ها",
      foods: "غذاها",
    };
    const typeLabel = typeLabels[activeTab] || "";

    if (city) {
      if (activeTab === "buses") return `اتوبوس از ${city}`;
      if (activeTab === "foods") return `غذا در ${city}`;
      return `اجاره ویلا و سوئیت در ${city}`;
    }
    if (query) {
      return `نتایج جستجو برای "${query}"`;
    }
    return activeTab === "all" ? "همه اقامتگاه‌ها" : `همه ${typeLabel}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Filters Bar */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Active Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {activeFilters.map((filter) => (
                <Badge
                  key={filter.key}
                  variant="secondary"
                  className="flex items-center gap-1 px-3 py-1.5 text-sm"
                >
                  <filter.icon className="w-3.5 h-3.5" />
                  {filter.label}
                  <button
                    onClick={() => removeFilter(filter.key)}
                    className="mr-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {/* Sort & Filter */}
            <div className="flex items-center gap-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SlidersHorizontal className="w-4 h-4 ml-2" />
                  <SelectValue placeholder="مرتب‌سازی" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">جدیدترین</SelectItem>
                  <SelectItem value="oldest">قدیمی‌ترین</SelectItem>
                  <SelectItem value="price-low">ارزان‌ترین</SelectItem>
                  <SelectItem value="price-high">گران‌ترین</SelectItem>
                  <SelectItem value="popular">محبوب‌ترین</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Title & Count */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{getSearchTitle()}</h1>
          {!results.loading && (
            <p className="text-muted-foreground mt-1">
              {results.totalResults} مورد یافت شد
            </p>
          )}
        </div>

        {/* Tabs */}
        <Tabs
          dir="rtl"
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 mb-6 max-w-md">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <SearchIcon className="w-4 h-4" />
              همه
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-1">
              <Home className="w-4 h-4" />
              اقامتگاه
            </TabsTrigger>
            <TabsTrigger value="buses" className="flex items-center gap-1">
              <Bus className="w-4 h-4" />
              اتوبوس
            </TabsTrigger>
            <TabsTrigger value="foods" className="flex items-center gap-1">
              <UtensilsCrossed className="w-4 h-4" />
              غذا
            </TabsTrigger>
          </TabsList>

          {/* Loading State */}
          {results.loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="mr-3 text-lg">در حال جستجو...</span>
            </div>
          ) : (
            <>
              {/* All Tab */}
              <TabsContent value="all" className="space-y-8">
                {results.totalResults === 0 ? (
                  <div className="text-center py-20">
                    <SearchIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium text-gray-600">
                      نتیجه‌ای یافت نشد
                    </h3>
                    <p className="text-muted-foreground mt-2">
                      لطفاً فیلترهای جستجو را تغییر دهید
                    </p>
                  </div>
                ) : (
                  <>
                    {results.properties.length > 0 && (
                      <section>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl font-bold flex items-center gap-2">
                            <Home className="w-5 h-5" />
                            اقامتگاه‌ها
                            <Badge variant="secondary">
                              {results.properties.length}
                            </Badge>
                          </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {sortResults(results.properties).map((property) => (
                            <PropertyCard
                              key={property._id}
                              property={property}
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    {results.buses.length > 0 && (
                      <section>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl font-bold flex items-center gap-2">
                            <Bus className="w-5 h-5" />
                            اتوبوس‌ها
                            <Badge variant="secondary">
                              {results.buses.length}
                            </Badge>
                          </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {sortResults(results.buses).map((bus) => (
                            <BusCard key={bus._id} bus={bus} />
                          ))}
                        </div>
                      </section>
                    )}

                    {results.foods.length > 0 && (
                      <section>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl font-bold flex items-center gap-2">
                            <UtensilsCrossed className="w-5 h-5" />
                            غذاها
                            <Badge variant="secondary">
                              {results.foods.length}
                            </Badge>
                          </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {sortResults(results.foods).map((food) => (
                            <FoodCard key={food._id} food={food} />
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Properties Tab */}
              <TabsContent value="properties">
                {results.properties.length === 0 ? (
                  <div className="text-center py-20">
                    <Home className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium text-gray-600">
                      اقامتگاهی یافت نشد
                    </h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortResults(results.properties).map((property) => (
                      <PropertyCard key={property._id} property={property} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Buses Tab */}
              <TabsContent value="buses">
                {results.buses.length === 0 ? (
                  <div className="text-center py-20">
                    <Bus className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium text-gray-600">
                      اتوبوسی یافت نشد
                    </h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortResults(results.buses).map((bus) => (
                      <BusCard key={bus._id} bus={bus} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Foods Tab */}
              <TabsContent value="foods">
                {results.foods.length === 0 ? (
                  <div className="text-center py-20">
                    <UtensilsCrossed className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium text-gray-600">
                      غذایی یافت نشد
                    </h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortResults(results.foods).map((food) => (
                      <FoodCard key={food._id} food={food} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Search;
