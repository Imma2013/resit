import { buildAuthorizeUrl, clientIdEnv, socialProviders } from '@/lib/social';

export async function GET(_request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  const match = socialProviders.find((item) => item.id === provider);
  if (!match) return Response.json({ error: `Unknown provider: ${provider}` }, { status: 400 });

  const clientId = process.env[clientIdEnv(match.id)];
  if (!clientId) {
    return Response.json(
      { error: `${match.label} is not configured. Set ${clientIdEnv(match.id)} in the server environment.` },
      { status: 503 },
    );
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return Response.json({ url: buildAuthorizeUrl(match.id, clientId, base), provider: match.id });
}
