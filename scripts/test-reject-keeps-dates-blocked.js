import mongoose from "mongoose";

import connectDB from "@/config/db";
import Property from "@/models/Property";
import Reservation from "@/models/Reservation";

const formatDateKey = (d) => new Date(d).toDateString();

const main = async () => {
  await connectDB();

  const propertyId = process.env.TEST_PROPERTY_ID;
  if (!propertyId) {
    throw new Error("TEST_PROPERTY_ID is required");
  }

  const property = await Property.findById(propertyId);
  if (!property) {
    throw new Error("Property not found");
  }

  const checkInDate = new Date("2030-01-10T00:00:00.000Z");
  const checkOutDate = new Date("2030-01-12T00:00:00.000Z");

  const reservation = await Reservation.create({
    user: property.owner,
    targetUser: property.owner,
    itemType: "property",
    itemModel: "Property",
    itemId: property._id,
    checkInDate,
    checkOutDate,
    amount: 1000,
    totalPrice: 1000,
    status: "pending",
  });

  await Property.findByIdAndUpdate(property._id, { $push: { reservations: reservation._id } });

  // Simulate blocked dates (as payment/create does)
  const dates = [];
  const current = new Date(checkInDate);
  while (current < checkOutDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  for (const dateToBlock of dates) {
    const idx = property.availableDates.findIndex(
      (d) => formatDateKey(d.date) === formatDateKey(dateToBlock)
    );

    if (idx >= 0) {
      property.availableDates[idx].isReserved = true;
    } else {
      property.availableDates.push({
        date: dateToBlock,
        isReserved: true,
        isPeakSeason: false,
      });
    }
  }

  await property.save();

  const before = await Property.findById(property._id);
  const beforeReserved = dates.every((d) => {
    const obj = before.availableDates.find((x) => formatDateKey(x.date) === formatDateKey(d));
    return obj?.isReserved;
  });

  if (!beforeReserved) {
    throw new Error("Precondition failed: dates are not reserved before rejection");
  }

  // Reject reservation (should NOT unblock)
  await Reservation.findByIdAndUpdate(reservation._id, { status: "rejected" });

  const after = await Property.findById(property._id);
  const afterReserved = dates.every((d) => {
    const obj = after.availableDates.find((x) => formatDateKey(x.date) === formatDateKey(d));
    return obj?.isReserved;
  });

  if (!afterReserved) {
    throw new Error("FAILED: dates were unblocked after rejection");
  }

  console.log("PASS: dates remained reserved after rejection");

  // Cleanup
  await Reservation.deleteOne({ _id: reservation._id });
};

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
