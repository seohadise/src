"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const RequestActions = ({ item, type, onUpdate }) => {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (status) => {
    setLoading(true);
    try {
      // تصحیح endpoint برای انواع مختلف
      const endpointMap = {
        property: `/api/admin/property/${item._id}/status`,
        bus: `/api/admin/bus/${item._id}/status`,
        food: `/api/admin/food/${item._id}/status`
      };

      const endpoint = endpointMap[type];
      if (!endpoint) {
        throw new Error(`نوع نامعتبر: ${type}`);
      }

      console.log("Sending request to update status:", {
        type,
        itemId: item._id,
        endpoint,
        status
      });

      const response = await axios.patch(endpoint, { status });

      console.log("Response received:", response.data);

      if (response.data.success) {
        toast.success(`درخواست با موفقیت ${status === 'approved' ? 'تایید' : 'رد'} شد`);
        if (onUpdate) onUpdate();
      } else {
        console.error("Server returned error:", response.data);
        toast.error(response.data.message || "خطا در بروزرسانی وضعیت");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.response?.data?.message || "خطا در بروزرسانی وضعیت");
    } finally {
      setLoading(false);
    }
  };

  const getViewUrl = () => {
    const baseUrls = {
      property: `/property/${item._id}`,
      bus: `/bus/${item._id}`,
      food: `/food/${item._id}`
    };
    return baseUrls[type] || '#';
  };

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => window.open(getViewUrl(), '_blank')}
      >
        <Eye className="w-4 h-4 mr-1" />
        مشاهده
      </Button>
      
      <Button
        type="button"
        variant="default"
        onClick={() => handleStatusChange('approved')}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700"
      >
        <CheckCircle className="w-4 h-4 mr-1" />
        {loading ? '...' : 'تایید'}
      </Button>
      
      <Button
        type="button"
        variant="destructive"
        onClick={() => handleStatusChange('rejected')}
        disabled={loading}
      >
        <XCircle className="w-4 h-4 mr-1" />
        {loading ? '...' : 'رد'}
      </Button>
    </div>
  );
};

export default RequestActions;
