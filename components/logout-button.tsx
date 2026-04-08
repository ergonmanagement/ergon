"use client";

import { useLogout } from "@/hooks/use-logout";

export function LogoutButton() {
  const { logout } = useLogout();

  return (
    <button
      onClick={logout}
      className="rounded-md border border-white/25 px-3 py-1.5 text-sm text-ergon-cream/90 hover:bg-white/10 transition-colors"
    >
      Logout
    </button>
  );
}
