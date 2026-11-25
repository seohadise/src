import Link from "next/link";

import connectDB from "@/config/db";
import Article from "@/models/Article";

import { columns } from "@/components/admin/magazine/columns";
import { DataTable } from "@/components/admin/magazine/data-table";
import { buttonVariants } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const metadata = {
  title: "مدیریت مجله",
};

const Page = async () => {
  await connectDB();

  const articles = await Article.find({})
    .populate("author", "fullName")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="p-3 space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-xl">مقالات مجله</h2>
        <Link
          href="/iso/magazine/new"
          className={buttonVariants({ variant: "default" })}
        >
          <Plus className="w-4 h-4 ml-2" />
          مقاله جدید
        </Link>
      </div>
      <DataTable
        columns={columns}
        data={JSON.parse(JSON.stringify(articles))}
      />
    </div>
  );
};

export default Page;
