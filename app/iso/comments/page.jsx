"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Building,
  Bus,
  UtensilsCrossed,
  Filter,
} from "lucide-react";

const itemTypeLabels = {
  property: "ملک",
  bus: "اتوبوس",
  food: "غذا",
};

const itemTypeIcons = {
  property: Building,
  bus: Bus,
  food: UtensilsCrossed,
};

const CommentsPage = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/admin/comments?filter=${filter}`);
      if (response.data.success) {
        setComments(response.data.comments);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("خطا در دریافت نظرات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [filter]);

  const handleAction = async (itemType, itemId, commentId, action) => {
    setActionLoading(commentId);
    try {
      const response = await axios.patch("/api/admin/comments", {
        itemType,
        itemId,
        commentId,
        action,
      });
      if (response.data.success) {
        toast.success(response.data.message);
        fetchComments();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("خطا در انجام عملیات");
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = comments.length;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          مدیریت نظرات
        </h1>
        <Badge variant="outline" className="text-sm">
          {pendingCount} نظر
        </Badge>
      </div>

      {/* Filter buttons */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("pending")}
        >
          <Clock className="h-4 w-4 ml-1" />
          در انتظار تایید
        </Button>
        <Button
          variant={filter === "approved" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("approved")}
        >
          <CheckCircle className="h-4 w-4 ml-1" />
          تایید شده
        </Button>
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          همه
        </Button>
      </div>

      {/* Comments list */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filter === "pending"
              ? "نظرات در انتظار تایید"
              : filter === "approved"
              ? "نظرات تایید شده"
              : "همه نظرات"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment, index) => {
                const ItemIcon = itemTypeIcons[comment.itemType] || MessageSquare;
                return (
                  <div key={comment._id || index}>
                    <div className="flex flex-col gap-3 p-4 border rounded-lg">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-lg font-bold text-muted-foreground">
                              {comment.name?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{comment.name || "کاربر ناشناس"}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString("fa-IR", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < comment.rating
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          {comment.isApproved ? (
                            <Badge variant="default" className="bg-green-600">تایید شده</Badge>
                          ) : (
                            <Badge variant="secondary">در انتظار تایید</Badge>
                          )}
                        </div>
                      </div>

                      {/* Item info */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ItemIcon className="h-4 w-4" />
                        <span>
                          {itemTypeLabels[comment.itemType]}: {comment.itemName}
                        </span>
                      </div>

                      {/* Comment text */}
                      <p className="text-sm bg-muted/50 p-3 rounded-lg">{comment.text}</p>

                      {/* Reply */}
                      {comment.reply && (
                        <div className="mr-6 p-3 bg-blue-50 rounded-lg border-r-4 border-blue-400">
                          <p className="text-xs font-medium text-blue-600 mb-1">پاسخ مالک:</p>
                          <p className="text-sm">{comment.reply.text}</p>
                        </div>
                      )}

                      {/* Actions */}
                      {!comment.isApproved && (
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            disabled={actionLoading === (comment._id?.toString())}
                            onClick={() =>
                              handleAction(
                                comment.itemType,
                                comment.itemId,
                                comment._id,
                                "approve"
                              )
                            }
                          >
                            <CheckCircle className="h-4 w-4 ml-1" />
                            تایید
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={actionLoading === (comment._id?.toString())}
                            onClick={() =>
                              handleAction(
                                comment.itemType,
                                comment.itemId,
                                comment._id,
                                "reject"
                              )
                            }
                          >
                            <XCircle className="h-4 w-4 ml-1" />
                            حذف
                          </Button>
                        </div>
                      )}
                    </div>
                    {index < comments.length - 1 && <Separator className="my-2" />}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {filter === "pending"
                ? "هیچ نظر در انتظار تاییدی وجود ندارد"
                : filter === "approved"
                ? "هیچ نظر تایید شده‌ای وجود ندارد"
                : "هیچ نظری وجود ندارد"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommentsPage;
