"use client";

import { useState } from "react";
import { FormField, FormSubmitButton } from "@/components/form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useOnboarding } from "@/hooks/use-onboarding";
import {
  EMPLOYEES_OPTIONS,
  REFERRAL_OPTIONS,
  REVENUE_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  YEARS_OPTIONS,
} from "./_constants";

export default function OnboardingPage() {
  const { user } = useAuth();
  const { completeOnboarding, isLoading, error } = useOnboarding();

  const [companyName, setCompanyName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [serviceTypeOther, setServiceTypeOther] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [employeesBand, setEmployeesBand] = useState("__none__");
  const [yearsBand, setYearsBand] = useState("__none__");
  const [revenueBand, setRevenueBand] = useState("__none__");
  const [referral, setReferral] = useState("__none__");
  const [clientError, setClientError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    const resolvedServiceType =
      serviceType === "__other__"
        ? serviceTypeOther.trim()
        : serviceType;

    if (serviceType === "__other__" && !resolvedServiceType) {
      setClientError('Please describe your service type under "Other".');
      return;
    }

    if (!serviceType) {
      setClientError("Please select a service type.");
      return;
    }

    const employees_count =
      EMPLOYEES_OPTIONS.find((o) => o.value === employeesBand)?.count ?? null;
    const years_in_business =
      YEARS_OPTIONS.find((o) => o.value === yearsBand)?.years ?? null;
    const estimated_revenue =
      REVENUE_OPTIONS.find((o) => o.value === revenueBand)?.amount ?? null;

    const referral_source = referral === "__none__" ? null : referral;

    await completeOnboarding({
      companyName: companyName.trim(),
      serviceType: resolvedServiceType,
      phone: phone.trim(),
      address: address.trim() || null,
      employees_count,
      years_in_business,
      estimated_revenue,
      referral_source,
    });
  };

  const selectTriggerClass =
    "w-full h-11 bg-white text-gray-900 border-gray-300 shadow-sm [&>span]:text-gray-900 data-[placeholder]:text-gray-500";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-lg w-full text-gray-900">
      <div className="mb-8">
        <div className="w-12 h-12 bg-primary/15 rounded-lg flex items-center justify-center mb-4">
          <span className="text-primary text-2xl">🏢</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome to Ergon</h1>
        <p className="mt-2 text-sm text-gray-600">
          Let&apos;s set up your company so you can start managing jobs,
          customers, and finances.
        </p>
        {user?.email && (
          <p className="mt-3 text-xs text-gray-700">
            <span className="font-medium text-gray-900">Account email</span>{" "}
            (from sign up — required):{" "}
            <span className="text-primary font-medium">{user.email}</span>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
            Required
          </h2>

          <FormField
            label="Company name"
            id="company_name"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Your business name"
          />

          <div className="space-y-2">
            <Label htmlFor="service_type_trigger" className="text-gray-900">
              Service type
            </Label>
            <p className="text-xs text-gray-600">
              Choose the category that best describes your business.
            </p>
            <Select
              value={serviceType || undefined}
              onValueChange={setServiceType}
            >
              <SelectTrigger id="service_type_trigger" className={selectTriggerClass}>
                <SelectValue placeholder="Select your primary service" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {serviceType === "__other__" && (
            <FormField
              label="Describe your service type"
              id="service_type_other"
              required
              value={serviceTypeOther}
              onChange={(e) => setServiceTypeOther(e.target.value)}
              placeholder="e.g. Mobile pet grooming"
            />
          )}

          <FormField
            label="Business phone number"
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
            Optional
          </h2>
          <p className="text-xs text-gray-500">
            Help us tailor Ergon — you can skip any of these.
          </p>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-gray-900">
              Business address
            </Label>
            <p className="text-xs text-gray-600">
              Physical location or service area (optional).
            </p>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, city, state (optional)"
              rows={3}
              className="resize-y min-h-[80px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employees" className="text-gray-900">
              Number of employees
            </Label>
            <p className="text-xs text-gray-600">
              Rough headcount for your team (optional).
            </p>
            <Select value={employeesBand} onValueChange={setEmployeesBand}>
              <SelectTrigger id="employees" className={selectTriggerClass}>
                <SelectValue placeholder="Select a range" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYEES_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="years" className="text-gray-900">
              Years in business
            </Label>
            <p className="text-xs text-gray-600">
              How long you&apos;ve been operating (optional).
            </p>
            <Select value={yearsBand} onValueChange={setYearsBand}>
              <SelectTrigger id="years" className={selectTriggerClass}>
                <SelectValue placeholder="Select a range" />
              </SelectTrigger>
              <SelectContent>
                {YEARS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="revenue" className="text-gray-900">
              Estimated annual revenue
            </Label>
            <p className="text-xs text-gray-600">
              Approximate yearly revenue band (optional).
            </p>
            <Select value={revenueBand} onValueChange={setRevenueBand}>
              <SelectTrigger id="revenue" className={selectTriggerClass}>
                <SelectValue placeholder="Select a range" />
              </SelectTrigger>
              <SelectContent>
                {REVENUE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referral" className="text-gray-900">
              How did you hear about us?
            </Label>
            <p className="text-xs text-gray-600">
              Helps us know what&apos;s working (optional).
            </p>
            <Select value={referral} onValueChange={setReferral}>
              <SelectTrigger id="referral" className={selectTriggerClass}>
                <SelectValue placeholder="Select one (optional)" />
              </SelectTrigger>
              <SelectContent>
                {REFERRAL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        {(clientError || error) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-800">Onboarding error</h3>
            <p className="mt-1 text-sm text-red-700">{clientError ?? error}</p>
          </div>
        )}

        <FormSubmitButton
          disabled={isLoading}
          className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isLoading ? "Creating company…" : "Continue to dashboard"}
        </FormSubmitButton>
      </form>
    </div>
  );
}
