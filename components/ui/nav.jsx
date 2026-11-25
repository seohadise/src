"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/auth/_actions";
import { Button } from "./button";
import { Home, Menu, X, LogOut } from "lucide-react";

const Nav = ({ routes }) => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    location.href = "/auth";
  };

  return (
    <>
      {/* Desktop Nav */}
      <nav className="hidden md:flex flex-wrap items-center justify-between gap-2 py-3 px-4 shadow-sm rounded-b-xl mb-3 bg-white">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold">
          {routes.map((route, idx) => (
            <Link
              key={idx}
              href={route.path}
              className={`whitespace-nowrap transition-colors ${
                route.highlight
                  ? "text-green-600 hover:text-green-700 font-bold px-3 py-1 bg-green-50 rounded-lg"
                  : pathname === route.path
                  ? "text-green-600"
                  : "text-gray-600 hover:text-green-600"
              }`}
            >
              {route.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/">
            <Button variant="outline" size="icon" title="بازگشت به صفحه اصلی">
              <Home className="w-4 h-4" />
            </Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 ml-1" />
            خروج
          </Button>
        </div>
      </nav>

      {/* Mobile Nav Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href="/" className="text-lg font-bold text-green-600">
            تریپ گود
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="md:hidden fixed top-14 left-0 right-0 z-50 bg-white border-b shadow-lg animate-in slide-in-from-top duration-200">
            <div className="p-4 space-y-1">
              {routes.map((route, idx) => (
                <Link
                  key={idx}
                  href={route.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center p-3 rounded-xl transition-colors font-medium ${
                    route.highlight
                      ? "bg-green-600 text-white hover:bg-green-700 font-bold"
                      : pathname === route.path
                      ? "bg-green-50 text-green-700"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {route.label}
                </Link>
              ))}
              <div className="border-t my-2" />
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 p-3 rounded-xl hover:bg-gray-50 text-gray-700 font-medium"
              >
                <Home className="w-4 h-4" />
                صفحه اصلی
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2 p-3 rounded-xl hover:bg-red-50 text-red-600 font-medium w-full"
              >
                <LogOut className="w-4 h-4" />
                خروج از حساب
              </button>
            </div>
          </div>
        </>
      )}

      {/* Mobile spacer */}
      <div className="md:hidden h-14" />
    </>
  );
};

export default Nav;
