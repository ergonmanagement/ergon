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
      <div className="hidden lg:flex min-h-screen bg-ergon-surface">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 shrink-0 px-6 flex items-center justify-between border-b border-border bg-card">
            <p className="text-sm font-medium text-muted-foreground">
              Ergon Management
            </p>
            <span className="text-sm text-muted-foreground truncate max-w-[50%]">
              {user?.email}
            </span>
          </header>
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="h-full px-6 py-8 max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>

      <div className="lg:hidden">
        <MobileShell user={user}>{children}</MobileShell>
      </div>
    </>
  );
}
