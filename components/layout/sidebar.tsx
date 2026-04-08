"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLogout } from "@/hooks/use-logout";

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

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useLogout();

  return (
    <aside className="w-64 shrink-0 bg-ergon-navy text-ergon-cream flex flex-col border-r border-white/10">
      <div className="h-14 flex items-center px-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md bg-ergon-primary flex items-center justify-center">
            <span className="text-ergon-navy font-bold text-sm">E</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">Ergon</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/12 text-ergon-primary shadow-sm"
                      : "text-ergon-cream/85 hover:bg-white/5 hover:text-ergon-cream"
                  }`}
                >
                  <span className="text-base opacity-90" aria-hidden>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ergon-cream/75 hover:text-ergon-cream hover:bg-white/5 rounded-md transition-colors"
        >
          <span aria-hidden>🚪</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
