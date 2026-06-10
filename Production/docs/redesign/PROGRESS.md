# PattayaPal Production Redesign Progress

This file tracks production redesign decisions and page coverage so future work does not lose context.

## Current Direction

PattayaPal should become more beautiful, organized, and production-ready while keeping the current dark/orange identity.

Do not change the brand into a completely new theme. Keep the existing PattayaPal energy, but reduce visual noise, scattered inline styles, excessive glow, and inconsistent component treatment.

## Confirmed Decisions

Date: 2026-06-03

### Home Direction

Use a hybrid Home structure, but make the Feed the hero.

Implication:

- Center feed should be the primary focus.
- Discovery, categories, trending, rankings, and services should support the feed instead of competing with it.
- Secondary modules should become calmer, smaller, and more scannable.

### Navigation Direction

Use a compact sidebar, but improve tooltip and label clarity.

Implication:

- Keep compact navigation as part of PattayaPal's identity.
- Make nav labels easier to discover.
- Add or improve tooltip/expanded label behavior.
- Active state should be obvious.
- Avoid a desktop experience that feels like hidden mobile navigation.

### First Production Scope

Start with:

1. Global UI System
2. Navbar
3. Home / Feed

Reason:

These three areas define the product's visual language and will make later pages easier to redesign consistently.

## Page / Surface Tracking

| Surface | Status | Notes |
| --- | --- | --- |
| Global UI System | Modern pixel system pass 2 | Added shared tokens, typography sizing, readable Thai/English font stack, modern pixel buttons, inputs, cards, badges, alerts, toasts, tables, modals, empty states, skeletons, and loader utilities. |
| Loader System | Polish pass 1 | Replaced the main cube loader with the requested orange pixel square loader and applied it to major page, inline, upload, auth, quest, and admin loading states. |
| Navbar / Sidebar | Modern pixel layout pass 1 | Compact desktop sidebar now has clearer labels/tooltips, stronger active state, tokenized spacing/type, pixel HUD cells, and stable desktop/mobile breakpoints. |
| Home / Feed | Modern pixel audit pass 1 | Hybrid layout now makes the feed the hero with a quieter compact toolbar, cleaned create-post composer, clearer post cards, lighter side rails, redesigned trending/ranking panels, pixel grid surface, tokenized spacing, and a tighter three-column Home shell. |
| Rankings Hub | Modern pixel layout/polish pass 1 | Main rankings page now uses a Modern Pixel hero, compact XP/Coins tabs, podium cards, current-rank panel, leaderboard rows, and profession CTA with reduced glow/glass and token-aligned spacing. |
| Rankings Role | Modern pixel layout/polish pass 1 | Role rankings now use the same Modern Pixel shell as Rankings Hub, with compact role cards, clean role leader rows, circular avatars, tokenized tabs, and reduced inline styling. |
| Discovery / Find Freelancers | Modern pixel layout/polish pass 3 | Marketplace discovery now has database-derived role filters, compact creator cards, custom skill suggestions, cleaner Energy HUD, and removed corner-dot noise. |
| Services | Modern pixel marketplace pass 1 | Reframed from a company service page into a creator/freelancer marketplace directory with hiring categories, creator actions, quest flow, and marketplace CTAs. |
| Works / Portfolio | Modern pixel layout/polish pass 2 | User Creations keeps the original showcase/bento layout direction but now uses Modern Pixel cards, loading cover overlays, cleaner filters, softer typography, and organized views. |
| Work Detail | Modern pixel layout/polish pass 1 | Rebuilt as a class-based project detail page with stronger media hierarchy, structured creator/action sidebar, comments, assets, lightbox, related works, and responsive breakpoints. |
| Upload / Edit Work Form | Modern pixel layout/polish pass 1 | Rebuilt the shared upload/edit form into a class-based Modern Pixel creator form with structured project fields, media type toggle, cover upload, album assets grid, upload progress, submit states, and responsive behavior. |
| User Profile | Modern pixel layout/typeset pass 4 | Profile now has a professional creator identity hero, readable sidebar/content typography, portfolio/package cards, modal fixes, restored Edit Identity / package share interactions, and a fixed cover/background layer that no longer leaks behind content. |
| Dashboard Overview | Modern pixel layout/polish pass 1 | Creator Overview now uses operational Modern Pixel styling with compact panels, orange accents, stat cards, rank progress, and chart surfaces aligned to the Home system. |
| Jobs | Modern pixel layout/polish pass 1 | Manage Jobs now has a mission-board structure, compact job cards, escrow/status panels, milestones, and clearer action hierarchy. |
| Wallet | Modern pixel layout/polish pass 1 | My Coin/Wallet now uses coin/gas panels, recharge/cash-out forms, transaction drawer, and cleaner wallet states. |
| Quests | Modern pixel layout/polish pass 1 | Daily Quests now has quest sections, reward cards, proof modal, admin queue, and bottom-right Modern Pixel notifications. |
| Messenger | Modern pixel layout/polish pass 1 | Messenger now has a task-focused chat shell, inbox, composer, attachments, call/location/lightbox states, and mobile behavior. |
| Notifications | Modern pixel layout/polish pass 1 | Notifications now has signal-center cards, read/unread hierarchy, filters, actions, empty/loading states, and wider route wrapper. |
| Admin | Modern pixel console pass 1 | Admin Login, Dashboard nav, Overview analytics, Work Form, and Withdrawals now use the Modern Pixel console treatment with cleaner panels, forms, dense nav, and detector-clean CSS. |
| Auth | Modern pixel layout/polish pass 2 | Login/Register and Verify Email now use class-based Modern Pixel forms, readable copy, role selection, terms flow, shared auth styling, and a compact custom role picker that avoids native dropdown overflow. |

## Completed Setup

- `PRODUCT.md` created at project root.
- Impeccable live config created at `.impeccable/live/config.json`.
- First critique snapshot created for `Production/src/pages/Home.jsx`.

## Completed Polish Passes

Date: 2026-06-03

- Global UI System pass 1: added shared design tokens and calmer base component utilities in `Production/src/index.css`.
- Loader System pass 1: updated `PremiumLoader` to use the requested pixel square animation and replaced key one-off spinners in post creation, auth, work upload, quests, and admin loading states.
- Navbar / Sidebar pass 1: refined compact sidebar spacing, labels, tooltip behavior, active state, and desktop/mobile breakpoints in `Production/src/components/Navbar.jsx` and `Production/src/css/Navbar.css`.
- Home / Feed pass 1: added feed-first hero section, feed filters, status pills, structured sidebars, and responsive layout in `Production/src/pages/Home.jsx` and `Production/src/css/Home.css`.

Date: 2026-06-04

- Layout/typeset pass 1: tightened global type tokens, moved the product UI toward a fixed rem-based type scale, improved Thai/English font stack, reduced excessive label tracking, and tokenized Home/Navbar spacing.
- Layout detector pass: resolved width-transition and side-accent warnings in Navbar CSS.

Date: 2026-06-04

- Modern pixel layout pass 1: added pixel layout tokens, applied subtle grid surfaces, hard-shadow panels, square action cells, pixel corner accents, and HUD-style nav states while keeping Feed as the primary Home surface.

Date: 2026-06-05

- Home / Feed modern pixel pass 2: improved FeedPost card clarity with stronger surface, border, hard shadow, and action buttons; redesigned right rail trending/ranking cards with framed media and compact ranking list styling.

Date: 2026-06-05

- Global UI System modern pixel pass 2: expanded `Production/src/index.css` with reusable `pp-*` component classes for cards, panels, buttons, icon buttons, inputs, selects, textareas, badges, alerts, toasts, tables, modals, empty states, and skeleton loading. The design follows the attached reference direction but keeps PattayaPal restrained, dark, readable, and product-oriented.
- Home right rail polish: fixed Trending creations carousel overflow, moved dots inside the framed stage, reduced background-card drift, and tightened the media card into a clipped modern pixel frame.

Date: 2026-06-05

- Home / Feed modern pixel pass 3: removed the oversized feed hero/stat block, replaced it with a compact live community toolbar and filters, tightened the left category rail/right rail alignment, and made the Home shell feel more focused while keeping the same dark/orange Modern Pixel theme.

Date: 2026-06-05

- Home / Feed audit pass 1: reduced stacked visual layers on the Home page by quieting the toolbar, side rails, right rail panels, create-post composer, and FeedPost cards. Removed the heavy left beam treatment from posts, fixed sidebar heading overlap, and kept Modern Pixel accents as smaller product UI details instead of repeated heavy frames.

Date: 2026-06-05

- Home sidebar/service polish: refined the `Work categories` and `Explore services` panels to match the requested reference more closely, with thinner panel borders, tighter list rows, clearer orange icon treatment, service copy/chevron alignment, and calmer hover states while keeping the dark/orange Modern Pixel direction.

Date: 2026-06-05

- Feed comments polish: redesigned the comment panel and composer into a compact Modern Pixel treatment, reduced unnecessary vertical whitespace, tightened avatar/input sizing, and replaced the oversized pill/glass comment input with a smaller token-aligned pixel input shell.

Date: 2026-06-06

- Feed comment behavior: changed Home feed comments to single-open behavior, so opening comments on one post automatically closes the previously open comment panel and keeps only the active post's comment composer visible.

Date: 2026-06-06

- Home animation pass 1: added restrained product motion to the Home feed, including a subtle toolbar entrance, tighter post-list stagger, active filter indicator animation, tap feedback for category/service rows, gentle right-panel/ranking hover states, and lightweight FeedPost hover lift while respecting the existing reduced-motion rules.

Date: 2026-06-06

- Creator Overview layout/polish pass 1: redesigned the dashboard overview away from the old premium/glass style into the Modern Pixel system, with tighter workspace spacing, 8-10px panels, orange pixel accents, compact stat cards, cleaner rank progress, chart grid surfaces, improved tooltip styling, and responsive dashboard grids.

Date: 2026-06-06

- Rankings Hub layout/polish pass 1: rebuilt `Production/src/pages/RankingsHub.jsx` around a cleaner Modern Pixel structure and moved styling into `Production/src/css/RankingsHub.css`. The page now has a token-aligned hero, compact category tabs, responsive podium cards, a current-rank card, cleaner leaderboard rows, and a profession CTA without the old heavy glass, oversized rounded panels, or excessive glow.

Date: 2026-06-06

- Rankings Hub polish pass 2: made ranking avatars crop as full circular profile images and reorganized the long leaderboard rows with clearer creator metadata, then removed the XP progress bars after review because they made the leaderboard feel too dense.

Date: 2026-06-06

- Rankings Role layout/polish pass 1: rebuilt `Production/src/pages/RoleRankings.jsx` into a Modern Pixel role leaderboard and moved styling into `Production/src/css/RoleRankings.css`, replacing the old inline glass layout with a token-aligned hero, tabs, role cards, compact ranking rows, circular avatars, and calmer responsive behavior.

Date: 2026-06-06

- Rankings shell routing fix: moved `/rankings` and `/rankings/roles` into the `DashboardLayout` shell, hid the global Navbar for ranking routes, and added dashboard breadcrumb titles for Rankings Hub and Role Leaderboards.

Date: 2026-06-06

- Manage Jobs layout/polish pass 1: rebuilt `Production/src/pages/Dashboard/ManageJobs.jsx` into a cleaner class-based Modern Pixel task surface and replaced the old hyper/glass `Production/src/css/ManageJobs.css` with token-aligned header, tabs, job cards, escrow/status tiles, milestone timeline, action panel, empty state, and responsive rules.

Date: 2026-06-06

- My Coin layout/polish pass 1: rebuilt `Production/src/pages/Dashboard/ManageWallet.jsx` into a class-based Modern Pixel wallet surface and added `Production/src/css/ManageWallet.css`, covering the coin/gas overview, recharge receipt form, cash-out form, gas refill panel, pending verification rows, transaction drawer, and modal states.

Date: 2026-06-06

- Daily Quests layout/polish pass 1: rebuilt `Production/src/pages/Dashboard/Quests.jsx` into a class-based Modern Pixel quest board and added `Production/src/css/Quests.css`, covering the hero summary, quest stats, coin/XP quest sections, quest cards, reward/actions, proof modal, admin review queue, empty/loading/toast states, and responsive behavior.
- Daily Quests notification polish: changed quest accept, proof submit, delete, error, and reward-claim feedback into a fixed bottom-right Modern Pixel HUD. Reward claims now show earned Coin/XP badges inside the notification.
- Manage Portfolio layout/polish pass 1: rebuilt `Production/src/pages/Dashboard/ManageWorks.jsx` and replaced `Production/src/css/ManageWorks.css` with a Modern Pixel portfolio console, including hero copy, summary stats, gallery toolbar, responsive work cards, media previews, status/category badges, action buttons, and empty state.
- Navbar cleanup: removed Manage Job, My Coin/My Wallet, and Daily Quests from the main sidebar navigation because those actions now live inside DashboardOverview shortcuts, while keeping the underlying routes available.
- Notifications layout/polish pass 1: rebuilt `Production/src/pages/Dashboard/Notifications.jsx` and replaced `Production/src/css/Notifications.css` with a Modern Pixel signal center, including hero actions, compact stats, filter tabs, notification cards, unread states, type badges, empty/loading states, and a wider route wrapper in `Production/src/App.jsx`.
- Find Freelancer layout/polish pass 1: rebuilt `Production/src/pages/Discovery.jsx` and added `Production/src/css/Discovery.css` with a Modern Pixel marketplace surface, including hero HUD, search panel, role/rank filters, compact stats, creator grid cards, profile/hire actions, loading/empty states, and responsive behavior.
- Messenger layout/polish pass 1: replaced `Production/src/css/Messenger.css` with a Modern Pixel communication shell covering the nav rail, inbox panel, search/tabs, conversation rows, chat header, message bubbles, attachments, composer, file previews, voice recording, call overlay, location cards, lightbox, and mobile chat behavior while preserving the existing messaging logic.
- Friends layout/polish pass 1: rebuilt `Production/src/pages/Friends.jsx` and added `Production/src/css/Friends.css` as a Modern Pixel social hub with hero summary, compact stats, search/request/friends tabs, creator rows, friend cards, request actions, empty states, and safe text normalization for object-shaped API fields.
- Find Freelancer runtime fix: added safe display normalization in `Production/src/pages/Discovery.jsx` for name, profession, rank, category, and skill fields so object-shaped API data cannot render as React children.
- Find Freelancer polish pass 2: reduced stacked visual layers in `Production/src/css/Discovery.css`, tightened filter/search spacing, moved creator rank badges away from pixel corner dots, improved creator card vertical rhythm, and changed role filters in `Production/src/pages/Discovery.jsx` to derive only from actual freelancer professions returned by the users database.
- Find Freelancer search suggestion polish: replaced the native `datalist` skill dropdown in `Production/src/pages/Discovery.jsx` with a custom Modern Pixel suggestion panel styled in `Production/src/css/Discovery.css`, limiting height, adding internal scroll, and presenting skills as compact selectable chips so long skill lists no longer overflow the viewport.
- Find Freelancer typeset pass 1: softened the Creator Market typography in `Production/src/css/Discovery.css` by reducing heavy 850-900 font weights on creator names, rank badges, skills, buttons, filters, and headings, improving line-height and chip sizing while keeping the Modern Pixel accent system.
- Profile layout/polish pass 1: added `Production/src/css/UserProfile.css` and scoped the Profile route into the Modern Pixel system with a cleaner cover/identity header, restrained orange pixel accents, tighter two-column layout, compact sidebar panels, token-aligned tabs, cleaner portfolio/package cards, readable profile typography, responsive behavior, and modal/form polish while preserving the existing profile logic.
- Profile layout/typeset pass 2: resolved overlapping layers in the profile header by reducing the profile frame size, aligning avatar/name/actions on a cleaner row, softening the display title weight/shadow, tightening the content grid, and giving portfolio cards dedicated media/body/title classes with stable aspect ratios and more readable typography.
- Profile layout pass 3: upgraded the profile hero into a more professional creator identity card with an avatar plate, structured identity metadata, compact status/creations/rank stat chips, clearer action placement, stronger desktop grid behavior, and safer tablet/mobile stacking.
- Profile typeset pass 3: refined non-hero typography across the Profile content area, separating section labels, sidebar values, stat numbers, tabs, work titles, package titles, experience roles, metadata, and empty-state text into more readable weights, line-heights, and sizes.
- User Creations layout/polish pass 1: rebuilt `Production/src/pages/Works.jsx` and replaced `Production/src/css/Works.css` while preserving the original showcase layout direction: header, horizontal filters, bento grid with large cards, image overlays, category/views metadata, new badges, empty/error states, and responsive behavior, but restyled into the Modern Pixel system.
- Loader System animation pass 2: updated the shared `PremiumLoader` pixel animation in `Production/src/index.css` from left/top block movement to transform-based orbiting squares, with four orange/yellow squares cycling around a pulsing center block for smoother Modern Pixel loading across fullscreen, inline, and bare loader states.
- Video cover display pass 1: added shared media helpers in `Production/src/utils/mediaUtils.js` for work poster/video URLs and applied them across User Creations, Home trending, User Profile portfolio, Manage Portfolio, Work Detail, WorksSlider, VideoSlider, and TopRanking so video work cards prefer uploaded thumbnail/poster/cover image fields before falling back to media.
- Video cover display pass 2: updated `Production/src/components/HoverVideoPlayer.jsx` so works without an uploaded poster render a paused metadata-loaded video frame while in view, preventing black cards before hover. Also tightened `getWorkVideoUrl()` so image `mainImage` values are not treated as video sources.
- User Creations typeset/polish pass 2: softened showcase card overlay typography in `Production/src/css/Works.css`, removed the eye icon from views in `Production/src/pages/Works.jsx`, and redesigned views as a quiet text pill so media and project titles stay dominant.
- User Creations media loading pass 1: added a Modern Pixel loader overlay while cover images and video poster/frame media are loading, then fade the media in once ready to avoid black or empty cards.
- Work Detail layout/polish pass 1: rebuilt `Production/src/pages/WorkDetail.jsx` and added `Production/src/css/WorkDetail.css` as a class-based Modern Pixel project page, with a stronger media stage, structured creator/action/sidebar panel, cleaner comments and replies, asset grid, lightbox controls, related works, and responsive breakpoints.
- Loader System animation fix: corrected the shared `pp-pixel-loader` keyframes in `Production/src/index.css` to avoid unsupported multiplication-style `calc()` transforms, restoring visible orbiting square animation across global and inline loaders.
- Upload/Edit Work Form layout/polish pass 1: rebuilt `Production/src/pages/UserWorkForm.jsx` and replaced `Production/src/css/WorkForm.css` with a Modern Pixel form system, covering project data fields, category select, story textarea, image/video cover upload, album assets, upload progress, and submit states.
- Profile interaction fix: restored click reliability for Profile hero actions and package sharing by adding explicit pointer/click handlers in `Production/src/pages/UserProfile.jsx`, raising the Profile action layer in `Production/src/css/UserProfile.css`, disabling pointer capture on the cover backdrop, and matching Edit Identity / Share Package modal z-index behavior.
- Profile interaction fix pass 2: removed the old inline `<style>` block from `Production/src/pages/UserProfile.jsx`, moved Edit Identity and Share Package modals through `createPortal(document.body)`, added native document-level pointer fallback based on button hit boxes, and made the fullscreen `PremiumLoader` visual-only (`pointerEvents: none`) so stale loader overlays cannot block Profile actions.
- Profile portfolio card typography polish: changed Profile work card titles and category metadata to white/soft-white text in `Production/src/css/UserProfile.css` and removed the inline orange category color from `Production/src/pages/UserProfile.jsx`.
- Profile hero badge spacing polish: tightened the profession badge beside the username in `Production/src/pages/UserProfile.jsx` and `Production/src/css/UserProfile.css`, reducing the extra horizontal padding while keeping the orange Modern Pixel chip treatment.
- Services marketplace pass 1: rewrote `Production/src/pages/Services.jsx` and added `Production/src/css/Services.css`, replacing company-service copy, contact/map sections, and agency-style CTAs with PattayaPal marketplace categories, creator hiring actions, quest flow explanation, and Modern Pixel service cards.
- Route cleanup pass 1: removed Clients, Contact, and standalone Feed from App routes, path constants, sidebar navigation, footer links, and deleted the unused standalone page/CSS files. Home/community feed surfaces remain active, but the separate `/feed`, `/clients`, and `/contact` pages are no longer part of the app shell.
- Hire Modal layout/polish pass 1: rebuilt `Production/src/components/HireModal.jsx` and added `Production/src/css/HireModal.css`, turning the hire request popup into a cleaner Modern Pixel quest modal with grouped project fields, readable Thai copy, escrow protection panel, coin/energy summary, improved disabled/loading states, and a matching map picker dialog.
- Footer layout/polish pass 1: rebuilt `Production/src/components/Footer.jsx` and replaced `Production/src/css/Footer.css` with a Modern Pixel marketplace footer, including a cleaner PattayaPal brand block, quick action links, grouped marketplace/creator/workspace navigation, platform status panel, legal links, and responsive behavior without the old inline styles or company/contact copy.
- Footer placement pass 1: added the shared Modern Pixel Footer to the public/marketplace/legal surfaces that should close with site navigation: Home, Find Freelancers, Work Detail, Post Detail, User Profile, Role Rankings, Terms, and Privacy. Dashboard, Messenger, Friends, notifications, auth, admin, and work form surfaces intentionally stay footer-free.
- Find Freelancer polish pass 3: removed the pixel corner-dot accents across the Discovery page cards/panels and tightened the Energy HUD layout so the icon, label, and percentage read as one organized status module.

Date: 2026-06-07

- Auth layout/polish pass 1: rewrote `Production/src/pages/UserAuth.jsx`, `Production/src/pages/VerifyEmail.jsx`, and `Production/src/css/UserAuth.css` into a class-based Modern Pixel account gateway with cleaner Login/Register toggle, role selection, terms acceptance, readable Thai/English copy, and shared verify states.
- Post Detail layout/polish pass 1: rebuilt `Production/src/pages/PostDetail.jsx` and added `Production/src/css/PostDetail.css`, replacing the old inline wrapper/error state with a focused community post shell, toolbar, readable empty/error panel, and footer support.
- Legal layout/polish pass 1: rewrote `Production/src/pages/Legal/Terms.jsx`, `Production/src/pages/Legal/Privacy.jsx`, and added `Production/src/css/LegalPages.css`, turning Terms/Privacy into readable Modern Pixel legal documents with structured sections and calmer page rhythm.
- Admin console pass 1: redesigned `Production/src/pages/Admin/AdminLogin.jsx`, rewrote `Production/src/pages/Admin/AdminOverview.jsx`, refined the AdminDashboard top nav, added `Production/src/css/AdminWithdrawals.css`, and added Modern Pixel overrides to `AdminDashboard.css` / `AdminWorkForm.css`. The admin batch now passes the impeccable detector with no hits and builds successfully.
- Home guest access polish: added a top Modern Pixel guest CTA bar in `Production/src/pages/Home.jsx` and `Production/src/css/Home.css` so logged-out visitors see `Login now` and `Register now` actions before the feed. Register opens the auth page directly in register mode.
- Manage Portfolio typeset polish: softened work-card typography in `Production/src/css/ManageWorks.css` by moving portfolio titles to the readable main font, reducing heavy 850 weights on titles, tags, status chips, and edit buttons, and opening line-height/letter-spacing so card text reads cleaner while keeping the Modern Pixel frame.
- Messenger voice message polish: replaced native browser audio controls in `Production/src/pages/Messenger.jsx` with a custom Modern Pixel waveform voice bubble styled in `Production/src/css/Messenger.css`, including play/pause, animated bars, duration display, mobile sizing, and reduced-motion support.
- Messenger media density polish: added image/audio media classes in `Production/src/pages/Messenger.jsx` and capped image plus voice-note bubbles in `Production/src/css/Messenger.css` to stay around half the chat column, with tighter image heights and compact mobile waveform behavior.
- Production readiness pass 1: hardened frontend API/socket configuration in `Production/src/utils/config.js`, corrected frontend/root environment examples, refreshed SEO/social metadata in `Production/index.html`, removed the ignored Vite `esbuild.drop` option, cleaned browser notification copy in `SocketContext`, and reduced the global loader from video-blocking resource waits to a faster image/document readiness gate with lazy-loaded splash assets.
- Production optimization pass 1: removed the 7.5MB `pal-coin.png` dependency from `CoinIcon` by replacing it with a CSS Modern Pixel coin, swapped app logo imports from the 3.9MB bundled `LOGO1.png` to the public `LOGOWEB.png`, removed the ineffective dynamic import in `AuthContext`, and made small/medium rank badges render as lightweight CSS tokens while keeping large rank identity art available.
- Admin production alignment: removed active admin work-upload/edit routes by redirecting `/admin/works/new` and `/admin/works/:id` back to the admin dashboard, then changed the Admin Dashboard Works tab into a moderation view with public project viewing and delete-only moderation actions.
- Brand identity restoration: reverted app logo usage back to the fixed `LOGO1.png` asset across Navbar, Footer, Auth, and splash screens, and restored `RankBadge` to render the existing rank image assets at every size instead of CSS initials.

Date: 2026-06-09

- Host readiness pass 2: fixed the Profile cover/background layering by introducing dedicated `profile-cover-*` classes, clipping the cover to the hero band, and giving the main profile content its own grid background so uploaded cover images no longer appear behind tabs, sidebar cards, or portfolio cards.
- Shared form polish pass 1: softened `CustomSelect`, Image Crop, and MediaUploader shared styling in `Production/src/index.css` with lighter borders, calmer shadows, lower font weights, and compact mobile-safe menus.
- Auth role picker polish pass 2: reduced nested focus frames, softened role option typography, and capped the Register role menu height in `Production/src/css/UserAuth.css` so long role lists stay readable and scrollable.

## Critique Baseline

Target: `Production/src/pages/Home.jsx`

Score: 20/40

Top issues:

- Visual system is fragmented.
- Home page has high cognitive load.
- Navigation is stylish but not stable enough.
- Glow/glass/motion are overused.
- Typography needs a tighter product scale.

## Next Recommended Work

1. Run a full responsive audit across desktop, tablet, and mobile for the redesigned public, dashboard, profile, and admin surfaces.
2. Replace the remaining heavy inline style pockets inside AdminDashboard and AdminWithdrawals with named CSS classes when time allows.
3. Do a final copy/encoding sweep for older Thai strings that may still appear garbled in admin-only flows.
4. Capture comparison screenshots for the 3-4 visual directions your team wants to review.
