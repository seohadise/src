import connectDB from "@/config/db";
import Food from "@/models/Food";
import Reservation from "@/models/Reservation";

import FoodComponent from "@/components/foods/food";

import { getUser } from "@/lib/helpers";

import { notFound } from "next/navigation";

const getFood = async (foodId, currentUser) => {
  try {
    await connectDB();
    const food = await Food.findById(foodId).populate("owner", "fullName email number").lean();

    if (!food) return null;

    // بررسی آیا کاربر جاری رزرو تایید شده برای این غذا دارد
    let hasConfirmedReservation = false;
    if (currentUser) {
      const userReservation = await Reservation.findOne({
        itemType: "food",
        itemId: food._id,
        user: currentUser._id,
        status: "confirmed",
      }).lean();
      hasConfirmedReservation = !!userReservation;
    }

    // اگر کاربر رزرو تایید شده ندارد، اطلاعات تماس مالک را مخفی کن
    if (!hasConfirmedReservation) {
      if (food.owner) {
        food.owner = {
          _id: food.owner._id,
          fullName: food.owner.fullName,
          // اطلاعات تماس مخفی می‌شود
          email: null,
          number: null,
        };
      }
    }

    return { food: JSON.parse(JSON.stringify(food)), hasConfirmedReservation };
  } catch {
    return null;
  }
};

export const generateMetadata = async ({ params }) => {
  const user = await getUser();
  const result = await getFood((await params)?.foodId, user);

  return {
    title: `غذای ${result?.food?.owner?.fullName}` || "رزرو آنلاین غذا",
  };
};

const Page = async ({ params }) => {
  const user = await getUser();
  const result = await getFood((await params)?.foodId, user);

  if (!result) notFound();

  const { food, hasConfirmedReservation } = result;

  if (!food) notFound();

  if (
    food.status !== "approved" &&
    (!user || (user?._id?.toString() !== food?.owner?._id?.toString() && !user?.isAdmin))
  ) {
    notFound();
  }

  return (
    <FoodComponent
      food={food}
      isLoggedin={user ? true : false}
      isOwner={user?._id?.toString() === food?.owner?._id?.toString()}
      name={user?.fullName}
      hasConfirmedReservation={hasConfirmedReservation}
    />
  );
};

export default Page;
