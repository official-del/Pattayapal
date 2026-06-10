# PattayaPal UI Demo Program

This folder is the working brief for preparing 3-4 separate PattayaPal redesign demos for stakeholder review.

The demos are not production redesigns yet. They are clickable prototypes used to compare visual direction, UX flow, and product personality before applying a final system to the real website.

## Goal

Create multiple demo directions that answer one question:

> What should PattayaPal feel like as a modern creator marketplace and community hub?

Each demo should be separated from the real production website, use mock data, and allow stakeholders to click through the major flows.

## Proposed Demo Set

| Demo | Direction | Best For |
| --- | --- | --- |
| Demo 01 | Modern Pixel Creator Guild | Playful, distinctive, game/community feeling |
| Demo 02 | Premium Creator Marketplace | Clean, polished, commercial, client-friendly |
| Demo 03 | Editorial Portfolio Network | Visual-first, portfolio-heavy, creator showcase |
| Demo 04 | Mission Control Dashboard | Operational, dense, dashboard/workflow focused |

## Recommended Routes

Use separate route groups so each direction can be tested independently:

- `/demo/pixel`
- `/demo/premium`
- `/demo/editorial`
- `/demo/mission-control`

Each route group can include internal pages such as:

- `/home`
- `/discovery`
- `/works`
- `/works/:id`
- `/profile/:id`
- `/dashboard`
- `/jobs`
- `/wallet`
- `/quests`
- `/messenger`
- `/notifications`
- `/auth`

## What Every Demo Should Include

- Home / Feed
- Freelancer Discovery
- Works / Portfolio
- Work Detail
- Creator Profile
- Dashboard
- Jobs
- Wallet / Coin
- Quests / Rank
- Messenger
- Notifications
- Auth preview
- Modals, toasts, filters, tabs, empty states, loading states

## Rules

- Do not replace production pages.
- Do not connect to the backend.
- Use mock data only.
- Scope demo styles to each demo route.
- Keep route names and component names clearly prefixed.
- Make each demo clickable enough to feel like a real product.
- Prioritize readability and mobile usability over decoration.

## File Map

- `CONTEXT.md` - product and design context shared by all demos
- `VARIANTS.md` - the 3-4 proposed visual directions
- `PROMPT_TEMPLATE.md` - reusable build prompt for each demo
- `EVALUATION_SCORECARD.md` - criteria for choosing the winning direction
- `IMPLEMENTATION_GUIDE.md` - practical React/Vite structure recommendations
- `MOCK_DATA_SPEC.md` - mock data entities every demo can share
- `DECISION_LOG.md` - place to record feedback and final decisions

