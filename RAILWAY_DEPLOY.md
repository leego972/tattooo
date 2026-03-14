# tatt-ooo — Railway Deployment Guide

## Quick Deploy

1. Push this repo to GitHub (already done via the setup script)
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Select the `tatt-ooo` repository
4. Railway auto-detects the Node.js project and runs `pnpm build` then `node dist/index.js`

## Required Environment Variables

Set these in your Railway project **Variables** tab:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | MySQL/TiDB connection string | `mysql://user:pass@host:3306/tatt_ooo` |
| `JWT_SECRET` | Session signing secret (min 32 chars) | `your-random-secret-here` |
| `OPENAI_API_KEY` | OpenAI API key for prompt refinement | `sk-proj-...` |
| `RUNWAYML_API_KEY` | RunwayML API key for image generation | `key_...` |
| `BUILT_IN_FORGE_API_KEY` | Manus built-in API key | *(from Manus platform)* |
| `BUILT_IN_FORGE_API_URL` | Manus built-in API URL | *(from Manus platform)* |
| `VITE_APP_ID` | Manus OAuth App ID | *(from Manus platform)* |
| `OAUTH_SERVER_URL` | Manus OAuth server URL | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | Manus login portal URL | `https://manus.im` |
| `NODE_ENV` | Set to `production` | `production` |

## Database Setup

Railway supports MySQL via the **MySQL** plugin:
1. In your Railway project → Add Plugin → MySQL
2. Railway auto-injects `DATABASE_URL` — no manual config needed

## Build & Start Commands

Railway uses `nixpacks` and detects these from `package.json`:

```
Build:  pnpm install && pnpm build
Start:  node dist/index.js
```

## Health Check

The app exposes `/api/health` — Railway uses this for deployment health checks.

## Image Storage

Generated tattoo images are stored in S3 (Manus built-in storage). For Railway, the same
`BUILT_IN_FORGE_API_KEY` and `BUILT_IN_FORGE_API_URL` handle this automatically.

## Notes

- The app serves both the API (`/api/*`) and the React frontend from the same Express server
- All generated images are 300 DPI print-ready PNGs stored in S3
- RunwayML generation can take 30–90 seconds — Railway's default timeout is sufficient
