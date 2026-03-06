"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function AuthDebugger() {
    const [authState, setAuthState] = useState<any>(null);
    const [testResult, setTestResult] = useState<any>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient();

            // Check current session
            const { data: session } = await supabase.auth.getSession();
            console.log("Session data:", session);

            // Check user
            const { data: user, error: userError } = await supabase.auth.getUser();
            console.log("User data:", user, "Error:", userError);

            // Get the actual token being used
            const token = session.session?.access_token;
            console.log("Access token (first 50 chars):", token?.substring(0, 50));
            console.log("Token expires at:", session.session?.expires_at ? new Date(session.session.expires_at * 1000) : "No expiry");
            console.log("Current time:", new Date());

            setAuthState({
                session: session.session,
                user: user.user,
                userError: userError?.message,
                tokenPreview: token?.substring(0, 50) + "...",
                tokenExpires: session.session?.expires_at ? new Date(session.session.expires_at * 1000) : null,
                isExpired: session.session?.expires_at ? Date.now() > (session.session.expires_at * 1000) : false
            });

            // Test a simple Edge Function call
            if (session.session) {
                try {
                    const { data, error } = await supabase.functions.invoke("dashboard", {
                        method: "GET"
                    });
                    console.log("Dashboard test:", { data, error });
                    setTestResult({ data, error: error?.message });
                } catch (err) {
                    console.log("Dashboard test error:", err);
                    setTestResult({ error: err instanceof Error ? err.message : String(err) });
                }
            }
        };

        checkAuth();
    }, []);

    if (!authState) return <div>Checking auth...</div>;

    return (
        <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="font-bold mb-2">Auth Debug Info</h3>
            <div className="space-y-2 text-sm">
                <div>
                    <strong>Session exists:</strong> {authState.session ? "✅ Yes" : "❌ No"}
                </div>
                {authState.session && (
                    <>
                        <div>
                            <strong>User ID:</strong> {authState.user?.id}
                        </div>
                        <div>
                            <strong>Email:</strong> {authState.user?.email}
                        </div>
                        <div>
                            <strong>Token expires:</strong> {authState.tokenExpires?.toLocaleString()}
                        </div>
                        <div>
                            <strong>Token expired:</strong> {authState.isExpired ? "⚠️ YES" : "✅ No"}
                        </div>
                        <div>
                            <strong>Token preview:</strong> <code className="text-xs">{authState.tokenPreview}</code>
                        </div>
                    </>
                )}
                {authState.userError && (
                    <div className="text-red-600">
                        <strong>User Error:</strong> {authState.userError}
                    </div>
                )}

                {testResult && (
                    <div className="mt-4 pt-2 border-t">
                        <strong>Dashboard Function Test:</strong>
                        {testResult.error ? (
                            <div className="text-red-600">❌ {testResult.error}</div>
                        ) : (
                            <div className="text-green-600">✅ Success</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
