"use client";

import Link from "next/link";
import { useState } from "react";
import { FormField, FormError, FormSubmitButton } from "@/components/form";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { useSignUp } from "@/hooks/use-sign-up";

export function SignUpForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const { signUp, isLoading, error } = useSignUp();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUp({
      email,
      password,
      repeatPassword,
      firstName,
      lastName,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <AppPageHeader title="Create your account" variant="minimal" />
      <form onSubmit={handleSignUp} className="flex flex-col gap-4">
        <FormField
          label="First Name"
          id="first-name"
          type="text"
          placeholder="John"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <FormField
          label="Last Name"
          id="last-name"
          type="text"
          placeholder="Doe"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
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
        />
        <FormField
          label="Repeat Password"
          id="repeat-password"
          type="password"
          required
          value={repeatPassword}
          onChange={(e) => setRepeatPassword(e.target.value)}
        />
        <FormError message={error} />
        <FormSubmitButton disabled={isLoading}>
          {isLoading ? "Creating an account..." : "Sign up"}
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
