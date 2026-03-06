"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export function DirectFunctionTest() {
    const [results, setResults] = useState<any[]>([]);
    const [testing, setTesting] = useState(false);

    const runTests = async () => {
        setTesting(true);
        setResults([]);
        const testResults: any[] = [];

        try {
            const supabase = createClient();

            // Get the current session
            const { data: sessionData } = await supabase.auth.getSession();
            const session = sessionData.session;

            if (!session) {
                testResults.push({ test: "Session check", result: "❌ No active session" });
                setResults(testResults);
                setTesting(false);
                return;
            }

            testResults.push({ test: "Session check", result: "✅ Active session found" });

            // Get the access token
            const token = session.access_token;
            testResults.push({ test: "Token check", result: `✅ Token length: ${token.length}` });

            // Test each function with direct fetch
            const functions = ["dashboard", "schedule", "customers", "jobs", "finance", "marketing"];

            for (const funcName of functions) {
                try {
                    const response = await fetch(
                        `https://loyxmnbczhbovqllvwus.supabase.co/functions/v1/${funcName}`,
                        {
                            method: "GET",
                            headers: {
                                "Authorization": `Bearer ${token}`,
                                "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxveXhtbmJjemhib3ZxbGx2d3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3NTIyMTcsImV4cCI6MjA0OTMyODIxN30.BSvO_LJOsw7T1lL_Hv3DqCxEBXRRf3d3JG5hCgEGwvs",
                                "Content-Type": "application/json",
                                ...(funcName === "schedule" ? { "X-Ergon-Query": "from=2026-03-01&to=2026-03-07" } : {})
                            }
                        }
                    );

                    const status = response.status;
                    const responseText = await response.text();

                    testResults.push({
                        test: `${funcName} function`,
                        result: status === 200 ? "✅ Success" : `❌ ${status}: ${responseText.substring(0, 100)}`
                    });
                } catch (err) {
                    testResults.push({
                        test: `${funcName} function`,
                        result: `❌ Error: ${err instanceof Error ? err.message : String(err)}`
                    });
                }
            }

        } catch (err) {
            testResults.push({
                test: "Test setup",
                result: `❌ Error: ${err instanceof Error ? err.message : String(err)}`
            });
        }

        setResults(testResults);
        setTesting(false);
    };

    return (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-green-900 mb-2">Direct Function Test</h3>
            <p className="text-green-800 text-sm mb-3">
                Test all Edge Functions with direct fetch requests using your current session token.
            </p>

            <button
                onClick={runTests}
                disabled={testing}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-medium disabled:opacity-50"
            >
                {testing ? "Testing..." : "Run All Function Tests"}
            </button>

            {results.length > 0 && (
                <div className="mt-4 space-y-1">
                    {results.map((result, index) => (
                        <div key={index} className="text-sm">
                            <strong>{result.test}:</strong> {result.result}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
