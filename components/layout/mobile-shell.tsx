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
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

type MobileShellProps = {
  user: { email?: string | null } | null;
  children: ReactNode;
};

export function MobileShell({ user, children }: MobileShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Mobile Header */}
      <header className="h-16 px-4 flex items-center justify-between border-b border-gray-200 bg-white sticky top-0 z-50">
        <h1 className="text-lg font-semibold text-gray-900">Ergon</h1>
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Toggle menu"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <nav className={`fixed top-16 left-0 w-64 h-full bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-50 ${
        isMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 border-b border-gray-200">
          <p className="text-sm text-gray-600">{user?.email}</p>
        </div>
        
        <ul className="p-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        <div className="h-full px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
