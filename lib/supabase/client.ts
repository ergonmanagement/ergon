import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in browser/client-side code
 * Includes automatic token refresh and retry logic for Edge Functions
 * 
 * Features:
 * - Automatic session token refresh before expiry
 * - Retry logic for 401 errors (unauthorized)
 * - Proper header management for Edge Function calls
 */
export function createClient() {
  // Get Supabase configuration from environment variables
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Validate required environment variables
  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).",
    );
  }

  // Create the base Supabase browser client
  const supabase = createBrowserClient(
    url,
    key,
  );

  // Store original invoke method to wrap it with our enhanced logic
  const originalInvoke = supabase.functions.invoke.bind(supabase.functions);

  /**
   * Enhanced Edge Function invoke method with automatic token refresh
   * Handles token expiry and 401 retry logic to ensure reliable function calls
   */
  supabase.functions.invoke = async (functionName, options) => {
    /**
     * Build request options with fresh authentication headers
     * Proactively refreshes tokens that are close to expiry
     */
    const buildOptions = async () => {
      // Get current session to check token validity
      const {
        data: { session },
      } = await supabase.auth.getSession();

      let accessToken = session?.access_token ?? null;
      const expiresAt = session?.expires_at ?? 0;

      // Proactively refresh tokens that expire within 1 minute
      // This prevents 401 errors from expired tokens during function execution
      if (accessToken && expiresAt * 1000 <= Date.now() + 60_000) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        accessToken = refreshed.session?.access_token ?? accessToken;
      }

      // Build headers with API key and authorization
      const headers = new Headers(options?.headers as HeadersInit | undefined);
      headers.set("apikey", key); // Required for all Supabase requests
      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`); // User authentication
      }

      return {
        ...(options ?? {}),
        headers: Object.fromEntries(headers.entries()),
      };
    };

    // First attempt with current/refreshed token
    const firstAttempt = await originalInvoke(functionName, await buildOptions());

    // Check if we got a 401 Unauthorized error
    const status = (firstAttempt.error as { context?: { status?: number } } | null)
      ?.context?.status;
    if (status !== 401) {
      return firstAttempt; // Return successful result or non-401 error
    }

    // Retry once after forcing a session refresh
    // This handles cases where the local session is stale
    await supabase.auth.refreshSession();
    return originalInvoke(functionName, await buildOptions());
  };

  return supabase;
}
