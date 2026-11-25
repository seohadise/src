"use client";

import Link from "next/link";

import { useState } from "react";
import { usePathname } from "next/navigation";

import { adminRoutes } from "@/constants/routes";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Button } from "../ui/button";

import { cn } from "@/lib/utils";

import { Menu } from "lucide-react";

const Sidebar = () => {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold text-center border-b w-full p-3.5">
        پنل مدیریت وبسایت
      </h2>

      <nav className="flex-1 space-y-2 py-4">
        {adminRoutes.map((item) => (
          <Link key={item.path} href={item.path} onClick={() => setOpen(false)}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2",
                pathname === item.path && "bg-muted"
              )}
            >
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex h-full w-72 flex-col overflow-y-auto border-l bg-gray-100/40 px-5">
        <SidebarContent />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="lg:hidden absolute top-3 right-3">
          <Button variant="outline" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>منوی مدیریت</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Sidebar;
