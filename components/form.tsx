"use client";

import type { InputHTMLAttributes } from "react";

const inputClassName =
  "border border-input rounded-md px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
  labelAside?: React.ReactNode;
};

export function FormField({
  label,
  id,
  labelAside,
  className,
  ...inputProps
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      {labelAside ? (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="text-sm font-medium text-gray-900">
            {label}
          </label>
          {labelAside}
        </div>
      ) : (
        <label htmlFor={id} className="text-sm font-medium text-gray-900">
          {label}
        </label>
      )}
      <input
        id={id}
        className={className ?? inputClassName}
        {...inputProps}
      />
    </div>
  );
}

export function FormError({
  message,
  children,
}: {
  message?: string | null;
  children?: React.ReactNode;
}) {
  const content = message ?? children;
  if (!content) return null;
  return <p className="text-sm text-destructive">{content}</p>;
}

export function FormSubmitButton({
  disabled,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={
        className ??
        "rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
      }
      {...props}
    >
      {children}
    </button>
  );
}

export function FormDisplayField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-600">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
