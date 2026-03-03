"use client";

import { useState } from "react";
import { FormField, FormSubmitButton } from "@/components/form";
import { useAuth } from "@/hooks/use-auth";
import { useOnboarding } from "@/hooks/use-onboarding";

export default function OnboardingPage() {
  const { user } = useAuth();
  const { completeOnboarding, isLoading, error } = useOnboarding();
  const [companyName, setCompanyName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await completeOnboarding({
      companyName,
      serviceType,
      phone,
    });
  };

  return (
    <div className="w-full max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome to Ergon</h1>
        <p className="mt-2 text-sm text-white/70">
          Let&apos;s set up your company so you can start managing jobs, customers, and finances.
        </p>
        {user?.email && (
          <p className="mt-1 text-xs text-white/60">Signed in as {user.email}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Company name"
          id="company_name"
          required
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
        <FormField
          label="Service type"
          id="service_type"
          placeholder="Auto detailing, window washing, etc."
          required
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
        />
        <FormField
          label="Phone number"
          id="phone"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        <FormSubmitButton disabled={isLoading}>
          {isLoading ? "Creating company..." : "Continue to dashboard"}
        </FormSubmitButton>
      </form>
    </div>
  );
}

