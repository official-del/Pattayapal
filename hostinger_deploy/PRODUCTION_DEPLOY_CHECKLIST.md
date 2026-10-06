# Backend Production Deploy Checklist

Use this checklist after the production host, domain, and environment variables are ready.

## 1. Required environment

Set these variables on the host before starting the app:

- `NODE_ENV=production`
- `PORT`
- `MONGO_URI`
- `JWT_SECRET` with at least 32 characters
- `ALLOWED_ORIGINS`
- `FRONTEND_URL`
- `GCP_BUCKET_NAME`
- `GCP_PROJECT_ID`
- `GCP_KEY_JSON` or `GCP_CLIENT_EMAIL` + `GCP_PRIVATE_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `INITIAL_ADMIN_PASSWORD`

Optional production controls:

- `API_RATE_LIMIT_WINDOW_MS`
- `API_RATE_LIMIT_MAX`
- `AUTH_RATE_LIMIT_MAX`
- `MAX_UPLOAD_BYTES`
- `MAX_IMAGE_UPLOAD_BYTES`
- `SHUTDOWN_TIMEOUT_MS`
- `ENABLE_ADMIN_TEST_ENDPOINTS=false`

## 2. Install and start

```bash
cd Backend
npm ci --omit=dev
npm run check:syntax
npm start
```

## 3. Smoke test

Run this from a machine that can reach the deployed backend:

```bash
cd Backend
SMOKE_BASE_URL=https://your-backend-domain.com npm run smoke
```

The smoke script checks:

- `GET /api/health`
- `GET /api/ready`
- `GET /api/works`
- `GET /api/categories`
- `GET /api/posts`

## 4. Manual production flow checks

Run these once after deployment:

- Register and verify email
- Login and fetch profile
- Create/edit profile image and cover image
- Create post with media
- Create work with main image and album
- Open chat list, send message, send attachment, archive/unarchive
- Create work group conversation
- Submit quest proof image
- Submit manual topup slip
- Admin login, review topups, review withdrawals
- Confirm GCS upload and delete works
- Confirm SMTP email delivery

## 5. Go-live blockers

Do not open public traffic if any of these fail:

- `/api/ready` is not `200`
- Login fails
- Upload to GCS fails
- SMTP cannot send
- Chat messages do not persist after refresh
- Wallet/topup proof upload fails
- CORS blocks the production frontend domain
