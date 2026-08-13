# Resit

Resit is an open-source, AI-native creative studio for graphics, video, and social publishing.

The product is being built as a new application. The local `open-design`, `palmier-pro`, and `postiz-app` repositories are references only and are not runtime dependencies.

## Stack

- Next.js, React, and TypeScript
- Firebase Authentication
- Convex for application data and realtime state
- Gemini Flash for the AI Copilot
- Nano Banana for image generation and editing
- Veo for video generation
- Vercel for web hosting and workflows
- GitHub for source control

## BYOK and self-hosting

Resit is designed for bring-your-own-key deployments. Provider credentials belong in the server environment or an encrypted server-side credential store. Never put secret provider credentials in `NEXT_PUBLIC_*` variables or browser storage.

```bash
corepack enable
corepack pnpm install
corepack pnpm setup
corepack pnpm dev
```

The setup wizard creates `.env.local` from `.env.example`:

```bash
corepack pnpm setup
```

Configure Firebase and Convex before using authenticated features:

```bash
firebase login
firebase use <firebase-project-id>
corepack pnpm convex:dev
```

Set `FIREBASE_PROJECT_ID` in the Convex environment as well as the public
Firebase web configuration. Convex verifies Firebase ID tokens using the
Firebase issuer, audience, and Google JWKS configuration in
`convex/auth.config.ts`.

Convex generates its typed `convex/_generated` files after the first successful
deployment. The web TypeScript project intentionally excludes that generated
directory until a deployment exists; Convex validates its own functions during
`convex dev` and `convex deploy`.

## Development

```bash
corepack pnpm dev
corepack pnpm typecheck
corepack pnpm build
```

## License

Resit is licensed under Apache-2.0. See `LICENSE`.
