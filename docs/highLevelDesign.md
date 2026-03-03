# 📘 Ergon Management 
## High-Level Product & System Specification (v1.1)

---

# 1. Product Overview

## 1.1 Vision

Ergon Management is a multi-tenant SaaS platform designed to help small service-based businesses:

- Organize their operations
- Track revenue and expenses
- Manage jobs and customers
- Schedule work
- Generate marketing content

Core promise:

> One place to organize your business and grow it.

The system prioritizes:
- Simplicity
- Speed
- Professional presentation
- Clear workflows
- Minimal cognitive load

This product is intentionally focused and avoids unnecessary complexity.

---

## 1.2 Target Users

Primary focus:
- Auto detailing businesses
- Window washing businesses

Future expansion:
- Other local service businesses (HVAC, landscaping, cleaning, etc.)

---

# 2. Product Model

## 2.1 SaaS Multi-Tenant Architecture

This application is a multi-tenant SaaS product.

- Each company has its own isolated dataset.
- Users belong to exactly one company in v1.
- Company data must be fully isolated at the database level.
- No cross-company access is allowed.

Security and isolation are core product principles.

---

## 2.2 Subscription Model

Each company has a subscription status:

- Trial
- Active
- Canceled

Trial includes full feature access for a limited time.

If subscription expires:
- Access to authenticated pages may be restricted (exact enforcement defined in Low-Level Design).
- Company data remains stored.

Stripe manages billing.

---

# 3. Technology Overview (Product-Level)

The following technologies are foundational to the product:

Frontend:
- Next.js (App Router)
- Responsive UI design

Backend:
- Supabase Edge Functions

Database:
- Supabase Postgres

Authentication:
- Supabase Auth (email/password only in v1)

Storage:
- Supabase Storage (private buckets)

Billing:
- Stripe

AI (Marketing Module Only):
- OpenAI API
- LangGraph orchestration

AI is strictly limited to the Marketing module.

No AI is used in:
- Finance calculations
- Scheduling
- Job management
- Dashboard analytics

## Future Mobile App Direction (Post-v1)

v1 is a responsive web application optimized for desktop and mobile browsers.

A future version may add a dedicated mobile application (iOS/Android).  
To support this, backend APIs must be designed as client-agnostic services:

- Core business logic and validation live in Supabase Edge Functions.
- Edge Functions expose stable JSON contracts that any client can call.
- The web UI should not be the only place rules are enforced.

---

# 4. Public Website (Unauthenticated)

## 4.1 Main Landing Page

### Purpose
Convert visitors into trial users.

### Required Elements

- Company logo
- Short slogan
- Clear description of value
- Strong “Start Free Trial – No Credit Card Required” button
- Smaller link to pricing
- Login button

### Behavior

- Trial button → onboarding flow
- Pricing → pricing page
- Login → sign in page

Design must:
- Look professional
- Feel modern
- Work on desktop and mobile

---

## 4.2 Pricing Page

### Layout

- Single pricing tier (v1)
- Feature list
- Subscribe button

### Behavior

- Initiates Stripe checkout session
- Subscription state stored on company record

---

## 4.3 Sign In Page

### Layout

- Email
- Password
- Login button

### Behavior

- Authenticates via Supabase Auth
- Redirects to Dashboard

Passwords are never stored directly in application tables.

---

## 4.4 Onboarding Page

### Required Fields

- Email
- Password
- Company name
- Service type
- Phone Number

### Optional Fields

- Address
- Number of employees
- Years in business
- Estimated revenue
- Referral source

### Behavior

- Creates company
- Creates owner user
- Starts trial
- Redirects to Dashboard

---

# 5. Authenticated Application Layout

All authenticated pages must use a shared layout shell.

## 5.1 Sidebar Navigation (Required)

Left sidebar contains:

- Logo
- Dashboard
- Schedule
- Jobs
- Customers
- Marketing
- Finance
- Account Settings

Active page is visually highlighted.

---

## 5.2 Responsive Design Contract

Desktop:
- Sidebar always visible.

Mobile:
- Sidebar hidden by default.
- Hamburger icon opens slide-over menu.
- No horizontal scrolling allowed.
- Tables collapse into vertical card layout.
- Forms stack vertically.

All pages must:
- Appear professional.
- Maintain consistent spacing and typography.
- Adjust cleanly to screen size changes.

---

# 6. Dashboard

## Purpose

Provide a high-level overview of business activity.

## Sections

- Today’s Schedule
- Upcoming Jobs
- New Prospects
- Finance Summary (Revenue / Expenses / Net)
- Marketing Reminders

## Behavior

- Each section links to relevant module.
- Finance summary auto-calculates.
- No AI used here.

Dashboard uses filtering logic only.

---

# 7. Jobs Module

## 7.1 Jobs List Page

### Features

- Add Job button
- Filters (Upcoming, Past, All)
- Sortable columns:
  - Customer Name
  - Address
  - Date Scheduled
  - Date Created
  - Status

### Behavior

- Clicking job opens edit view.
- Creating job with new name auto-creates customer.

---

## 7.2 Job Status Lifecycle

- Lead
- Scheduled
- Completed
- Paid

Status progression reflects real-world workflow.

---

# 8. Customers Module

## Features

- Add Customer button
- Search
- Filter (Customer / Prospect)
- Sortable columns

Customer profile includes:

- Contact info
- Notes
- Job history
- Revenue total

---

# 9. Schedule Module

## Views

- Week view
- Month view

Users can create:

- Job
- Event
- Task

Jobs created in Schedule are true Job records.

Schedule is not a separate data source.

---

# 10. Finance Module (Lightweight Tracking)

Not full accounting.

## Top Summary

- Revenue
- Expenses
- Net Income

Time filters:

- Week
- Month
- Year

## Entry Types

- Revenue
- Expense

Each entry may link to a Job.

Totals are auto-calculated.

No AI involved.

---

# 11. Marketing Module (AI Only Section)

This is the only AI-powered module.

## Content Types

- Social Post
- Email
- SMS
- Flyer

## Flow

1. User selects type.
2. Optional context provided.
3. AI generates content.
4. Content is saved to history.
5. User can copy or regenerate.

No automatic posting in v1.

AI responsibilities:
- Generate marketing copy only.

All validation and company logic occur outside AI.

---

# 12. Account Settings

Includes:

- Company info editing
- Subscription info
- Change password
- Sign out

---

# 13. MVP Scope (Strict)

Must include:

- Supabase Auth
- Multi-tenant isolation
- Dashboard
- Jobs
- Customers
- Schedule
- Finance tracking
- Marketing AI
- Stripe subscription integration

Must NOT include:

- Payroll
- Taxes
- Bank sync
- Inventory automation
- Complex permissions
- Social media integrations
- Auto-post scheduling

---

# 14. Design System Specification (v1)

This design system defines the visual language of the platform.  
The goal is to create a product that feels:

- Professional
- Calm
- Stable
- Clean
- Purpose-built for serious business use

This is an operating system for service companies — clarity and consistency are more important than trendiness.

---

# 1. Color System

## Brand Colors

- **Primary Color:** `#86BBD8`
- **Secondary Color:** `#444444`
- **Accent Color:** `#86B380`
- **Background Color:** `#131B41`
- **Text Color:** `#FFFFF6`

### Usage Rules

- Primary color is used for:
  - Primary buttons
  - Active states
  - Focus states
  - Key links

- Secondary color is used for:
  - Secondary buttons
  - Subheadings
  - Neutral UI elements

- Accent color is used for:
  - Highlights
  - Special indicators
  - AI suggestions
  - Positive emphasis (non-semantic)

- Background color is the base layout background.
- Text color is used on dark backgrounds for readability.

---

## Semantic Colors

These colors communicate meaning and must only be used semantically.

- **Success:** `#4CAF50`
- **Warning:** `#F4A261`
- **Error:** `#E63946`
- **Info:** `#5DA9E9`

### Semantic Usage

- Success:
  - Completed jobs
  - Paid invoices
  - Successful actions

- Warning:
  - Overdue tasks
  - Low inventory
  - Upcoming deadlines

- Error:
  - Failed payments
  - Validation errors
  - Destructive actions

- Info:
  - AI suggestions
  - Neutral alerts

Semantic colors must never be used decoratively.

---

# 2. Typography System

## Font Philosophy

- One primary font family only.
- Clean, modern, highly readable.
- Avoid excessive weights.

Recommended:
- Inter
- Geist
- System UI stack

---

## Typography Scale

| Style        | Use Case |
|-------------|----------|
| H1          | Page titles (Dashboard, Jobs, Marketing) |
| H2          | Section headers |
| H3          | Card headers |
| Body Large  | Important metrics / summaries |
| Body        | Standard text |
| Small       | Labels / metadata |
| Caption     | Secondary or muted info |

### Hierarchy Rules

- Clear vertical rhythm.
- No arbitrary font sizes.
- Maintain consistent spacing between headings and content.

---

# 3. Spacing System

The system uses a **4px base unit scale**.

## Spacing Scale

- 4px
- 8px
- 12px
- 16px
- 24px
- 32px
- 48px

### Rules

- Never use random spacing values.
- All padding and margins must follow this scale.
- Cards must have consistent internal padding.
- Sections must maintain consistent vertical spacing.

Consistency in spacing increases perceived quality.

---

# 4. Button System

Buttons must be consistent across the entire application.

## Button Variants

### Primary Button
- Background: Primary color
- Text: High contrast (light)
- Used for main action on page
- Hover: Slight darken
- Focus: Clear outline

Examples:
- Create Job
- Send Invoice
- Generate Marketing Content

---

### Secondary Button
- Outline or muted background
- Used for alternative actions

---

### Ghost Button
- Minimal styling
- Used for low-priority actions

---

### Danger Button
- Background: Error color
- Used only for destructive actions

Examples:
- Delete
- Cancel Invoice
- Remove User

---

## Button Shape

- Medium border radius
- Not pill-shaped
- Not sharp-cornered
- Consistent across all buttons

---

# 5. Card System

Cards are a primary layout structure.

Used for:
- Dashboard widgets
- Jobs
- Customers
- Finance summaries
- Marketing drafts

## Card Design Rules

- Soft background
- Subtle border or low shadow
- Consistent padding (16px–24px)
- Clear header + body structure
- No decorative gradients

Cards should feel structured and professional.

---

# 6. Border Radius

Use a consistent radius scale.

## Radius Scale

- Small: Inputs, badges
- Medium: Buttons, cards
- Large: Modals

Do not mix arbitrary rounding values.

Consistency is critical for polish.

---

# 7. Shadow System

Shadows communicate elevation — not decoration.

## Elevation Levels

| Level | Usage |
|-------|--------|
| None  | Flat sections |
| Low   | Cards |
| Medium| Dropdowns / Popovers |
| High  | Modals |

### Shadow Rules

- Subtle and soft
- No dramatic floating UI
- Prefer minimalism over depth-heavy styling

---

# 8. Core Design Principle

> This is a professional business operating system.

The UI must communicate:

- Reliability
- Structure
- Clarity
- Stability

Avoid:
- Over-design
- Trendy gradients
- Excess animations
- Flashy UI effects

The design should help users focus on running their business.

Design must communicate professionalism and trust.