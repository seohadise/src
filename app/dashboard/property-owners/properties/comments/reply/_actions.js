"use server";

import connectDB from "@/config/db";
import Comment from "@/models/Comment";
import Property from "@/models/Property";

import { getUser } from "@/lib/helpers";
import { redirect } from "next/navigation";

export const replyToComment = async (formData) => {
  const commentId = formData.get("commentId");
  const reply = formData.get("reply");
  
  if (!commentId || !reply) {
    return { success: false, message: "اطلاعات ناقص است" };
  }
  
  try {
    await connectDB();
    
    const user = await getUser();
    
    // دریافت نظر مورد نظر
    const comment = await Comment.findById(commentId);
    
    if (!comment || comment.itemType !== "property") {
      return { success: false, message: "نظر مورد نظر یافت نشد" };
    }
    
    // بررسی مالکیت ملک
    const property = await Property.findOne({
      _id: comment.itemId,
      owner: user._id
    });
    
    if (!property) {
      return { success: false, message: "شما مجاز به پاسخ به این نظر نیستید" };
    }
    
    // ثبت پاسخ
    comment.reply = reply;
    comment.replyDate = new Date();
    
    await comment.save();
    
    // ریدایرکت به صفحه نظرات
    redirect(`/dashboard/property-owners/properties/comments/${property._id}`);
    
  } catch (error) {
    console.error("Error replying to comment:", error);
    return { success: false, message: "خطا در ثبت پاسخ" };
  }
};
