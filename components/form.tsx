"use client";

import type { InputHTMLAttributes } from "react";

const inputClassName =
  "border rounded px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400";

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
          <label htmlFor={id}>{label}</label>
          {labelAside}
        </div>
      ) : (
        <label htmlFor={id}>{label}</label>
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
  return <p className="text-sm text-red-500">{content}</p>;
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
        "bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
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
