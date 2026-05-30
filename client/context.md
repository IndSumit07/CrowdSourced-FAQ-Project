# QueryCare Client Context

This document provides a highly compact, comprehensive overview of the `client` codebase for QueryCare, a premium crowdsourced FAQ web application. Use this context file to understand the architecture, design tokens, and components without needing to traverse every file, thereby saving tokens.

---

## 🛠️ Tech Stack & Configuration
- **Core Framework:** React 19 (ESM, `.jsx` extension)
- **Build Tool:** Vite v8
- **Styling:** Tailwind CSS v4 + PostCSS + Autoprefixer
- **Routing/State:** React Router + Zustand store (`authStore`, `feedStore`, `notificationStore`).
- **Data Fetching:** TanStack Query with a shared singleton `queryClient` in `src/lib/queryClient.js`.

---

## 🎨 Design System & Visual Aesthetics
The client uses a premium SaaS aesthetic with soft neutrals, teal accents, and clean spacing. Typography is split by surface:
- **Homepage:** Sora (`font-home`, `font-home-display`)
- **Dashboard:** Space Grotesk (`font-dashboard`)
- **Default body:** Inter (`font-sans`)

### Color Palette (HSL & Hex)
- **Primary Accent (Teal):** `#0D9488` / `#0F766E`
- **Neutral Surface:** `#f8f7f4`, `slate-50`, `stone-100`
- **Dark Neutral (Typography/Borders):** `slate-900`, `stone-900`

### Key Micro-Animations (`src/index.css`)
- `@keyframes shimmer`: Skeleton loading gradient
- `@keyframes fadeIn`: Subtle content reveal
- `@keyframes pulse-dot`: Live status indicator

---

## 📁 Directory Structure
```text
client/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── layout/         # High-level layouts (Header, Navigation)
│   │   ├── sections/       # Distinct sections composing the HomePage
│   │   └── ui/             # Highly reusable primitives (Buttons, Inputs)
│   ├── contexts/           # Global context definitions (currently empty)
│   ├── pages/              # Routable page-level elements
│   ├── App.jsx             # React entry wrapper
│   ├── index.css           # Global style setups & custom animation setups
│   └── main.jsx            # DOM bootstrapping
├── package.json            # Scripts and dependencies
└── vite.config.js          # Vite config using @vitejs/plugin-react
```

---

## 🧩 Component Breakdown

### 1. Page Composers
- **`src/pages/HomePage.jsx`:** SaaS-style homepage with Sora font, soft neutral background, and capsule header.
- **`src/App.jsx`:** App entry and router wrapper.

### 2. Layouts (`src/components/layout/`)
- **`SiteHeader.jsx`:
  - **Type:** Fixed capsule navbar centered at the top.
  - **Aesthetics:** Glassmorphism with rounded-full shell.
  - **Contents:** Brand, mid nav links (Home/Values/FAQs), right auth actions.
- **`DashboardLayout.jsx`:
  - **Type:** Fixed full-width top bar + fixed left sidebar.
  - **Behavior:** Shows a live socket badge in the center only when connected.
  - **Extras:** "Home" button on top bar; sidebar shows numeric reputation only (no progress bar).
- **`App.jsx`:
  - Wraps the app in the shared TanStack Query client and initializes sockets once on mount.

### 3. Page Sections (`src/components/sections/`)
- **`HeroSection.jsx`:
  - **Visuals:** Soft blob gradients, centered copy, capsule CTAs.
  - **Typography:** Sora display headings.
  - **CTAs:** Rounded-full primary and secondary actions.
- **`BottomSection.jsx`:** Premium 3-column layout, now aligned to the SaaS palette and anchors `#values`.
  - **Left Column:**
    - *Trust Profile Card:* Exposes consensus metrics (99.4% Consensus Score badge, 45 seconds average response time badge, and list of `10,480+` expert curators complete with layered user avatars).
    - *Cross-Platform FAQs Card:* Visual integration panel referencing Reddit, Behance, and Google APIs.
  - **Center Column:**
    - *QAPreviewCard:* A high-fidelity animated card highlighting a query ("How does the consensus engine filter out incorrect FAQ answers?") and its top community-voted answer, complete with an author block, upvote stats (+284), and consensus percentages.
  - **Right Column:**
    - *Values Checklist:* Highlighting system guarantees (Consensus Audited, Ultra-Fast Speed, Spam-Free Archive) using checkmark bullet lines.
    - *Action:* CTA button `Explore the FAQ Database` featuring a nested downward arrow indicator.
- **`FeaturesSection.jsx` (Unused in Home):** Contains card mappings for core features: "Warm knowledge base", "Story-first responses", and "Calm escalation".
- **`CtaSection.jsx` (Unused in Home):** Reusable block displaying gradient overlays with a "Provide the best material with passion" tag and a custom call-to-action wrapper.

### 4. UI Elements (`src/components/ui/`)
- **`Button.jsx`:** Reusable button variants.
- **`Skeleton.jsx`:** Used for query lists and loading states.

### 5. Dashboard Pages (`src/pages/dashboard/`)
- **`AdminDashboard.jsx`:** Moderation surface for expired queries and pending FAQs. It reads `adminService.getStats()`, `getPendingReviewQueries()`, and `getPendingFAQs()` and shows AI-synthesized answers for expired queries when available.
- **`UserDashboard.jsx`:** Shows personal queries and resolution states.
- **`ContributorDashboard.jsx`:** Manages accepted queries and responses.

---

## ⚡ Key Runtime Behavior
1. **User Dashboard:** Completed queries show resolved answer, "Resolved" badge, and resolution time (createdAt → resolvedAt).
2. **Realtime Reputation:** Contributor reputation increments by socket event when admin selects an answer; UI updates via `updateUser()` in auth store.
3. **Admin Realtime Refresh:** Socket events for expired queries and admin notifications invalidate `pending-review-queries` and `admin-stats` through the shared query client so the admin dashboard refreshes without a full page reload.
4. **Expired Query Flow:** When a query times out, the server stores one sanitized AI summary in `aiSynthesizedAnswer`; the admin dashboard reuses that stored value on refresh instead of regenerating it.
