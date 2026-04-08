/**
 * Onboarding field options aligned with docs/highLevelDesign.md §4.4
 * (required vs optional) and docs/lowLevelDesign.md §4.1 companies columns.
 */

export const SERVICE_TYPE_OPTIONS = [
  { value: "Auto detailing", label: "Auto detailing" },
  { value: "Window washing", label: "Window washing" },
  { value: "Landscaping", label: "Landscaping" },
  { value: "HVAC", label: "HVAC" },
  { value: "Cleaning", label: "Cleaning" },
  { value: "__other__", label: "Other (specify below)" },
] as const;

/** Maps select value → representative integer for companies.employees_count */
export const EMPLOYEES_OPTIONS: { value: string; label: string; count: number | null }[] = [
  { value: "__none__", label: "Prefer not to say", count: null },
  { value: "1-4", label: "1–4", count: 2 },
  { value: "5-9", label: "5–9", count: 7 },
  { value: "10-24", label: "10–24", count: 17 },
  { value: "25-49", label: "25–49", count: 37 },
  { value: "50+", label: "50+", count: 75 },
];

/** Maps select → companies.years_in_business (approximate) */
export const YEARS_OPTIONS: { value: string; label: string; years: number | null }[] = [
  { value: "__none__", label: "Prefer not to say", years: null },
  { value: "lt1", label: "Less than 1 year", years: 0 },
  { value: "1-2", label: "1–2 years", years: 2 },
  { value: "3-5", label: "3–5 years", years: 4 },
  { value: "6-10", label: "6–10 years", years: 8 },
  { value: "10+", label: "10+ years", years: 15 },
];

/** Maps select → companies.estimated_revenue (USD, approximate annual) */
export const REVENUE_OPTIONS: { value: string; label: string; amount: number | null }[] = [
  { value: "__none__", label: "Prefer not to say", amount: null },
  { value: "under50k", label: "Under $50,000", amount: 25_000 },
  { value: "50k-150k", label: "$50,000 – $150,000", amount: 100_000 },
  { value: "150k-500k", label: "$150,000 – $500,000", amount: 325_000 },
  { value: "500k-1m", label: "$500,000 – $1,000,000", amount: 750_000 },
  { value: "1mplus", label: "Over $1,000,000", amount: 1_500_000 },
];

export const REFERRAL_OPTIONS = [
  { value: "__none__", label: "Prefer not to say" },
  { value: "Google search", label: "Google search" },
  { value: "Social media", label: "Social media" },
  { value: "Friend or colleague", label: "Friend or colleague" },
  { value: "Trade show or event", label: "Trade show or event" },
  { value: "Online advertisement", label: "Online advertisement" },
  { value: "Other", label: "Other" },
] as const;
