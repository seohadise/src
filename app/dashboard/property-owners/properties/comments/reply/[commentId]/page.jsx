import connectDB from "@/config/db";
import Comment from "@/models/Comment";
import Property from "@/models/Property";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

import { getUser } from "@/lib/helpers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { replyToComment } from "../_actions";

export const metadata = {
  title: "پاسخ به نظر کاربر",
};

const Page = async ({ params }) => {
  const { commentId } = params;
  
  await connectDB();
  
  const user = await getUser();
  
  // دریافت نظر مورد نظر
  const comment = await Comment.findById(commentId)
    .populate("user", "fullName avatar")
    .lean();
  
  if (!comment || comment.itemType !== "property") {
    return notFound();
  }
  
  // بررسی مالکیت ملک
  const property = await Property.findOne({
    _id: comment.itemId,
    owner: user._id
  }).lean();
  
  if (!property) {
    return notFound();
  }
  
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">پاسخ به نظر کاربر</h1>
        
        <Link href={`/dashboard/property-owners/properties/comments/${property._id}`}>
          <Button variant="outline">
            بازگشت به لیست نظرات
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>اطلاعات نظر</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {comment.user?.avatar ? (
                  <img 
                    src={comment.user.avatar} 
                    alt={comment.user.fullName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-gray-500">
                    {comment.user?.fullName?.charAt(0) || "?"}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium">{comment.user?.fullName || "کاربر ناشناس"}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleDateString("fa-IR")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-4 w-4 ${i < comment.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} 
                />
              ))}
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-gray-700">{comment.text}</p>
          </div>
          
          <form action={replyToComment}>
            <input type="hidden" name="commentId" value={comment._id.toString()} />
            <div className="space-y-4">
              <div>
                <label htmlFor="reply" className="block text-sm font-medium mb-2">
                  پاسخ شما
                </label>
                <Textarea
                  id="reply"
                  name="reply"
                  placeholder="پاسخ خود را به این نظر بنویسید..."
                  rows={5}
                  required
                />
              </div>
              
              <div className="flex justify-end">
                <Button type="submit">
                  ثبت پاسخ
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
