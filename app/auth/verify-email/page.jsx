import connectDB from "@/config/db";
import User from "@/models/User";

import Link from "next/link";

import { notFound } from "next/navigation";

import { verify } from "jsonwebtoken";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { buttonVariants } from "@/components/ui/button";

export const metadata = {
  title: "تایید ایمیل کاربری",
};

const Page = async ({ searchParams }) => {
  const token = (await searchParams)?.token;

  if (!token) return notFound();

  try {
    const decoded = verify(token, process.env.JWT_SECRET);

    await connectDB();

    const user = await User.findOne({ email: decoded.email });

    if (!user) return notFound();

    if (user.emailVerifiedAt) return notFound();

    user.emailVerifiedAt = new Date();
    await user.save();
  } catch {
    return notFound();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-3 ">
      <Card>
        <CardHeader>
          <CardTitle>🎊🎊 ایمیل شما تایید شد ! 🎊🎊</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm font-medium leading-loose">
            تبریک،ایمیل شما تایید شده و هم اکنون میتوانید از تمامی امکانات
            وبسایت بهره مند شوید.
          </p>
        </CardContent>
        <CardFooter>
          <Link
            href="/"
            className={buttonVariants({
              variant: "outline",
              className: "self-center mx-auto",
            })}
          >
            بازگشت به صفحه اصلی
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Page;
