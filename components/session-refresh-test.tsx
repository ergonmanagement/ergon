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
          
          // Now test an Edge Function call
          const { data: funcData, error: funcError } = await supabase.functions.invoke("dashboard");
          console.log("Function test after refresh:", { funcData, funcError });
          
          if (funcError) {
            setStatus(`✅ Session OK, but function failed: ${funcError.message}`);
          } else {
            setStatus("✅ Everything working!");
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
