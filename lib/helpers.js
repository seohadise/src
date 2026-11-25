import connectDB from "@/config/db";
import User from "@/models/User";

import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";

export const getUser = async () => {
  const cookiesStore = await cookies();

  const token = cookiesStore.get("token")?.value;

  if (!token) return null;

  try {
    const decoded = verify(token, process.env.JWT_SECRET);

    if (!decoded) return null;

    connectDB();

    const user = await User.findById(decoded.id);

    if (!user) return null;

    return user;
  } catch {
    return null;
  }
};
