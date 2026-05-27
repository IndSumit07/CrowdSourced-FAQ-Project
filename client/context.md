# QueryCare Client Context

This document provides a highly compact, comprehensive overview of the `client` codebase for QueryCare, a premium crowdsourced FAQ web application. Use this context file to understand the architecture, design tokens, and components without needing to traverse every file, thereby saving tokens.

---

## 🛠️ Tech Stack & Configuration
- **Core Framework:** React 19 (ESM, `.jsx` extension)
- **Build Tool:** Vite v8
- **Styling:** Tailwind CSS v4 + PostCSS + Autoprefixer
- **Routing/State:** Minimal static pages (React Router or contexts can be placed in `src/contexts/` as needed).

---

## 🎨 Design System & Visual Aesthetics
The client uses a premium, warm, and comforting aesthetic featuring harmonized organic colors, custom micro-animations, and styled hand-drawn SVGs.

### Color Palette (HSL & Hex)
- **Primary Accent (Warm Amber/Caramel):** `#B45309` (Amber-700)
- **Secondary Accent (Soothing Sage/Teal):** `#0D9488` (Teal-600) / `#0F766E` (Teal-800)
- **Light Ambient Background:** `#FAF6F0` (Warm Cream) / `#FAF5EE` (Soft Sand)
- **Dark Neutral (Typography/Borders):** `stone-900` / `#1f1a2e` (Deep Violet-Charcoal)
- **Cheek/Accent Pink:** `#FCA5A5` / `#F472B6`

### Key Micro-Animations (`src/index.css`)
- `@keyframes float`: Translates `Y` from `0px` to `-8px` for subtle floating effects on character SVGs.
- `@keyframes float-rev`: Opposing floating direction for visual balance.
- `@keyframes pulse-card`: Periodic scale-up (to `1.015`) and shadow shift for high-priority interactive cards.

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
- **`src/pages/HomePage.jsx`:** The main entry viewport. Renders `<SiteHeader />`, `<HeroSection />`, and `<BottomSection />` inside a scroll-safe structure with the `font-sans` typeface.
- **`src/App.jsx`:** Bootstrap entry rendering `<HomePage />`.

### 2. Layouts (`src/components/layout/`)
- **`SiteHeader.jsx`:**
  - **Type:** Fixed floating top navigation bar.
  - **Aesthetics:** Glassmorphism (`backdrop-blur-md` on warm cream background with transparent stone borders).
  - **Contents:**
    - Left brand logo container (Warm amber circular badge housing a stroke-drawn speech bubble icon).
    - Center brand title: **Query** (Stone-900) **Care** (Amber-700) with a heavy display serif typeface.
    - Right onboarding action group: "Sign In" (uppercase text action) + "Sign Up" (compact solid pill button).

### 3. Page Sections (`src/components/sections/`)
- **`HeroSection.jsx`:**
  - **Visuals:** Left and right mirrored custom floating SVG cartoon characters representing communication (e.g. tin cans connected by visual string).
  - **Badge metrics:** Pill displaying `Fast &` next to a counter badge: `50k+ Verified FAQs` with a pulsing amber indicator.
  - **Typography:** Heavy bold display headings: "Fast & reliable answers by the community".
  - **CTAs:** Solid button `Browse Trusted FAQs` + Outline rounded question-mark button `Ask a Question`.
- **`BottomSection.jsx`:** A premium 3-column layout built over a custom wave divider:
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
- **`Button.jsx`:**
  - Standardized rounded button supporting polymorphic variables.
  - **Variants:**
    - `primary`: Dark text on white background with heavy shadows.
    - `ghost`: Transparent backdrop bordered with interactive opacity offsets.

---

## ⚡ Future Development Guidelines
1. **Connecting Backend APIs:** Replace mock figures inside `BottomSection.jsx` and `HeroSection.jsx` with standard `useEffect` or `react-query` fetches targetting the server's endpoints.
2. **Reusing the Theme:** Utilize Tailwind color tokens like `text-[#B45309]` (Amber/Orange accent) and `bg-[#0D9488]` (Sage Green accent) to retain design consistency.
3. **Activating Contexts:** Use the empty `contexts` folder to initialize global state managers (e.g., `AuthContext.jsx` or `FaqContext.jsx`).
