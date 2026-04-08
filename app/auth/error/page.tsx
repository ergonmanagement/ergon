import { Suspense } from "react";
import { AppPageHeader } from "@/components/layout/app-page-header";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      {params?.error ? (
        <p className="text-sm text-muted-foreground">
          Code error: {params.error}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          An unspecified error occurred.
        </p>
      )}
    </>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted/40 p-6 md:p-10">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-4">
          <AppPageHeader
            title="Sorry, something went wrong."
            variant="minimal"
          />
          <Suspense>
            <ErrorContent searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
