# Docs (Read First)

Cursor (and developers) must read these before implementing anything:

1) `highLevelDesign.md`
2) `lowLevelDesign.md`

If there is any conflict, the Low-Level Design wins.

Key non-negotiables:
- Multi-tenant SaaS (company isolation)
- RLS mandatory (never rely on frontend filtering)
- Supabase Auth only
- Supabase Edge Functions for backend logic
- AI ONLY in Marketing via LangGraph
- Stripe isolated to Billing endpoints
- Responsive professional UI (desktop sidebar, mobile hamburger drawer)
- Repo structure contract must be followed (do not invent new structure)
- No secrets in client code (service role key, OpenAI key, Stripe secrets)
- Edge Functions must document request/response JSON schemas
- Job photos supported via private storage + signed upload URLs (Edge Function controlled)
- API is client-agnostic (web now, mobile app later)
- Lots of comments in core logic
- Lots of tests for every part of the system. Run consistently
