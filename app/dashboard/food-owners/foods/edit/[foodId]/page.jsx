import EditFood from "@/components/foods/edit-food";

import connectDB from "@/config/db";
import Food from "@/models/Food";

import { getUser } from "@/lib/helpers";
import { notFound } from "next/navigation";

export const metadata = {
  title: "ویرایش اطلاعات آشپزخانه",
};

const Page = async ({ params }) => {
  await connectDB();

  const user = await getUser();

  const food = await Food.findById((await params)?.foodId);

  if (!food || food?.owner?.toString() !== user?._id?.toString()) notFound();

  return <EditFood food={JSON.parse(JSON.stringify(food))} />;
};

export default Page;
