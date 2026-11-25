"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  phoneSchema,
  completeRegistrationSchema,
} from "@/schemas/auth";

const toEnglishDigits = (str) => {
  if (!str) return str;
  return str
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
};

const apiSendOtp = async (data) => {
  const res = await fetch("/api/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

const apiVerifyOtp = async (data) => {
  const res = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

const apiCompleteRegistration = async (data) => {
  const res = await fetch("/api/auth/complete-registration", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";

import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";

import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Home, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

const AuthFlow = () => {
  const [step, setStep] = useState("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);

  const phoneForm = useForm({
    resolver: zodResolver(phoneSchema),
    defaultValues: { number: "" },
  });

  const profileForm = useForm({
    resolver: zodResolver(completeRegistrationSchema),
    defaultValues: { fullName: "", type: "property-owner" },
  });

  const { mutate: sendOtpMutate, isPending: isSendingOtp } = useMutation({
    mutationFn: apiSendOtp,
    onSuccess: (data) => {
      if (!data) {
        toast.error("خطایی رخ داده است");
        return;
      }
      if (data.success) {
        setPhoneNumber(phoneForm.getValues("number"));
        setStep("otp");
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || "خطایی رخ داده است");
    },
  });

  const { mutate: verifyOtpMutate, isPending: isVerifying } = useMutation({
    mutationFn: apiVerifyOtp,
    onSuccess: (data) => {
      if (!data) {
        toast.error("خطایی رخ داده است");
        return;
      }
      if (data.success) {
        toast.success(data.message);
        if (data.isNewUser) {
          setStep("profile");
        } else {
          setTimeout(() => {
            window.location.href = "/";
          }, 500);
        }
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || "خطا در تایید کد");
    },
  });

  const { mutate: completeRegMutate, isPending: isCompleting } = useMutation({
    mutationFn: apiCompleteRegistration,
    onSuccess: (data) => {
      if (!data) {
        toast.error("خطایی رخ داده است");
        return;
      }
      if (data.success) {
        const userType = profileForm.getValues("type");
        if (userType === "property-owner") {
          setShowWelcome(true);
        } else {
          toast.success(data.message);
          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
        }
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || "خطایی رخ داده است");
    },
  });

  if (showWelcome) {
    return (
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader className="items-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <DialogTitle className="text-xl text-center">
              ثبت‌نام شما با موفقیت تکمیل شد!
            </DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              خوش آمدید به تریپ‌گود 🎉
              <br />
              حالا می‌توانید اولین اقامتگاه خود را ثبت کنید و میزبان مسافران باشید.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Link href="/dashboard/property-owners/properties/new" className="w-full">
              <Button className="w-full" size="lg">
                <Home className="ml-2 h-5 w-5" />
                شروع ثبت اقامتگاه
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              بازگشت به صفحه اصلی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (step === "otp") {
    return (
      <div className="flex flex-col gap-4 mt-3">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            کد تایید به شماره <span dir="ltr" className="font-bold">{phoneNumber}</span> ارسال شد
          </p>
        </div>

        <Label className="text-center">کد تایید ۴ رقمی را وارد کنید</Label>

        <div dir="ltr" className="mx-auto self-center">
          <InputOTP
            maxLength={4}
            value={otpValue}
            onChange={(value) => setOtpValue(value)}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          size="lg"
          className="w-full"
          disabled={isVerifying || otpValue.length !== 4}
          onClick={() =>
            verifyOtpMutate({
              otp: otpValue,
              number: phoneNumber,
            })
          }
        >
          {isVerifying ? "در حال تایید..." : "تایید کد"}
        </Button>

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            setStep("phone");
            setOtpValue("");
          }}
        >
          <ArrowRight className="ml-2 h-4 w-4" />
          تغییر شماره موبایل
        </Button>
      </div>
    );
  }

  if (step === "profile") {
    return (
      <Form {...profileForm}>
        <form
          className="mt-3 space-y-4"
          onSubmit={profileForm.handleSubmit(completeRegMutate)}
        >
          <FormField
            name="fullName"
            control={profileForm.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>نام و نام خانوادگی</FormLabel>
                <FormControl>
                  <Input placeholder="علی مرادی" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={profileForm.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نوع کاربری</FormLabel>
                <Select
                  dir="rtl"
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="لطفا نوع کاربری خود را انتخاب کنید" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="property-owner">ملک دار</SelectItem>
                    <SelectItem value="bus-owner">اتوبوس دار</SelectItem>
                    <SelectItem value="food-owner">غذا دار</SelectItem>
                    <SelectItem value="customer">مشتری</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button size="lg" className="w-full" disabled={isCompleting}>
            {isCompleting ? "در حال ثبت..." : "تکمیل ثبت نام"}
          </Button>
        </form>
      </Form>
    );
  }

  return (
    <Form {...phoneForm}>
      <form
        className="space-y-4 mt-3"
        onSubmit={phoneForm.handleSubmit(sendOtpMutate)}
      >
        <FormField
          name="number"
          control={phoneForm.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>شماره موبایل</FormLabel>
              <FormControl>
                <Input
                  placeholder="09123456789"
                  dir="ltr"
                  className="text-right"
                  {...field}
                  onChange={(e) => {
                    const val = toEnglishDigits(e.target.value).replace(/[^0-9]/g, "");
                    field.onChange(val);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button size="lg" className="w-full" disabled={isSendingOtp}>
          {isSendingOtp ? "در حال ارسال کد..." : "دریافت کد تایید"}
        </Button>
      </form>
    </Form>
  );
};

export default AuthFlow;
