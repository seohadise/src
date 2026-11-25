"use client";

import { useRouter } from "next/navigation";

import { Button } from "../ui/button";

import { ChevronLeft } from "lucide-react";

const Back = () => {
  const router = useRouter();
  
  return (
    <Button
      onClick={() => router.back()}
      variant="outline"
      size="icon"
      className="absolute top-5 left-5"
    >
      <ChevronLeft />
    </Button>
  );
};

export default Back;
