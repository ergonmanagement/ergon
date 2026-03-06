import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/schedule", label: "Schedule" },
  { href: "/jobs", label: "Jobs" },
  { href: "/customers", label: "Customers" },
  { href: "/marketing", label: "Marketing" },
  { href: "/finance", label: "Finance" },
  { href: "/settings", label: "Account Settings" },
];

type MobileShellProps = {
  children: ReactNode;
};

export function MobileShell({ children }: MobileShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden min-h-svh flex flex-col bg-[#131B41] text-[#FFFFF6] overflow-x-hidden">
      <header className="h-14 px-4 flex items-center justify-between border-b border-white/10">
        <span className="font-semibold text-sm">Ergon</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-md border border-white/20 px-2 py-1 text-xs"
        >
          Menu
        </button>
      </header>

      {open && (
        <nav className="border-b border-white/10 bg-[#0E1530]">
          <ul className="flex flex-col px-2 py-2">
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block px-3 py-2 rounded-md text-sm ${
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
      )}

      <main className="flex-1 overflow-y-auto px-4 py-4">{children}</main>
    </div>
  );
}

