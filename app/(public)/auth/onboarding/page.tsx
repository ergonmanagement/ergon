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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="mb-8">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
          <span className="text-blue-600 text-2xl">🏢</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome to Ergon</h1>
        <p className="mt-2 text-sm text-gray-600">
          Let&apos;s set up your company so you can start managing jobs, customers, and finances.
        </p>
        {user?.email && (
          <p className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
            Signed in as {user.email}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          label="Company name"
          id="company_name"
          required
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Enter your company name"
        />
        <FormField
          label="Service type"
          id="service_type"
          placeholder="Auto detailing, window washing, landscaping, etc."
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
          placeholder="(555) 123-4567"
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Onboarding Error
                </h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <FormSubmitButton
          disabled={isLoading}
          className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating company...
            </span>
          ) : (
            "Continue to dashboard"
          )}
        </FormSubmitButton>
      </form>
    </div>
  );
}

