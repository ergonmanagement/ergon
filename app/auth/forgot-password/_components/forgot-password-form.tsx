"use client";

import Link from "next/link";
import { useState } from "react";
import { FormField, FormError, FormSubmitButton } from "@/components/form";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { useForgotPassword } from "@/hooks/use-forgot-password";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const { sendResetEmail, isLoading, error, success } = useForgotPassword();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendResetEmail(email);
  };

  if (success) {
    return (
      <div className="flex flex-col gap-4">
        <AppPageHeader title="Check your email" variant="minimal" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          If you registered using your email and password, you will receive a
          password reset email.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AppPageHeader title="Reset your password" variant="minimal" />
      <p className="text-sm text-muted-foreground leading-relaxed">
        Type in your email and we&apos;ll send you a link to reset your
        password
      </p>
      <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
        <FormField
          label="Email"
          id="email"
          type="email"
          placeholder="m@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FormError message={error} />
        <FormSubmitButton disabled={isLoading}>
          {isLoading ? "Sending..." : "Send reset email"}
        </FormSubmitButton>
      </form>
      <p className="text-sm text-center">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="text-primary font-medium hover:underline underline-offset-2"
        >
          Login
        </Link>
      </p>
    </div>
  );
}
