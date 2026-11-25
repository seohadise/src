import connectDB from "@/config/db";
import Bus from "@/models/Bus";

import { columns } from "@/components/admin/buses/columns";
import { DataTable } from "@/components/admin/buses/data-table";

export const metadata = {
  title: "لیست اتوبوس های وبسایت",
};

const Page = async () => {
  await connectDB();

  const buses = await Bus.find({})
    .populate("owner")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="p-3 space-y-5">
      <h2 className="font-bold text-xl ">اتوبوس ها</h2>
      <DataTable columns={columns} data={JSON.parse(JSON.stringify(buses))} />
    </div>
  );
};

export default Page;
