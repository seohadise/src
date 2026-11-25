"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, LogIn, User, Heart, PlusCircle, Home } from "lucide-react";

const MobileHeader = ({ isLoggedin, name, userType }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { href: "/", label: "صفحه اصلی" },
    { href: "/search?type=properties", label: "اقامتگاه" },
    { href: "/search?type=buses", label: "اتوبوس" },
    { href: "/search?type=foods", label: "غذای خانگی" },
    { href: "/magazine", label: "مجله" },
    { href: "/terms", label: "قوانین و مقررات" },
  ];

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.webp"
              alt="تریپ گود"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <span className="text-lg font-bold text-green-600">تریپ گود</span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-gray-600"
              aria-label="منو"
            >
              {menuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Sheet */}
      {menuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="md:hidden fixed top-14 left-0 right-0 z-50 bg-white border-b shadow-lg animate-in slide-in-from-top duration-200">
            <div className="p-4 space-y-1">
              {/* User Info */}
              {isLoggedin ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-800">{name}</p>
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setMenuOpen(false)}
                      className="text-xs text-green-600 hover:underline"
                    >
                      مشاهده پروفایل
                    </Link>
                  </div>
                </div>
              ) : (
                <Link
                  href="/auth"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 p-3 bg-green-50 rounded-xl mb-2 text-green-700 font-bold"
                >
                  <LogIn className="w-5 h-5" />
                  ورود / ثبت نام
                </Link>
              )}

              {/* میزبان شوید */}
              <Link
                href={isLoggedin ? "/dashboard/property-owners/properties/new" : "/auth"}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 p-3 bg-green-100 rounded-xl mb-2 text-green-700 font-bold"
              >
                <Home className="w-5 h-5 text-green-600" />
                میزبان شوید
              </Link>

              {/* Menu Items */}
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                >
                  {item.label}
                </Link>
              ))}

              {isLoggedin && (
                <>
                  <div className="border-t my-2" />
                  {userType === "property-owner" && (
                    <Link
                      href="/dashboard/property-owners/properties/new"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-green-50 transition-colors text-green-700 font-bold"
                    >
                      <PlusCircle className="w-5 h-5 text-green-600" />
                      ثبت ملک جدید
                    </Link>
                  )}
                  <Link
                    href="/dashboard/user/orders"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                  >
                    <Heart className="w-5 h-5 text-red-500" />
                    سفرهای من
                  </Link>
                  <Link
                    href="/dashboard/financial"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                  >
                    کیف پول و مالی
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MobileHeader;
