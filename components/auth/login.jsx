"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";

import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/schemas/auth";
import { login } from "@/app/auth/_actions";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";

import { Input } from "../ui/input";
import { PasswordInput } from "../ui/password-input";
import { Button } from "../ui/button";

import { toast } from "sonner";

const Login = () => {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      if (!data) {
        toast.error("خطایی رخ داده است");
        return;
      }
      if (data.success) {
        toast.success(data.message);
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || "خطایی رخ داده است");
    },
  });

  return (
    <Form {...form}>
      <form className="space-y-3.5 mt-3" onSubmit={form.handleSubmit(mutate)}>
        <FormField
          name="identifier"
          control={form.control}
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

        <Button disabled={isPending} size="lg" className="w-full">
          ورود
        </Button>

        <div className="flex justify-center">
          <Link
            href="/auth/forgot-password"
            className="text-xs font-bold text-sky-500 !mt-3"
          >
            فراموشی رمز عبور
          </Link>
        </div>
      </form>
    </Form>
  );
};

export default Login;
