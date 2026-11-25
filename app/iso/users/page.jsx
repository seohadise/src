import connectDB from "@/config/db";
import User from "@/models/User";

import { columns } from "@/components/admin/users/columns";
import { DataTable } from "@/components/admin/users/data-table";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "کاربران وبسایت",
};

const Page = async () => {
  await connectDB();

  const users = await User.find({}).sort({ createdAt: -1 }).lean();

  const activeUsers = users.filter((user) => user.isVerified && !user.isBanned);

  return (
    <div className="p-3 space-y-5">
      <h2 className="font-bold text-xl ">کاربران</h2>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">تعداد کل کاربران</p>
              <p className="text-2xl font-bold">{users?.length}</p>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">کاربران فعال</p>
              <p className="text-2xl font-bold text-green-600">
                {activeUsers?.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={JSON.parse(JSON.stringify(users))} />
    </div>
  );
};

export default Page;
