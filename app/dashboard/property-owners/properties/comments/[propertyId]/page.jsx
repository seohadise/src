import connectDB from "@/config/db";
import Property from "@/models/Property";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { getUser } from "@/lib/helpers";
import { notFound } from "next/navigation";
import Link from "next/link";

import { Star, ArrowLeft, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";

export const metadata = {
  title: "مدیریت نظرات ملک",
};

const Page = async ({ params }) => {
  const { propertyId } = params;

  try {
    await connectDB();

    const user = await getUser();

    if (!user) {
      return notFound();
    }

    // بررسی وجود ملک و مالکیت آن
    const property = await Property.findOne({
      _id: propertyId,
      owner: user._id
    }).lean();

    if (!property) {
      return notFound();
    }
  
  // دریافت نظرات از مدل Property
  const comments = property.comments || [];

  // محاسبه آمار نظرات
  const totalComments = comments.length;
  const averageRating = totalComments > 0
    ? (comments.reduce((sum, comment) => sum + comment.rating, 0) / totalComments).toFixed(1)
    : 0;
  const positiveComments = comments.filter(c => c.rating >= 4).length;
  const negativeComments = comments.filter(c => c.rating <= 2).length;
  
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">مدیریت نظرات ملک</h1>
        
        <Link href={`/dashboard/property-owners/properties/edit/${propertyId}`}>
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            بازگشت به مدیریت ملک
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            اطلاعات ملک
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">نام ملک:</span>
            <span>{property.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">شهر:</span>
            <span>{property.city}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">وضعیت:</span>
            <Badge variant={property.status === "approved" ? "success" : "warning"}>
              {property.status === "approved" ? "تایید شده" : "در انتظار تایید"}
            </Badge>
          </div>
        </CardContent>
      </Card>
      
      {/* آمار نظرات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تعداد نظرات</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalComments}</div>
            <p className="text-xs text-muted-foreground">
              نظر ثبت شده
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">میانگین امتیاز</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {averageRating > 0 ? averageRating : "بدون امتیاز"}
            </div>
            <p className="text-xs text-muted-foreground">
              از 5 امتیاز
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نظرات مثبت</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{positiveComments}</div>
            <p className="text-xs text-muted-foreground">
              {totalComments > 0 ? `${Math.round(positiveComments / totalComments * 100)}%` : "0%"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نظرات منفی</CardTitle>
            <ThumbsDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{negativeComments}</div>
            <p className="text-xs text-muted-foreground">
              {totalComments > 0 ? `${Math.round(negativeComments / totalComments * 100)}%` : "0%"}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* لیست نظرات */}
      <Card>
        <CardHeader>
          <CardTitle>نظرات کاربران</CardTitle>
        </CardHeader>
        <CardContent>
          {comments.length > 0 ? (
            <div className="space-y-6">
              {comments.map((comment, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        <span className="text-xl font-bold text-gray-500">
                          {comment.name?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{comment.name || "کاربر ناشناس"}</p>
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
                  
                  <p className="text-gray-700">{comment.text}</p>
                  
                  {comment.reply && (
                    <div className="mr-8 mt-2 p-3 bg-gray-50 rounded-md border-r-4 border-primary">
                      <p className="text-xs font-medium text-primary mb-1">پاسخ شما:</p>
                      <p className="text-gray-700">{comment.reply.text}</p>
                    </div>
                  )}

                  {!comment.reply && (
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" className="text-xs">
                        پاسخ به این نظر
                      </Button>
                    </div>
                  )}
                  
                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              هنوز هیچ نظری برای این ملک ثبت نشده است.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
  } catch (error) {
    console.error("Error in comments page:", error);
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-red-600">خطا در بارگذاری صفحه</h1>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    );
  }
};

export default Page;
