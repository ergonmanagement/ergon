import { Suspense } from "react";
import { requireAuth } from "@/lib/auth";
import { DashboardClient } from "./_components/dashboard-client";

/**
 * Server Component that handles authentication and renders dashboard content
 * This component runs on the server and ensures user is authenticated before showing data
 */
async function DashboardContent() {
  // Server-side authentication check - redirects if not authenticated
  const user = await requireAuth();

  return (
    <div className="space-y-8">
      {/* Page Header with user greeting */}
      <div className="pb-5 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back, {user.email}
        </p>
      </div>

      {/* Main dashboard content - delegated to client component for interactivity */}
      <DashboardClient />
    </div>
  );
}

/**
 * Main Dashboard Page Component
 * Uses Suspense to handle loading state while server component resolves
 * This pattern allows for better user experience during authentication checks
 */
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