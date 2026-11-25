  "use client";

  import Link from "next/link";
  import { 
    Home, 
    Building2, 
    Trees, 
    Bus,
    UtensilsCrossed
  } from "lucide-react";

  const categories = [
    {
      id: "villa",
      label: "ویلا",
      icon: Home,
      href: "/search?type=properties&propertyType=villa",
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
      hoverBg: "hover:bg-orange-200",
    },
    {
      id: "apartment",
      label: "آپارتمان",
      icon: Building2,
      href: "/search?type=properties&propertyType=apartment",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      hoverBg: "hover:bg-blue-200",
    },
    {
      id: "garden",
      label: "باغ",
      icon: Trees,
      href: "/search?type=properties&propertyType=garden",
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      hoverBg: "hover:bg-green-200",
    },
    {
      id: "bus",
      label: "اتوبوس",
      icon: Bus,
      href: "/search?type=buses",
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
      hoverBg: "hover:bg-purple-200",
    },
    {
      id: "food",
      label: "غذا",
      icon: UtensilsCrossed,
      href: "/search?type=foods",
      bgColor: "bg-rose-100",
      iconColor: "text-rose-600",
      hoverBg: "hover:bg-rose-200",
    },
  ];

  const PropertyCategories = () => {
    return (
      <div className="flex justify-center gap-3 md:gap-6 py-6 md:py-8 px-4">
        {categories.map((category) => {
          const Icon = category.icon;

          return (
            <Link
              key={category.id}
              href={category.href}
              className={`flex flex-col items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 rounded-xl transition-all duration-200 ${category.bgColor} ${category.hoverBg} hover:scale-105 hover:shadow-lg`}
            >
              <div className={`${category.iconColor}`}>
                <Icon className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <span className="text-xs md:text-sm text-gray-700 font-medium whitespace-nowrap">
                {category.label}
              </span>
            </Link>
          );
        })}
      </div>
    );
  };

  export default PropertyCategories;
