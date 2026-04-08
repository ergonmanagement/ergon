"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/schedule", label: "Schedule", icon: "📅" },
  { href: "/jobs", label: "Jobs", icon: "🔧" },
  { href: "/customers", label: "Customers", icon: "👥" },
  { href: "/marketing", label: "Marketing", icon: "📢" },
  { href: "/finance", label: "Finance", icon: "💰" },
  { href: "/profile", label: "Profile", icon: "👤" },
  { href: "/settings", label: "Account settings", icon: "⚙️" },
];

type MobileShellProps = {
  user: { email?: string | null } | null;
  children: ReactNode;
};

export function MobileShell({ user, children }: MobileShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-14 px-4 flex items-center justify-between border-b border-border bg-ergon-navy text-ergon-cream sticky top-0 z-50">
        <span className="text-base font-semibold tracking-tight">Ergon</span>
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="inline-flex items-center justify-center w-10 h-10 rounded-md border border-white/20 bg-white/5 text-ergon-cream hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ergon-primary"
          aria-label="Toggle menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </header>

      {isMenuOpen && (
        <div
          className="fixed inset-0 top-14 bg-black/40 z-40"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden
        />
      )}

      <nav
        className={`fixed top-14 left-0 w-72 max-w-[85vw] h-[calc(100vh-3.5rem)] bg-ergon-navy text-ergon-cream border-r border-white/10 transform transition-transform duration-200 ease-out z-50 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-white/10">
          <p className="text-xs text-ergon-cream/60 uppercase tracking-wide">
            Signed in
          </p>
          <p className="text-sm text-ergon-cream/90 truncate mt-1">{user?.email}</p>
        </div>

        <ul className="p-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/12 text-ergon-primary shadow-sm"
                      : "text-ergon-cream/85 hover:bg-white/5"
                  }`}
                >
                  <span className="text-lg" aria-hidden>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <main className="flex-1">
        <div className="h-full px-4 py-6 max-w-7xl mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
