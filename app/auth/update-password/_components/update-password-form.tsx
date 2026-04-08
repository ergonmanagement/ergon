"use client";

import { useState } from "react";
import { FormField, FormError, FormSubmitButton } from "@/components/form";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { useUpdatePassword } from "@/hooks/use-update-password";

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const { updatePassword, isLoading, error } = useUpdatePassword();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePassword(password);
  };

  return (
    <div className="flex flex-col gap-6">
      <AppPageHeader
        title="Set a new password"
        variant="minimal"
        description="Please enter your new password below."
      />
      <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
        <FormField
          label="New password"
          id="password"
          type="password"
          placeholder="New password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FormError message={error} />
        <FormSubmitButton disabled={isLoading}>
          {isLoading ? "Saving..." : "Save new password"}
        </FormSubmitButton>
      </form>
    </div>
  );
}
