import Sidebar from "@/components/admin/sidebar";

import { getUser } from "@/lib/helpers";

export const metadata = {
  title: "پنل مدیریت وبسایت",
};

const AdminLayout = async ({ children }) => {
  const user = await getUser();

  return (
    <div className="flex h-screen">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="flex h-14 items-center gap-4 border-b bg-gray-100/40 px-6 pr-16 lg:pr-6">
          <h2 className="font-semibold">پنل مدیریت</h2>
          <h3 className="text-xs font-medium">
            خوش اومدی {user?.fullName} عزیز
          </h3>
        </div>

        <div className="p-3">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
