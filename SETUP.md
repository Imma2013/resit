# Self-Hosted Setup

Resit is designed to run with your own API keys. This guide walks through the
full local and Vercel deployment.

## Prerequisites

- Node.js 20 or newer
- pnpm 10 (enable with `corepack enable`)
- The Firebase CLI
- The Convex CLI
- The Vercel CLI (optional, for hosting)
- A GitHub account

## 1. Clone and install

```bash
git clone https://github.com/Imma2013/resit.git
cd resit
corepack enable
corepack pnpm install
corepack pnpm setup
```

`pnpm setup` copies `.env.example` to `.env.local`.

## 2. Configure Firebase

1. Create a project in the Firebase console.
2. Enable Google sign-in under Authentication.
3. Register a web app and copy its config.
4. Fill the `NEXT_PUBLIC_FIREBASE_*` values in `.env.local`.
5. Set `FIREBASE_PROJECT_ID` in the Convex environment.

```bash
firebase login
firebase use <firebase-project-id>
```

## 3. Configure Convex

```bash
corepack pnpm convex:dev
```

Convex generates its typed `convex/_generated` files on the first successful
run. Add the generated deployment URL to `.env.local` as
`NEXT_PUBLIC_CONVEX_URL` and set `FIREBASE_PROJECT_ID` in the Convex dashboard
so `convex/auth.config.ts` can verify Firebase ID tokens.

## 4. Add AI credentials

```bash
GEMINI_API_KEY=your-google-ai-key
GEMINI_TEXT_MODEL=gemini-3.6-flash
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image
GEMINI_VIDEO_MODEL=veo-3.1
```

These power the Copilot, Nano Banana image generation, and video generation.

## 5. Run locally

```bash
corepack pnpm dev
```

Open http://localhost:3000. Without provider keys the studio runs in demo
mode: the canvas, Copilot chat, calendar, and asset library still work with
local persistence.

## 6. Deploy to Vercel

```bash
vercel login
vercel link
vercel env add
vercel --prod
```

Add every variable from `.env.local` that is not `NEXT_PUBLIC_`-prefixed as a
server environment variable in Vercel.

## Security notes

- Never put provider secrets in `NEXT_PUBLIC_*` variables or browser storage.
- Firebase client config is public by design; Firebase Admin and provider
  OAuth secrets belong on the server.
- Social OAuth refresh tokens are encrypted server-side before storage.
