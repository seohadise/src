import EditBus from "@/components/buses/edit-bus";

import connectDB from "@/config/db";
import Bus from "@/models/Bus";

import { getUser } from "@/lib/helpers";
import { notFound } from "next/navigation";

export const metadata = {
  title: "ویرایش اطلاعات وسیله نقلیه",
};

const Page = async ({ params }) => {
  await connectDB();

  const user = await getUser();

  const bus = await Bus.findById((await params)?.busId);

  if (!bus || bus?.owner?.toString() !== user?._id?.toString()) notFound();

  return <EditBus bus={JSON.parse(JSON.stringify(bus))} />;
};

export default Page;
