import { Suspense } from "react";
import { requireAuth } from "@/lib/auth";
import { DashboardClient } from "./_components/dashboard-client";

async function DashboardContent() {
  const user = await requireAuth();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pb-5 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back, {user.email}
        </p>
      </div>

      {/* Dashboard Content */}
      <DashboardClient />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}