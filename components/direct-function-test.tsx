"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

type TestResult = {
    test: string;
    result: string;
};

export function DirectFunctionTest() {
    const [results, setResults] = useState<TestResult[]>([]);
    const [testing, setTesting] = useState(false);

    const runTests = async () => {
        setTesting(true);
        setResults([]);
        const testResults: TestResult[] = [];

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

            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
            const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            const apiKey = publishableKey ?? anonKey;

            if (!supabaseUrl || !apiKey) {
                testResults.push({
                    test: "Config check",
                    result: "❌ Missing NEXT_PUBLIC_SUPABASE_URL or API key env",
                });
                setResults(testResults);
                setTesting(false);
                return;
            }

            const tokenParts = token.split(".");
            const payloadPart = tokenParts.length > 1 ? tokenParts[1] : "";
            const decodedPayload = payloadPart
                ? JSON.parse(atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/")))
                : null;
            const tokenIssuer = decodedPayload?.iss as string | undefined;
            const issuerRef = tokenIssuer?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
            const urlRef = new URL(supabaseUrl).hostname.split(".")[0];
            if (issuerRef && issuerRef !== urlRef) {
                testResults.push({
                    test: "Issuer check",
                    result: `❌ Token issuer ref (${issuerRef}) does not match URL ref (${urlRef})`,
                });
            } else if (issuerRef) {
                testResults.push({
                    test: "Issuer check",
                    result: `✅ Token issuer ref matches URL ref (${urlRef})`,
                });
            }

            // Test each function with direct fetch
            const functions = ["dashboard", "schedule", "customers", "jobs", "finance", "marketing"];

            const now = new Date();
            const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
            const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
            const financeQuery = new URLSearchParams({
                from: monthStart.toISOString().slice(0, 10),
                to: monthEnd.toISOString().slice(0, 10),
            }).toString();

            for (const funcName of functions) {
                try {
                    const response = await fetch(
                        `${supabaseUrl}/functions/v1/${funcName}`,
                        {
                            method: "GET",
                            headers: {
                                "Authorization": `Bearer ${token}`,
                                "apikey": apiKey,
                                "Content-Type": "application/json",
                                ...(funcName === "schedule" ? { "X-Ergon-Query": "from=2026-03-01&to=2026-03-07" } : {}),
                                ...(funcName === "finance" ? { "X-Ergon-Query": financeQuery } : {})
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
