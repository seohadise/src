"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";

import { zodResolver } from "@hookform/resolvers/zod";
import { forgotSchema, resetSchema } from "@/schemas/auth";

import { forgotPassword, verifyOtp, resetPassword } from "@/app/auth/_actions";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";

import { Input } from "../ui/input";
import { PasswordInput } from "../ui/password-input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";

import { toast } from "sonner";

const ForgotPassword = () => {
  const router = useRouter();

  const [step, setStep] = useState("forgot"); // forgot -> otp -> reset
  const [identifier, setIdentifier] = useState("");
  const [otpValue, setOtpValue] = useState("");

  const forgotForm = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { identifier: "" },
  });

  const resetForm = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const { mutate: forgotMutation, isPending: isForgotPending } = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (data) => {
      if (!data) {
        toast.error("خطایی رخ داده است");
        return;
      }
      if (data.success) {
        setIdentifier(forgotForm.getValues("identifier"));
        setStep("otp");
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
  });

  const { mutate: verifyOtpMutation, isPending: isVerifyPending } = useMutation(
    {
      mutationFn: verifyOtp,
      onSuccess: (data) => {
        if (!data) {
          toast.error("خطایی رخ داده است");
          return;
        }
        if (data.success) {
          setStep("reset");
          toast.success("کد با موفقیت تایید شد");
        } else {
          toast.error(data.message);
        }
      },
    }
  );

  const { mutate: resetMutation, isPending: isResetPending } = useMutation({
    mutationFn: resetPassword,
    onSuccess: (data) => {
      if (!data) {
        toast.error("خطایی رخ داده است");
        return;
      }
      if (data.success) {
        toast.success(data.message);
        router.push("/auth");
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || "خطایی رخ داده است");
    },
  });

  const renderForm = () => {
    switch (step) {
      case "forgot":
        return (
          <Form {...forgotForm}>
            <form
              className="space-y-3.5 mt-3"
              onSubmit={forgotForm.handleSubmit((data) => forgotMutation(data))}
            >
              <FormField
                name="identifier"
                control={forgotForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ایمیل ، نام کاربری یا شماره تلفن</FormLabel>
                    <FormControl>
                      <Input placeholder="example@gmail.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button size="lg" className="w-full" disabled={isForgotPending}>
                {isForgotPending ? "در حال ارسال..." : "ارسال کد"}
              </Button>
            </form>
          </Form>
        );

      case "otp":
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
              disabled={isVerifyPending || otpValue.length !== 4}
              onClick={() => verifyOtpMutation({ otp: otpValue, identifier })}
            >
              {isVerifyPending ? "در حال تایید..." : "تایید کد"}
            </Button>
          </div>
        );

      case "reset":
        return (
          <Form {...resetForm}>
            <form
              className="space-y-3.5 mt-3"
              onSubmit={resetForm.handleSubmit((data) =>
                resetMutation({ ...data, identifier })
              )}
            >
              <FormField
                name="password"
                control={resetForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رمز عبور جدید</FormLabel>
                    <FormControl>
                      <PasswordInput {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="confirmPassword"
                control={resetForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تکرار رمز عبور جدید</FormLabel>
                    <FormControl>
                      <PasswordInput {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button size="lg" className="w-full" disabled={isResetPending}>
                {isResetPending ? "در حال بازنشانی..." : "بازنشانی رمز عبور"}
              </Button>
            </form>
          </Form>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3">
      <Card className="w-[355px] max-w-[355px]">
        <CardHeader>
          <CardTitle>فراموشی رمز عبور</CardTitle>
        </CardHeader>
        <CardContent>
          {renderForm()}
          <Button
            type="button"
            variant="outline"
            className="w-full mt-3"
            onClick={() => router.back()}
          >
            بازگشت
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
