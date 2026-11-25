"use client";

import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "../ui/button";

const BackHome = ({ href = "/" }) => {
  return (
    <Link
      href={href}
      className={`${buttonVariants({ variant: "outline", size: "icon" })} fixed top-6 left-6 z-50 shadow-md bg-background/90 backdrop-blur-sm`}
      aria-label="بازگشت به صفحه اصلی"
    >
      <ArrowLeft className="w-5 h-5" />
    </Link>
  );
};

export default BackHome;
