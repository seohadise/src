"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";

import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/schemas/auth";
import { register, verifyOtp } from "@/app/auth/_actions";

const toEnglishDigits = (str) => {
  if (!str) return str;
  return str
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
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
import { PasswordInput } from "../ui/password-input";
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
import { Home, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const Register = () => {
  const [showOtp, setShowOtp] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      username: "",
      number: "",
      email: "",
      password: "",
      confirmPassword: "",
      type: "property-owner",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      if (!data) {
        toast.error("خطایی رخ داده است");
        return;
      }
      if (data.success) {
        setShowOtp(true);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || "خطایی رخ داده است");
    },
  });

  const { mutate: verifyOtpMutation, isPending: isVerifying } = useMutation({
    mutationFn: verifyOtp,
    onSuccess: (data) => {
      if (!data) {
        toast.error("خطایی رخ داده است");
        return;
      }
      if (data.success) {
        toast.success(data.message);
        const userType = form.getValues("type");
        if (userType === "property-owner") {
          setShowWelcome(true);
        } else {
          setTimeout(() => {
            location.href = "/auth";
          }, 1500);
        }
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || "خطا در تایید کد");
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
                setShowWelcome(false);
                setShowOtp(false);
                form.reset();
              }}
            >
              بازگشت
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (showOtp) {
    return (
      <div className="flex flex-col gap-3 mt-3">
        <Label>کد تایید</Label>

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
            verifyOtpMutation({
              otp: otpValue,
              identifier: form.getValues("number"),
            })
          }
        >
          {isVerifying ? "در حال تایید..." : "تایید کد"}
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3 lg:[&>*:nth-last-child(-n+2)]:col-span-2"
        onSubmit={form.handleSubmit(mutate)}
      >
        <FormField
          name="fullName"
          control={form.control}
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
          name="username"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>نام کاربری</FormLabel>
              <FormControl>
                <Input placeholder="ali_moradi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="number"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>شماره موبایل</FormLabel>
              <FormControl>
                <Input placeholder="09123456789" {...field}
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

        <FormField
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>ایمیل</FormLabel>
              <FormControl>
                <Input placeholder="example@gmail.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="password"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>رمز عبور</FormLabel>
              <FormControl>
                <PasswordInput placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="confirmPassword"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>تکرار رمز عبور</FormLabel>
              <FormControl>
                <PasswordInput placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نوع کاربری : </FormLabel>
              <Select
                dir="rtl"
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full flex-1">
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

        <Button size="lg" className="w-full" disabled={isPending}>
          {isPending ? "در حال ثبت..." : "ثبت"}
        </Button>
      </form>
    </Form>
  );
};

export default Register;
