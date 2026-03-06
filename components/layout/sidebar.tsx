"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/schedule", label: "Schedule" },
  { href: "/jobs", label: "Jobs" },
  { href: "/customers", label: "Customers" },
  { href: "/marketing", label: "Marketing" },
  { href: "/finance", label: "Finance" },
  { href: "/settings", label: "Account Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-60 border-r border-white/10 bg-[#0E1530]">
      <div className="h-14 flex items-center px-4 border-b border-white/10">
        <span className="font-semibold text-sm">Ergon Management</span>
      </div>
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                    active
                      ? "bg-[#86BBD8]/20 text-[#86BBD8]"
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

