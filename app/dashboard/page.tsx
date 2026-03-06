import { Suspense } from "react";
import { requireAuth } from "@/lib/auth";
import { DashboardMenu } from "./_components/dashboard-menu";
import { DashboardClient } from "./_components/dashboard-client";

async function DashboardContent() {
  const user = await requireAuth();
  return (
    <>
      <div className="flex justify-end p-4">
        <DashboardMenu />
      </div>
      <main className="min-h-screen flex flex-col items-center px-4 py-6">
        <div className="w-full max-w-6xl space-y-6">
          <header className="space-y-1">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-sm text-white/70">Welcome, {user.email}</p>
          </header>
          <DashboardClient />
        </div>
      </main>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading…</div>}>
      <DashboardContent />
    </Suspense>
  );
}