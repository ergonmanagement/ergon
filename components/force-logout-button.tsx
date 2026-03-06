"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export function ForceLogoutButton() {
    const [status, setStatus] = useState("");

    const handleLogout = async () => {
        setStatus("Logging out...");

        try {
            const supabase = createClient();

            // Sign out the user
            const { error } = await supabase.auth.signOut();

            if (error) {
                setStatus(`Error: ${error.message}`);
            } else {
                setStatus("Logged out successfully - redirecting...");
                // Force a page reload to clear all state
                window.location.href = "/auth/login";
            }
        } catch (err) {
            setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    return (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Session Reset</h3>
            <p className="text-yellow-800 text-sm mb-3">
                If authentication is failing, try logging out and back in to reset your session.
            </p>
            <button
                onClick={handleLogout}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 text-sm font-medium"
            >
                Logout & Reset Session
            </button>
            {status && <p className="mt-2 text-sm text-yellow-800">{status}</p>}
        </div>
    );
}
