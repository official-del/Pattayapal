# UI Demo Build Prompt Template

Use this prompt when asking an agent to build one full clickable demo direction.

Replace `[DEMO_NAME]`, `[ROUTE]`, and `[DIRECTION]` for each variant.

```txt
Build a full clickable PattayaPal UI demo named [DEMO_NAME] inside the existing React + Vite project.

Important:
- This is a prototype only.
- Do not replace production pages.
- Do not connect to the backend.
- Use mock data only.
- Keep the demo separated from the real website.

Project context:
- Frontend path: Production/src
- Framework: React + Vite
- Routing: React Router
- Icons: react-icons
- Existing app has real production pages and routes.

Route:
- Main demo route: [ROUTE]
- Add internal clickable pages for:
  - home
  - discovery
  - works
  - work detail
  - profile
  - dashboard
  - jobs
  - wallet
  - quests
  - messenger
  - notifications
  - auth

Design direction:
[DIRECTION]

Shared product concept:
PattayaPal is a creator/freelancer community hub and marketplace for clients. The UI should support creator discovery, portfolio browsing, hiring, messaging, rewards, rank, quests, and dashboard workflows.

Demo requirements:
- Build a dedicated layout for this demo.
- Include desktop navigation and mobile navigation.
- Include a mock user HUD with avatar, rank, coin, gas, and notification badge.
- Use reusable demo components for buttons, cards, badges, inputs, tabs, modals, toasts, avatars, status chips, progress bars, and empty states.
- Use mock data for creators, works, posts, jobs, quests, transactions, messages, notifications, and categories.
- Add local state interactions for filters, tabs, likes, claim buttons, read/unread notifications, active chat, modals, and toasts.
- Make all main buttons either navigate, open a modal, switch state, or show a toast.
- Ensure responsive behavior on desktop, tablet, and mobile.

Pages:

1. Home / Feed
- Hero or product header
- CTA buttons
- platform stats
- create post box
- feed posts
- hiring and looking-for-work variants
- profile and work links should navigate within the demo

2. Discovery
- search
- category chips
- filters
- freelancer cards
- hire modal
- profile navigation

3. Works
- portfolio grid
- category filters
- search
- work cards
- work detail navigation

4. Work Detail
- media preview
- creator info
- likes/views/comments
- related works
- hire/contact CTA

5. Profile
- cover/header
- avatar
- rank, profession, rating, location
- tabs: overview, works, packages, reviews
- message and hire actions

6. Dashboard
- overview cards
- recent activity
- job summary
- wallet and quest summary
- quick actions

7. Jobs
- job list/table
- status badges
- create job modal
- view/edit/complete demo actions

8. Wallet
- coin balance
- gas meter
- transactions
- rewards
- demo withdrawal/request action

9. Quests
- daily quests
- progress
- claim reward
- completed state
- rank-up notification

10. Messenger
- conversations
- active chat
- message bubbles
- input
- mobile-friendly layout

11. Notifications
- notification list
- read/unread state
- mark all as read
- types: job, message, coin, rank, quest

12. Auth
- login/register visual preview
- role selection
- continue button navigates to dashboard

Implementation constraints:
- Keep styles scoped under this demo.
- Prefix classes with a demo-specific prefix.
- Do not modify production CSS unless routing requires a tiny addition.
- Do not use production API modules.
- Keep code organized so winning patterns can later be extracted into production components.

Deliverables:
- demo route
- demo layout
- demo pages
- demo components
- scoped CSS
- mock data
- summary of files created
- how to open the demo
```

## Variant-Specific Direction Blocks

### Demo 01 Direction Block

```txt
Modern Pixel Creator Guild:
Modern product UI with pixel 8-bit accents. Dark background, readable white cards, orange/yellow primary actions, blue/green/red status accents, pixel details in badges, avatar frames, coin HUD, rank, quest progress, and portfolio thumbnails. Playful but not childish. Pixel accent should support usability, not dominate it.
```

### Demo 02 Direction Block

```txt
Premium Creator Marketplace:
Clean, professional marketplace UI. Black/white/warm orange palette, refined cards, strong search/filter experience, polished profile and portfolio presentation, client-friendly hiring flow. Minimal decoration, high readability, trustworthy commercial feeling. Keep coin/rank/quest elements subtle and premium.
```

### Demo 03 Direction Block

```txt
Editorial Portfolio Network:
Visual-first creator showcase. Larger media cards, editorial spacing, strong portfolio grids, creator stories, cinematic work detail pages, profile pages that make creator work feel aspirational. UI should feel creative and curated while still supporting marketplace actions.
```

### Demo 04 Direction Block

```txt
Mission Control Dashboard:
Operational creator workspace. Dense but readable interface, compact sidebar navigation, clear cards/tables/status badges, fast workflows for jobs, wallet, quests, notifications, and messenger. Prioritize efficiency and clarity while keeping a PattayaPal identity through warm accents and creator HUD elements.
```

