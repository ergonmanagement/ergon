import { ForgotPasswordForm } from "./_components/forgot-password-form";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted/40 p-6 md:p-10">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
