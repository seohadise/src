"use client";

import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";

const Header = ({ name, isLoggedin }) => {
  return (
    <header className="border-b shadow-sm">
      <nav className="container mx-auto p-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.webp"
              alt="تریپ گود"
              width={50}
              height={50}
              className="rounded-lg"
            />
            <span className="text-xl font-bold text-green-600">تریپ گود</span>
          </Link>

          {isLoggedin ? (
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                <Link href="/dashboard/property-owners/properties/new">میزبان شوید</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/dashboard/profile">خوش اومدی {name} عزیز</Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                <Link href="/auth">میزبان شوید</Link>
              </Button>
              <Button asChild>
                <Link href="/auth">ورود / ثبت نام</Link>
              </Button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
