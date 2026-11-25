import connectDB from "@/config/db";
import Bus from "@/models/Bus";
import Reservation from "@/models/Reservation";

import BusComponent from "@/components/buses/bus";

import { getUser } from "@/lib/helpers";

import { notFound } from "next/navigation";

const getBus = async (busId, currentUser) => {
  try {
    await connectDB();
    const bus = await Bus.findById(busId).populate("owner", "fullName email number").lean();

    if (!bus) return null;

    // بررسی آیا کاربر جاری رزرو تایید شده برای این اتوبوس دارد
    let hasConfirmedReservation = false;
    if (currentUser) {
      const userReservation = await Reservation.findOne({
        itemType: "bus",
        itemId: bus._id,
        user: currentUser._id,
        status: "confirmed",
      }).lean();
      hasConfirmedReservation = !!userReservation;
    }

    // اگر کاربر رزرو تایید شده ندارد، اطلاعات تماس مالک را مخفی کن
    if (!hasConfirmedReservation) {
      if (bus.owner) {
        bus.owner = {
          _id: bus.owner._id,
          fullName: bus.owner.fullName,
          // اطلاعات تماس مخفی می‌شود
          email: null,
          number: null,
        };
      }
    }

    return JSON.parse(JSON.stringify(bus));
  } catch {
    return null;
  }
};

export const generateMetadata = async ({ params }) => {
  const user = await getUser();
  const bus = await getBus((await params)?.busId, user);

  return {
    title: `خودروی ${bus?.vehicle?.name}` || "رزرو خودرو",
  };
};

const Page = async ({ params }) => {
  const user = await getUser();
  const bus = await getBus((await params)?.busId, user);

  if (!bus) notFound();

  if (
    bus.status !== "approved" &&
    (!user || (user?._id?.toString() !== bus?.owner?._id?.toString() && !user?.isAdmin))
  ) {
    notFound();
  }

  return (
    <BusComponent
      bus={bus}
      isLoggedin={user ? true : false}
      isOwner={user?._id?.toString() === bus?.owner?._id?.toString()}
      name={user?.fullName}
    />
  );
};

export default Page;
