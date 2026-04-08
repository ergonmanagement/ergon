"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { useSubscription } from "@/hooks/use-subscription";
import { BillingCTA } from "@/app/(public)/pricing/_components/billing-cta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsClient() {
  const { company, loading, error, updateCompanyProfile } = useSubscription();
  const [name, setName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!company) return;
    setName(company.name);
    setServiceType(company.service_type);
    setPhone(company.phone);
    setAddress(company.address ?? "");
  }, [company]);

  async function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    const { error: upErr } = await updateCompanyProfile({
      name,
      service_type: serviceType,
      phone,
      address: address.trim() ? address : null,
    });
    setSaving(false);
    if (upErr) {
      setSaveError(upErr);
      return;
    }
    setSavedAt(Date.now());
  }

  return (
    <div className="space-y-8">
      <AppPageHeader
        title="Account settings"
        description="Company information and subscription status."
      />

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="ergon-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Company</h2>
          {loading && (
            <p className="text-sm text-muted-foreground">Loading company…</p>
          )}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {!loading && company && (
            <form onSubmit={handleSaveCompany} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company name</Label>
                <Input
                  id="company-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSavedAt(null);
                  }}
                  required
                  autoComplete="organization"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-service">Service type</Label>
                <Input
                  id="company-service"
                  value={serviceType}
                  onChange={(e) => {
                    setServiceType(e.target.value);
                    setSavedAt(null);
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-phone">Phone</Label>
                <Input
                  id="company-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setSavedAt(null);
                  }}
                  required
                  autoComplete="tel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-address">Address</Label>
                <Input
                  id="company-address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setSavedAt(null);
                  }}
                  autoComplete="street-address"
                />
              </div>
              {saveError && (
                <p className="text-sm text-destructive" role="alert">
                  {saveError}
                </p>
              )}
              {savedAt && !saveError && (
                <p className="text-xs text-muted-foreground">
                  Changes saved.
                </p>
              )}
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save company info"}
              </Button>
            </form>
          )}
          <div className="pt-2 border-t border-border space-y-1">
            <p className="text-xs text-muted-foreground">Subscription</p>
            {!loading && company && (
              <>
                <p className="text-xs text-muted-foreground">
                  Status:{" "}
                  <span className="capitalize text-foreground">
                    {company.subscription_status}
                  </span>
                </p>
                {company.trial_ends_at && (
                  <p className="text-xs text-muted-foreground">
                    Trial ends:{" "}
                    {new Date(company.trial_ends_at).toLocaleDateString()}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
        <div className="ergon-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Billing</h2>
          <BillingCTA />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Billing is handled securely by Stripe. You can cancel any time.
          </p>
        </div>
      </section>

      <section className="ergon-card p-6 space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Security</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          To change your password or manage your login, use the auth pages under{" "}
          <Link
            href="/auth/login"
            className="text-primary font-medium hover:underline underline-offset-2"
          >
            /auth
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
