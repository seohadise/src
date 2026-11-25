"use client";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema } from "@/schemas/auth";

import { changePassword } from "@/app/_actions";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

import { Input } from "../ui/input";
import { PasswordInput } from "../ui/password-input";
import { Button } from "../ui/button";

import { toast } from "sonner";

const ChangePassword = () => {
  const form = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data) => {
    const response = await changePassword(data);

    if (response.success) {
      toast.success(response.message);
      form.reset();
    } else {
      toast.error(response.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-2.5">
      <Card className="w-[355px]">
        <CardHeader>
          <CardTitle>تغییر رمز عبور</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رمز عبور فعلی</FormLabel>
                    <FormControl>
                      <PasswordInput {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
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
                control={form.control}
                name="confirmPassword"
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

              <Button disabled={form.formState.isSubmitting} className="w-full">
                تغییر رمز عبور
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangePassword;
