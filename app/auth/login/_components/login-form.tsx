"use client";

import Link from "next/link";
import { useState } from "react";
import { FormField, FormError, FormSubmitButton } from "@/components/form";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { useLogin } from "@/hooks/use-login";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error } = useLogin();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

  return (
    <div className="flex flex-col gap-6">
      <AppPageHeader title="Sign in" variant="minimal" />
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <FormField
          label="Email"
          id="email"
          type="email"
          placeholder="m@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FormField
          label="Password"
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          labelAside={
            <Link
              href="/auth/forgot-password"
              className="text-sm text-primary hover:underline underline-offset-2"
            >
              Forgot password?
            </Link>
          }
        />
        <FormError message={error} />
        <FormSubmitButton disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </FormSubmitButton>
      </form>
      <p className="text-sm text-center">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/sign-up"
          className="text-primary font-medium hover:underline underline-offset-2"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
