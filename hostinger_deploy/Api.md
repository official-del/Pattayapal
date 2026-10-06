# PattayaPal API Reference

Generated from `Backend/server.js` and `Backend/routes/*.js`.

## Base

- API base path: `/api`
- Static uploads: `/uploads`
- Auth header for protected routes: `Authorization: Bearer <token>`

## Middleware / Access Legend

- Public: no auth middleware in route definition
- Protected: requires `protect`
- Admin: requires `protect` + `admin`
- Upload: expects multipart form data
- Rate limited: extra limiter applied in `server.js` or route file

## Server-Level Endpoints

| Method | Endpoint | Access | Notes | Source |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | Public | Health check, returns status and uptime | `server.js` |
| GET | `/api/gcs-check` | Admin check inline | Checks GCS env configuration | `server.js` |
| GET | `/api/debug-headers` | Admin check inline | Returns selected request header/debug info | `server.js` |
| GET | `/uploads/*` | Public static | Serves uploaded files from local uploads folder | `server.js` |

## Auth Routes

Mounted at `/api/auth`.

| Method | Endpoint | Access | Notes | Source |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/register` | Public, rate limited | Register user | `routes/authRoutes.js` |
| POST | `/api/auth/login` | Public, rate limited | Login user and return JWT | `routes/authRoutes.js` |
| GET | `/api/auth/profile` | Protected, rate limited | Get current user profile | `routes/authRoutes.js` |
| GET | `/api/auth/verify-email/:token` | Public, rate limited | Verify email token | `routes/authRoutes.js` |
| PATCH | `/api/auth/profile-image` | Protected, Upload, rate limited | Upload/update profile image, field: `image` | `routes/authRoutes.js` |

## User Routes

Mounted at `/api/users`.

### Auth-Like User Endpoints

These duplicate some `/api/auth` behavior.

| Method | Endpoint | Access | Notes | Source |
| --- | --- | --- | --- | --- |
| POST | `/api/users/register` | Public, rate limited | Register user | `routes/userRoutes.js` |
| POST | `/api/users/login` | Public, rate limited | Login user | `routes/userRoutes.js` |
| GET | `/api/users/profile` | Protected | Get current user profile | `routes/userRoutes.js` |
| GET | `/api/users/verify-email/:token` | Public | Verify email token | `routes/userRoutes.js` |

### Current User / Profile

| Method | Endpoint | Access | Notes | Source |
| --- | --- | --- | --- | --- |
| GET | `/api/users/me/live-quest-data` | Protected | Current user quest verification data | `routes/userRoutes.js` |
| PATCH | `/api/users/profile-image` | Protected, Upload | Upload/update profile image, field: `image` | `routes/userRoutes.js` |
| PATCH | `/api/users/cover-image` | Protected, Upload | Upload/update cover image, field: `image` | `routes/userRoutes.js` |
| DELETE | `/api/users/profile-image` | Protected | Delete current profile image | `routes/userRoutes.js` |
| DELETE | `/api/users/cover-image` | Protected | Delete current cover image | `routes/userRoutes.js` |
| PATCH | `/api/users/me/profile` | Protected | Update current user profile | `routes/userRoutes.js` |
| PATCH | `/api/users/me/password` | Protected | Change current user password | `routes/userRoutes.js` |
| GET | `/api/users/me/rank-progress` | Protected | Current rank progress | `routes/userRoutes.js` |
| GET | `/api/users/me/dashboard-summary` | Protected | Dashboard summary | `routes/userRoutes.js` |
| GET | `/api/users/me/friend-requests` | Protected | Current user's friend requests | `routes/userRoutes.js` |

### Public Profiles / Discovery

| Method | Endpoint | Access | Notes | Source |
| --- | --- | --- | --- | --- |
| GET | `/api/users/leaderboard` | Public | User leaderboard | `routes/userRoutes.js` |
| GET | `/api/users/online` | Protected | Online users | `routes/userRoutes.js` |
| GET | `/api/users/:id/public` | Public | Public profile by user id | `routes/userRoutes.js` |
| GET | `/api/users/username/:username` | Public | Public profile by username | `routes/userRoutes.js` |
| GET | `/api/users/search` | Protected | Search users | `routes/userRoutes.js` |

### Friends

| Method | Endpoint | Access | Notes | Source |
| --- | --- | --- | --- | --- |
| GET | `/api/users/:id/friend-status` | Protected | Friend status with target user | `routes/userRoutes.js` |
| POST | `/api/users/:id/friend-request` | Protected | Send friend request | `routes/userRoutes.js` |
| PUT | `/api/users/:id/friend-request` | Protected | Accept/reject friend request | `routes/userRoutes.js` |
| DELETE | `/api/users/:id/friend` | Protected | Remove friend | `routes/userRoutes.js` |
| DELETE | `/api/users/:id/friend-request` | Protected | Cancel friend request | `routes/userRoutes.js` |

### User Admin

| Method | Endpoint | Access | Notes | Source |
| --- | --- | --- | --- | --- |
| GET | `/api/users/admin/stats` | Admin | Admin user/platform stats | `routes/userRoutes.js` |
| GET | `/api/users/admin/all` | Admin | Get all users for admin. Route appears twice in file. | `routes/userRoutes.js` |
| POST | `/api/users/admin/broadcast` | Admin | Broadcast notification | `routes/userRoutes.js` |

### User Quests

| Method | Endpoint | Access | Notes | Source |
| --- | --- | --- | --- | --- |
| POST | `/api/users/claim-quest` | Protected | Claim quest via user controller | `routes/userRoutes.js` |

## Work Routes

Mounted at `/api/works`. Upload limiter applied in `server.js`.

| Method | Endpoint | Access | Notes | Source |
| --- | --- | --- | --- | --- |
| GET | `/api/works` | Public | Get works list | `routes/workRoutes.js` |
| POST | `/api/works` | Protected, Upload, rate limited | Create work. Fields: `mainImage`, `album` | `routes/workRoutes.js` |
| GET | `/api/works/user/:userId` | Public | Get works by user | `routes/workRoutes.js` |
| GET | `/api/works/:id` | Public | Get work by id | `routes/workRoutes.js` |
| POST | `/api/works/:id/like` | Protected | Like/unlike work | `routes/workRoutes.js` |
| POST | `/api/works/:id/view` | Public | Increment unique view count | `routes/workRoutes.js` |
| POST | `/api/works/:id/comment` | Protected | Add comment to work | `routes/workRoutes.js` |
| DELETE | `/api/works/:id/comment/:commentId` | Protected | Delete comment | `routes/workRoutes.js` |
| POST | `/api/works/:id/comment/:commentId/reply` | Protected | Reply to comment | `routes/workRoutes.js` |
| PUT | `/api/works/:id/comment/:commentId` | Protected | Edit comment text | `routes/workRoutes.js` |
| PUT | `/api/works/:id` | Protected, Upload | Update work. Fields: `mainImage`, `album` | `routes/workRoutes.js` |
| DELETE | `/api/works/:id` | Protected | Delete work | `routes/workRoutes.js` |

## Post Routes

Mounted at `/api/posts`.

| Method | Endpoint | Access | Notes | Source |
| --- | --- | --- | --- | --- |
| GET | `/api/posts` | Public | Get feed posts | `routes/postRoutes.js` |
| POST | `/api/posts` | Protected, Upload | Create post. Field: `media`, max 4 | `routes/postRoutes.js` |
| GET | `/api/posts/user/:userId` | Public | Get posts by user | `routes/postRoutes.js` |
| GET | `/api/posts/:id` | Public | Get post by id | `routes/postRoutes.js` |
| DELETE | `/api/posts/:id` | Protected | Delete post | `routes/postRoutes.js` |
| POST | `/api/posts/:id/like` | Protected | Like/unlike post | `routes/postRoutes.js` |
| POST | `/api/posts/:id/comment` | Protected | Comment on post | `routes/postRoutes.js` |
| DELETE | `/api/posts/:id/comment/:commentId` | Protected | Delete post comment | `routes/postRoutes.js` |
| POST | `/api/posts/:id/comment/:commentId/reply` | Protected | Reply to post comment | `routes/postRoutes.js` |

## Category Routes

Mounted at `/api/categories`.

| Method | Endpoint | Access | Notes | Source |
| --- | --- | --- | --- | --- |
| GET | `/api/categories` | Public | Get categories | `routes/categoryRoutes.js` |
| POST | `/api/categories` | Admin | Create category | `routes/categoryRoutes.js` |
| PUT | `/api/categories/:id` | Admin | Update category | `routes/categoryRoutes.js` |
| DELETE | `/api/categories/:id` | Admin | Delete category | `routes/categoryRoutes.js` |

## Upload Routes

Mounted at `/api/upload`. Upload limiter applied in `server.js`.

| Method | Endpoint | Access | Notes | Source |
| --- | --- | --- | --- | --- |
| POST | `/api/upload/single` | Protected, Upload, rate limited | Upload one file. Field: `file` | `routes/uploadRoutes.js` |
| DELETE | `/api/upload/delete` | Admin, rate limited | Delete uploaded file by `url` in body | `routes/uploadRoutes.js` |
| GET | `/api/upload/test-env` | Admin, rate limited | Returns sanitized GCS env diagnostic info | `routes/uploadRoutes.js` |

## Chat Routes

Mounted at `/api/chat`.

| Method | Endpoint | Access | Notes | Source |
| --- | --- | --- | --- | --- |
| POST | `/api/chat/conversation` | Protected | Get or create direct conversation | `routes/chatRoutes.js` |
| POST | `/api/chat/groups` | Protected | Create group conversation | `routes/chatRoutes.js` |
| GET | `/api/chat/conversations` | Protected | Get my conversations | `routes/chatRoutes.js` |
| GET | `/api/chat/:conversationId` | Protected | Get conversation by id | `routes/chatRoutes.js` |
| GET | `/api/chat/:conversationId/messages` | Protected | Get messages for conversation | `routes/chatRoutes.js` |
| PATCH | `/api/chat/:conversationId/read` | Protected | Mark conversation messages as read | `routes/chatRoutes.js` |
| PATCH | `/api/chat/:conversationId/archive` | Protected | Archive/unarchive conversation | `routes/chatRoutes.js` |
| POST | `/api/chat/message` | Protected, Upload | Send message. Field: `attachments`, max 10 | `routes/chatRoutes.js` |

## Job Routes

Mounted at `/api/jobs`.

| Method | Endpoint | Access | Notes | Source |
| --- | --- | --- | --- | --- |
| POST | `/api/jobs` | Protected, rate limited | Create job | `routes/jobRoutes.js` |
| GET | `/api/jobs/sent` | Protected | Jobs sent by current user | `routes/jobRoutes.js` |
| GET | `/api/jobs/received` | Protected | Jobs received by current user | `routes/jobRoutes.js` |
| PATCH | `/api/jobs/:jobId/status` | Protected | Update job status | `routes/jobRoutes.js` |
| PATCH | `/api/jobs/:jobId/progress` | Protected | Update job progress | `routes/jobRoutes.js` |

## Notification Routes

Mounted at `/api/notifications`.

| Method | Endpoint | Access | Notes | Source |
| --- | --- | --- | --- | --- |
| GET | `/api/notifications` | Protected | Get my notifications | `routes/notificationRoutes.js` |
| PATCH | `/api/notifications/read-all` | Protected | Mark all notifications as read | `routes/notificationRoutes.js` |
| PATCH | `/api/notifications/:id/read` | Protected | Mark one notification as read | `routes/notificationRoutes.js` |
| DELETE | `/api/notifications/clear-all` | Protected | Delete all notifications | `routes/notificationRoutes.js` |
| DELETE | `/api/notifications/:id` | Protected | Delete one notification | `routes/notificationRoutes.js` |

## Analytics Routes

Mounted at `/api/analytics`.

| Method | Endpoint | Access | Notes | Source |
| --- | --- | --- | --- | --- |
| GET | `/api/analytics/views` | Protected | View trend analytics | `routes/analyticsRoutes.js` |
| GET | `/api/analytics/platforms` | Protected | Platform breakdown analytics | `routes/analyticsRoutes.js` |
| GET | `/api/analytics/profile` | Protected | Profile analytics summary | `routes/analyticsRoutes.js` |

## Wallet Routes

Mounted at `/api/wallet`.

| Method | Endpoint | Access | Notes | Source |
| --- | --- | --- | --- | --- |
| POST | `/api/wallet/topup-manual` | Protected, Upload, rate limited | Submit manual topup slip. Field: `slip` | `routes/walletRoutes.js` |
| GET | `/api/wallet/transactions` | Protected | Wallet transaction history | `routes/walletRoutes.js` |
| POST | `/api/wallet/withdraw` | Protected | Request withdrawal | `routes/walletRoutes.js` |
| POST | `/api/wallet/refill-gas` | Protected, rate limited | Refill gas | `routes/walletRoutes.js` |
| GET | `/api/wallet/admin/topups` | Admin | Admin list topups | `routes/walletRoutes.js` |
| PATCH | `/api/wallet/admin/topups/:id/status` | Admin | Approve/reject topup | `routes/walletRoutes.js` |
| GET | `/api/wallet/admin/withdrawals` | Admin | Admin list withdrawals | `routes/walletRoutes.js` |
| PATCH | `/api/wallet/admin/withdrawals/:id` | Admin, Upload | Approve/reject withdrawal. Optional field: `proofImage` | `routes/walletRoutes.js` |
| POST | `/api/wallet/admin/adjust-balance` | Admin | Manually adjust/send coins | `routes/walletRoutes.js` |
| POST | `/api/wallet/admin/adjust-gas` | Admin | Manually adjust gas | `routes/walletRoutes.js` |
| GET | `/api/wallet/admin/audit-logs` | Admin | Security/audit logs | `routes/walletRoutes.js` |

## Quest Routes

Mounted at `/api/quests`.

| Method | Endpoint | Access | Notes | Source |
| --- | --- | --- | --- | --- |
| GET | `/api/quests` | Protected | Get active quests | `routes/questRoutes.js` |
| POST | `/api/quests` | Protected | Create quest | `routes/questRoutes.js` |
| PUT | `/api/quests/:questId` | Protected | Update quest | `routes/questRoutes.js` |
| DELETE | `/api/quests/:questId` | Protected | Delete quest | `routes/questRoutes.js` |
| POST | `/api/quests/:questId/accept` | Protected | Accept quest | `routes/questRoutes.js` |
| POST | `/api/quests/:questId/claim` | Protected | Claim quest reward | `routes/questRoutes.js` |

## Quest Submission Routes

Mounted at `/api/quest-submissions`.

| Method | Endpoint | Access | Notes | Source |
| --- | --- | --- | --- | --- |
| POST | `/api/quest-submissions/submit` | Protected, Upload | Submit quest proof. Field: `image` | `routes/questSubmissionRoutes.js` |
| GET | `/api/quest-submissions/admin/all` | Admin | Get all quest submissions. | `routes/questSubmissionRoutes.js` |
| PATCH | `/api/quest-submissions/admin/:submissionId/review` | Admin | Review quest submission. | `routes/questSubmissionRoutes.js` |

## Test Routes

Mounted at `/api/test`.

| Method | Endpoint | Access | Notes | Source |
| --- | --- | --- | --- | --- |
| GET | `/api/test/email?email=:email` | Public | Send test verification email | `routes/testEmailRoute.js` |

## Socket.IO Events

These are not REST endpoints, but they are active API events in `server.js`.

### Client Emits

| Event | Notes |
| --- | --- |
| `join_room` | Join a conversation/room id |
| `join_user` | Join user's personal room and mark user online |
| `send_message` | Broadcast message to a room |
| `mark_read` | Notify sender messages were read |
| `typing` | Send typing event to room |
| `stop_typing` | Send stop typing event to room |
| `call_user` | WebRTC call offer |
| `answer_call` | WebRTC answer |
| `ice_candidate` | WebRTC ICE candidate |
| `end_call` | End call |

### Server Emits

| Event | Notes |
| --- | --- |
| `status_change` | Online/offline updates |
| `online_users_list` | Current online users list |
| `receive_message` | Incoming socket message |
| `messages_read` | Read receipt |
| `user_typing` | Typing indicator |
| `user_stop_typing` | Stop typing indicator |
| `call_incoming` | Incoming voice/video call |
| `call_answered` | Call answered |
| `ice_candidate` | ICE candidate forwarded |
| `call_ended` | Call ended |
| `new_notification` | Emitted by some controllers/routes |
| `profile_updated` | Emitted after profile/cover image updates |

## Route Files Present But Not Mounted

`routes/userAuthRoutes.js` defines routes below, but `server.js` does not mount it via `app.use(...)`, so these endpoints are not active unless mounted later.

| Method | Endpoint If Mounted | Access | Notes | Source |
| --- | --- | --- | --- | --- |
| POST | unknown base `/register` | Public | Register user | `routes/userAuthRoutes.js` |
| POST | unknown base `/login` | Public | Login user | `routes/userAuthRoutes.js` |

## Security / Cleanup Notes

- `/api/categories` create/update/delete now require admin access.
- `/api/upload/single` now requires login; `/api/upload/delete` and `/api/upload/test-env` now require admin access.
- `/api/works/:id/comment` now requires login and uses the authenticated user from JWT.
- `/api/quest-submissions/admin/*` now requires admin access.
- `/api/users/admin/all` duplicate route was removed.
- `/api/auth/*` and `/api/users/*` still both expose auth-like register/login/profile endpoints and should be consolidated in a later pass.
