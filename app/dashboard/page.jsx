import { redirect } from "next/navigation";
import { getUser } from "@/lib/helpers";

const DashboardPage = async () => {
  const user = await getUser();

  if (!user) {
    redirect("/auth");
  }

  // بر اساس نوع کاربر، به صفحه مناسب redirect کن
  switch (user.type) {
    case "property-owner":
      redirect("/dashboard/property-owners");
    case "bus-owner":
      redirect("/dashboard/bus-owners");
    case "food-owner":
      redirect("/dashboard/food-owners");
    default:
      // برای مشتریان عادی
      redirect("/dashboard/user/orders");
  }
};

export default DashboardPage;
