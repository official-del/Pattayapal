# Implementation Guide

This guide describes how to organize the demo work without disrupting production pages.

## Recommended Folder Structure

```txt
Production/src/demo/
  shared/
    mockData.js
    demoRoutes.js
  pixel/
    PixelDemoApp.jsx
    PixelDemoLayout.jsx
    PixelDemo.css
    components/
    pages/
  premium/
    PremiumDemoApp.jsx
    PremiumDemoLayout.jsx
    PremiumDemo.css
    components/
    pages/
  editorial/
    EditorialDemoApp.jsx
    EditorialDemoLayout.jsx
    EditorialDemo.css
    components/
    pages/
  mission-control/
    MissionControlDemoApp.jsx
    MissionControlDemoLayout.jsx
    MissionControlDemo.css
    components/
    pages/
```

## Route Pattern

Use one top-level production route per demo:

```jsx
<Route path="/demo/pixel/*" element={<PixelDemoApp />} />
<Route path="/demo/premium/*" element={<PremiumDemoApp />} />
<Route path="/demo/editorial/*" element={<EditorialDemoApp />} />
<Route path="/demo/mission-control/*" element={<MissionControlDemoApp />} />
```

Inside each demo app, define internal routes with nested `Routes`.

## Component Naming

Prefix demo components so they do not collide with production components:

- `PixelButton`
- `PixelCard`
- `PremiumButton`
- `EditorialWorkCard`
- `MissionStatusBadge`

For shared demo-only components, use:

- `DemoToast`
- `DemoModal`
- `DemoAvatar`
- `DemoStatusBadge`

## CSS Rules

- Scope each demo under a wrapper class.
- Prefix classes by direction:
  - `pd-` for pixel
  - `prd-` for premium
  - `ed-` for editorial
  - `mc-` for mission control
- Avoid editing global `index.css` until a final direction is selected.
- Avoid styling raw `button`, `input`, or `h1` globally inside demo CSS.

Example:

```css
.pd-root {
  --pd-bg: #080808;
  --pd-surface: #ffffff;
  --pd-ink: #000000;
}

.pd-root .pd-button {
  border: 3px solid var(--pd-ink);
}
```

## Mock Data

Use shared mock data when possible so each direction is compared with the same content.

Good comparison requires the same:

- creator names
- professions
- work titles
- job statuses
- quest names
- messages
- notifications

## Interaction Rules

Every visible action should do at least one of these:

- navigate to another demo page
- open/close a modal
- switch tabs
- filter/search mock data
- update local state
- show a toast

Avoid dead buttons unless they are visibly disabled.

## Build Strategy

Recommended order:

1. Shared mock data
2. Shared demo shell conventions
3. Demo 01 full flow
4. Demo 02 full flow
5. Demo 03 full flow
6. Demo 04 full flow
7. Review and score
8. Extract winning system into production plan

## Production Migration

After stakeholders choose a direction:

1. Identify reusable tokens.
2. Identify reusable components.
3. Start with global UI system.
4. Redesign Navbar and Home/Feed.
5. Redesign Discovery and Works.
6. Redesign Profile.
7. Redesign Dashboard, Jobs, Wallet, Messenger.

