import connectDB from "@/config/db";
import Transaction from "@/models/Transaction";

import { columns } from "@/components/admin/transactions/columns";
import { DataTable } from "@/components/admin/transactions/data-table";

export const metadata = {
  title: "تراکنش های وبسایت",
};

const Page = async () => {
  await connectDB();

  const transactions = await Transaction.find({})
    .populate("user")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="p-3 space-y-5">
      <h2 className="font-bold text-xl ">تراکنش ها</h2>
      <DataTable
        columns={columns}
        data={JSON.parse(JSON.stringify(transactions))}
      />
    </div>
  );
};

export default Page;
