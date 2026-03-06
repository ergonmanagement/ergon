"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function SessionRefreshTest() {
    const [status, setStatus] = useState("Testing...");

    useEffect(() => {
        const testSession = async () => {
            const supabase = createClient();

            try {
                // Force a session refresh
                const { data, error } = await supabase.auth.refreshSession();
                console.log("Session refresh result:", { data, error });

                if (error) {
                    setStatus(`❌ Refresh failed: ${error.message}`);
                    return;
                }

                if (data.session) {
                    setStatus("✅ Session refreshed successfully");

                    // Test dashboard function
                    const { data: dashData, error: dashError } = await supabase.functions.invoke("dashboard");
                    console.log("Dashboard test:", { dashData, dashError });

                    // Test schedule function with the same params as the hook
                    const params = new URLSearchParams();
                    const now = new Date();
                    const weekStart = new Date(now);
                    weekStart.setDate(now.getDate() - now.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    
                    params.set("from", weekStart.toISOString());
                    params.set("to", weekEnd.toISOString());

                    const { data: schedData, error: schedError } = await supabase.functions.invoke("schedule", {
                        method: "GET",
                        headers: {
                            "X-Ergon-Query": params.toString(),
                        },
                    });
                    console.log("Schedule test with X-Ergon-Query:", { schedData, schedError });

                    if (dashError) {
                        setStatus(`❌ Dashboard failed: ${dashError.message}`);
                    } else if (schedError) {
                        setStatus(`✅ Dashboard OK, but Schedule failed: ${schedError.message}`);
                    } else {
                        setStatus("✅ Both Dashboard and Schedule working!");
                    }
                } else {
                    setStatus("❌ No session after refresh - need to login");
                }

            } catch (err) {
                console.error("Session test error:", err);
                setStatus(`❌ Test failed: ${err instanceof Error ? err.message : String(err)}`);
            }
        };

        testSession();
    }, []);

    return (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">Session Refresh Test</h3>
            <div className="text-blue-800">{status}</div>
        </div>
    );
}
