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
      <div className="hidden md:flex min-h-svh bg-[#131B41] text-[#FFFFF6]">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 px-4 flex items-center justify-end border-b border-white/10">
            <span className="text-sm text-white/80">{user?.email}</span>
          </header>
          <main className="flex-1 overflow-y-auto px-4 py-6 bg-[#131B41]">
            <div className="max-w-6xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
      <MobileShell>{children}</MobileShell>
    </>
  );
}


