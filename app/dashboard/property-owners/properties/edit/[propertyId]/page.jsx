import connectDB from "@/config/db";
import Property from "@/models/Property";

import EditProperty from "@/components/properties/edit-property";

import { getUser } from "@/lib/helpers";
import { notFound } from "next/navigation";

export const metadata = {
  title: "ویرایش ملک",
};

const Page = async ({ params }) => {
  connectDB();

  const user = await getUser();

  const propertyId = (await params)?.propertyId;

  const property = await Property.findById(propertyId).lean();

  if (!property || property?.owner?.toString() !== user?._id?.toString()) notFound();

  return <EditProperty property={JSON.parse(JSON.stringify(property))} />;
};

export default Page;
