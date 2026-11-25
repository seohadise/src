"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, CalendarDays, User, Menu } from "lucide-react";
import { useState } from "react";

const MobileBottomNav = ({ isLoggedin }) => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => pathname === path;

  const navItems = [
    { href: "/", label: "خانه", icon: Home },
    { href: "/search", label: "جستجو", icon: Search },
    {
      href: isLoggedin ? "/dashboard/user/orders" : "/auth",
      label: "سفرها",
      icon: CalendarDays,
    },
    {
      href: isLoggedin ? "/dashboard/profile" : "/auth",
      label: "پروفایل",
      icon: User,
    },
  ];

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around h-16 pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                  active
                    ? "text-green-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5px]" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Menu Button for Services */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
              menuOpen ? "text-green-600" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Menu className={`w-5 h-5 ${menuOpen ? "stroke-[2.5px]" : ""}`} />
            <span className="text-[10px] font-medium">خدمات</span>
          </button>
        </div>
      </nav>

      {/* Services Sheet */}
      {menuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="md:hidden fixed bottom-20 left-4 right-4 z-50 bg-white rounded-2xl shadow-2xl border p-4 animate-in slide-in-from-bottom-4 duration-200">
            <h3 className="text-sm font-bold text-gray-700 mb-3 px-2">
              خدمات تریپ گود
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <Link
                href="/search?type=properties"
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors"
              >
                <span className="text-2xl">🏠</span>
                <span className="text-xs font-medium text-gray-700">
                  اقامتگاه
                </span>
              </Link>
              <Link
                href="/search?type=buses"
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <span className="text-2xl">🚌</span>
                <span className="text-xs font-medium text-gray-700">
                  اتوبوس
                </span>
              </Link>
              <Link
                href="/search?type=foods"
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors"
              >
                <span className="text-2xl">🍽️</span>
                <span className="text-xs font-medium text-gray-700">غذا</span>
              </Link>
              <Link
                href="/magazine"
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <span className="text-2xl">📖</span>
                <span className="text-xs font-medium text-gray-700">
                  مجله
                </span>
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">📋</span>
                <span className="text-xs font-medium text-gray-700">
                  پنل کاربری
                </span>
              </Link>
              <Link
                href="/terms"
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"
              >
                <span className="text-2xl">📜</span>
                <span className="text-xs font-medium text-gray-700">
                  قوانین
                </span>
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MobileBottomNav;
