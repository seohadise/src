import connectDB from "@/config/db";
import Food from "@/models/Food";

import { columns } from "@/components/admin/foods/columns";
import { DataTable } from "@/components/admin/foods/data-table";

export const metadata = {
  title: "غذا های های وبسایت",
};

const Page = async () => {
  await connectDB();

  const foods = await Food.find({})
    .populate("owner")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="p-3 space-y-5">
      <h2 className="font-bold text-xl ">غذاها ( رستوران ها )</h2>
      <DataTable columns={columns} data={JSON.parse(JSON.stringify(foods))} />
    </div>
  );
};

export default Page;
