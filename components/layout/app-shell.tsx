import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { MobileShell } from "./mobile-shell";

type AppShellProps = {
  user: { email?: string | null } | null;
  children: ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 px-6 flex items-center justify-between border-b border-gray-200 bg-white">
            <h1 className="text-xl font-semibold text-gray-900">Ergon Management</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="h-full px-6 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <MobileShell user={user}>{children}</MobileShell>
      </div>
    </>
  );
}


