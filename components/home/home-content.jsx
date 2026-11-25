"use client";

import Image from "next/image";
import Link from "next/link";

import PropertyCard from "@/components/global/property-card";
import VisitTracker from "@/components/global/visit-tracker";
import BusCard from "@/components/global/bus-card";
import FoodCard from "@/components/global/food-card";
import ArticleCard from "@/components/global/article-card";
import AdvancedSearch from "@/components/home/advanced-search";
import PropertyCategories from "@/components/home/property-categories";
import PopularDestinations from "@/components/home/popular-destinations";
import HorizontalScrollSection from "@/components/home/horizontal-scroll-section";

import { Card, CardContent } from "@/components/ui/card";

import { Phone } from "lucide-react";

const HomeContent = ({ properties, buses, foods, articles, popularDestinations, northernVillas, southernProperties, tehranProperties, isLoggedin, userName }) => {
  return (
    <div>
      <VisitTracker pageType="home" />
      
      {/* Hero Section - Responsive */}
      <div className="relative w-full min-h-[100svh] md:min-h-0 md:h-auto overflow-hidden">
        {/* Mobile Background Image - uses fill for full coverage */}
        <Image
          src="/landingImage.webp"
          alt="Hero"
          fill
          className="object-cover object-center md:hidden"
          priority
          sizes="100vw"
        />
        {/* Desktop Background Image - uses fixed dimensions */}
        <Image
          src="/landingImage.webp"
          alt="Hero"
          width={1920}
          height={1080}
          className="hidden md:block w-full h-auto"
          priority
        />
        
        {/* Header overlay with login and phone */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent py-2 md:py-4">
          <div className="container mx-auto px-3 md:px-4">
            <div className="flex items-center justify-between">
              {/* Logo and Title - Right side */}
              <Link href="/" className="flex items-center gap-2 md:gap-4 group">
                <Image
                  src="/logo.webp"
                  alt="تریپ گود"
                  width={120}
                  height={120}
                  className="w-12 h-12 md:w-[120px] md:h-[120px] rounded-xl md:rounded-2xl shadow-xl md:shadow-2xl border-2 md:border-3 border-white/40 group-hover:scale-105 transition-transform duration-300"
                />
                <span className="text-white font-bold text-lg md:text-4xl drop-shadow-lg hidden sm:block">تریپ گود</span>
              </Link>
              
              {/* Login, Host button and Phone - Left side */}
              <div className="flex items-center gap-2 md:gap-3">
                {isLoggedin ? (
                  <>
                    <Link
                      href="/dashboard/property-owners/properties/new"
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/40 px-3 py-1.5 md:px-5 md:py-2.5 rounded-lg md:rounded-xl font-medium text-xs md:text-base transition-all shadow-lg hover:shadow-xl"
                    >
                      میزبان شوید
                    </Link>
                    <Link 
                      href="/dashboard/profile" 
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 md:px-5 md:py-2.5 rounded-lg md:rounded-xl font-medium text-xs md:text-base transition-all shadow-lg hover:shadow-xl"
                    >
                      <span className="hidden sm:inline">خوش اومدی {userName} عزیز</span>
                      <span className="sm:hidden">داشبورد</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth"
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/40 px-3 py-1.5 md:px-5 md:py-2.5 rounded-lg md:rounded-xl font-medium text-xs md:text-base transition-all shadow-lg hover:shadow-xl"
                    >
                      میزبان شوید
                    </Link>
                    <Link 
                      href="/auth" 
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 md:px-5 md:py-2.5 rounded-lg md:rounded-xl font-medium text-xs md:text-base transition-all shadow-lg hover:shadow-xl"
                    >
                      ورود | ثبت نام
                    </Link>
                  </>
                )}
                <div className="flex items-center gap-1 md:gap-2 bg-white/20 backdrop-blur-sm px-2 md:px-4 py-1.5 md:py-2.5 rounded-lg md:rounded-xl text-white text-xs md:text-base">
                  <span dir="ltr" className="font-medium">021-91692932</span>
                  <Phone className="w-3 h-3 md:w-5 md:h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content overlay on banner */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pt-16 md:pt-0">
          <div className="text-center space-y-3 md:space-y-4 px-3 md:px-4 w-full max-w-full overflow-hidden">
            <div className="inline-block bg-black/40 backdrop-blur-sm rounded-xl md:rounded-2xl px-4 md:px-8 py-3 md:py-4 mb-2">
              <h1 className="text-2xl md:text-5xl font-bold text-white mb-1 md:mb-2" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.7)'}}>
                تریپ گود
              </h1>
              <p className="text-xs md:text-lg text-gray-100" style={{textShadow: '1px 1px 4px rgba(0,0,0,0.6)'}}>
                جستجو و رزرو اقامتگاه، غذا و وسایل نقلیه
              </p>
            </div>
            <div className="mt-2 md:mt-4 px-1">
              <AdvancedSearch />
            </div>
          </div>
        </div>
      </div>

      <PropertyCategories />

      <div className="container mx-auto py-12 space-y-12 p-3">
        <PopularDestinations destinations={popularDestinations} />

        {northernVillas && northernVillas.length > 0 && (
          <HorizontalScrollSection 
            title="ویلاهای شمال" 
            viewAllLink="/search?type=properties&propertyType=villa&region=north"
            viewAllText="مشاهده همه ویلاهای شمال"
          >
            {northernVillas.map((property) => (
              <div key={property._id} className="flex-shrink-0 w-72">
                <PropertyCard property={property} />
              </div>
            ))}
          </HorizontalScrollSection>
        )}

        {southernProperties && southernProperties.length > 0 && (
          <HorizontalScrollSection 
            title="اقامتگاه‌های جنوب" 
            viewAllLink="/search?type=properties&region=south"
            viewAllText="مشاهده همه اقامتگاه‌های جنوب"
          >
            {southernProperties.map((property) => (
              <div key={property._id} className="flex-shrink-0 w-72">
                <PropertyCard property={property} />
              </div>
            ))}
          </HorizontalScrollSection>
        )}

        {tehranProperties && tehranProperties.length > 0 && (
          <HorizontalScrollSection 
            title="اقامتگاه‌های تهران" 
            viewAllLink="/search?type=properties&region=tehran"
            viewAllText="مشاهده همه اقامتگاه‌های تهران"
          >
            {tehranProperties.map((property) => (
              <div key={property._id} className="flex-shrink-0 w-72">
                <PropertyCard property={property} />
              </div>
            ))}
          </HorizontalScrollSection>
        )}

        <HorizontalScrollSection 
          title="جدیدترین اقامتگاه‌ها" 
          viewAllLink="/search?type=properties"
          viewAllText="مشاهده همه اقامتگاه‌ها"
          backgroundImage="/property-back.png"
          backgroundColor="bg-rose-500"
        >
          {properties?.map((property) => (
            <div key={property._id} className="flex-shrink-0 w-72">
              <PropertyCard property={property} />
            </div>
          ))}
        </HorizontalScrollSection>

        <HorizontalScrollSection 
          title="سفرهای اخیر" 
          viewAllLink="/search?type=buses"
          viewAllText="مشاهده همه سفرها"
          backgroundImage="/bus-back.png"
          backgroundColor="bg-blue-500"
        >
          {buses?.map((bus) => (
            <div key={bus._id} className="flex-shrink-0 w-72">
              <BusCard bus={bus} />
            </div>
          ))}
        </HorizontalScrollSection>

        <HorizontalScrollSection
          title="آشپزخانه‌های برتر"
          viewAllLink="/search?type=foods"
          viewAllText="مشاهده همه آشپزخانه‌ها"
          backgroundImage="/food-back.png"
          backgroundColor="bg-orange-500"
        >
          {foods?.map((food) => (
            <div key={food._id} className="flex-shrink-0 w-72">
              <FoodCard food={food} />
            </div>
          ))}
        </HorizontalScrollSection>

        {articles && articles.length > 0 && (
          <HorizontalScrollSection
            title="مجله تریپ گود"
            viewAllLink="/magazine"
            viewAllText="مشاهده همه مقالات"
            backgroundImage="/property-back.png"
            backgroundColor="bg-purple-500"
          >
            {articles.map((article) => (
              <div key={article._id} className="flex-shrink-0 w-72">
                <ArticleCard article={article} />
              </div>
            ))}
          </HorizontalScrollSection>
        )}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="p-6 text-center space-y-2">
              <h3 className="text-xl font-bold">رزرو آسان</h3>
              <p className="text-muted-foreground">
                در کمترین زمان ممکن رزرو خود را انجام دهید
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center space-y-2">
              <h3 className="text-xl font-bold">پشتیبانی ۲۴/۷</h3>
              <p className="text-muted-foreground">
                در تمام ساعات شبانه‌روز پاسخگوی شما هستیم
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center space-y-2">
              <h3 className="text-xl font-bold">قیمت مناسب</h3>
              <p className="text-muted-foreground">
                بهترین خدمات را با مناسب‌ترین قیمت دریافت کنید
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default HomeContent;
