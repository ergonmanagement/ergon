import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).",
    );
  }

  const supabase = createBrowserClient(
    url,
    key,
  );

  const originalInvoke = supabase.functions.invoke.bind(supabase.functions);
  supabase.functions.invoke = async (functionName, options) => {
    const buildOptions = async () => {
      // Keep function calls tied to the latest user token.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      let accessToken = session?.access_token ?? null;
      const expiresAt = session?.expires_at ?? 0;

      // Proactively refresh near-expiry tokens to avoid gateway 401s.
      if (accessToken && expiresAt * 1000 <= Date.now() + 60_000) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        accessToken = refreshed.session?.access_token ?? accessToken;
      }

      const headers = new Headers(options?.headers as HeadersInit | undefined);
      headers.set("apikey", key);
      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }

      return {
        ...(options ?? {}),
        headers: Object.fromEntries(headers.entries()),
      };
    };

    const firstAttempt = await originalInvoke(functionName, await buildOptions());

    const status = (firstAttempt.error as { context?: { status?: number } } | null)
      ?.context?.status;
    if (status !== 401) {
      return firstAttempt;
    }

    // Retry once after forcing a refresh for stale local sessions.
    await supabase.auth.refreshSession();
    return originalInvoke(functionName, await buildOptions());
  };

  return supabase;
}
