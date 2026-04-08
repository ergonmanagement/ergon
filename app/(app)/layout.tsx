import type { ReactNode } from "react";
import { Suspense } from "react";
import { requireAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

async function AppLayoutContent({ children }: { children: ReactNode }) {
  const user = await requireAuth();
  return <AppShell user={user}>{children}</AppShell>;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground text-sm">
          Loading…
        </div>
      }
    >
      <AppLayoutContent>{children}</AppLayoutContent>
    </Suspense>
  );
}

