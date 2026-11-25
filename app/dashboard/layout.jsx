import GoftinoInfo from "@/components/global/goftino";

import Nav from "@/components/ui/nav";

import { getUser } from "@/lib/helpers";

import {
  busOwnerRoutes,
  propertyOwnerRoutes,
  foodOwnerRoutes,
  customerRoutes,
} from "@/constants/routes";

// اجبار به dynamic rendering برای استفاده از cookies
export const dynamic = 'force-dynamic';

const DashboardsLayout = async ({ children }) => {
  const user = await getUser();
  
  // انتخاب منوی مناسب بر اساس نوع کاربر
  let routes;
  if (user?.type === "property-owner") {
    routes = propertyOwnerRoutes;
  } else if (user?.type === "bus-owner") {
    routes = busOwnerRoutes;
  } else if (user?.type === "food-owner") {
    routes = foodOwnerRoutes;
  } else {
    routes = customerRoutes;
  }

  return (
    <>
      <Nav routes={routes} />
      {children}
      <GoftinoInfo
        name={user?.fullName}
        number={user?.number}
        type={
          user?.type === "property-owner"
            ? "ملک دار"
            : user?.type === "bus-owner"
            ? "اتوبوس دار"
            : user?.type === "food-owner"
            ? "غذا دار"
            : "مشتری"
        }
      />
    </>
  );
};

export default DashboardsLayout;
