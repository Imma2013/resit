import { redirectUri, type SocialProvider } from '@/lib/social';

async function exchangeToken(provider: SocialProvider, code: string, base: string): Promise<{ accessToken: string; refreshToken?: string; accountId?: string; name?: string }> {
  switch (provider) {
    case 'youtube': {
      const clientId = process.env.YOUTUBE_CLIENT_ID!;
      const clientSecret = process.env.YOUTUBE_CLIENT_SECRET!;
      const body = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri('youtube', base),
        grant_type: 'authorization_code',
      });
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
      });
      const data = await response.json() as { access_token?: string; refresh_token?: string; error?: string };
      if (!data.access_token) throw new Error(data.error || 'YouTube token exchange failed');
      return { accessToken: data.access_token, refreshToken: data.refresh_token };
    }
    case 'tiktok': {
      const body = new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri('tiktok', base),
      });
      const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
      });
      const data = await response.json() as { access_token?: string; refresh_token?: string; error?: string };
      if (!data.access_token) throw new Error(data.error || 'TikTok token exchange failed');
      return { accessToken: data.access_token, refreshToken: data.refresh_token };
    }
    case 'facebook':
    case 'instagram': {
      const appId = process.env.META_APP_ID!;
      const appSecret = process.env.META_APP_SECRET!;
      const short = await (await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri(provider, base))}&code=${code}`)).json() as { access_token?: string; error?: { message?: string } };
      if (!short.access_token) throw new Error(short.error?.message || 'Meta token exchange failed');
      const long = await (await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${short.access_token}`)).json() as { access_token?: string; error?: { message?: string } };
      if (!long.access_token) throw new Error(long.error?.message || 'Meta long-lived token exchange failed');
      return { accessToken: long.access_token, refreshToken: long.access_token };
    }
    case 'linkedin': {
      const clientId = process.env.LINKEDIN_CLIENT_ID!;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri('linkedin', base),
      });
      const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
      });
      const data = await response.json() as { access_token?: string; refresh_token?: string; error?: string };
      if (!data.access_token) throw new Error(data.error || 'LinkedIn token exchange failed');
      return { accessToken: data.access_token, refreshToken: data.refresh_token };
    }
    case 'x': {
      const body = new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: process.env.X_CLIENT_ID!,
        redirect_uri: redirectUri('x', base),
        code_verifier: 'resit',
      });
      const response = await fetch('https://api.x.com/2/oauth2/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
      });
      const data = await response.json() as { access_token?: string; refresh_token?: string; error?: string };
      if (!data.access_token) throw new Error(data.error || 'X token exchange failed');
      return { accessToken: data.access_token, refreshToken: data.refresh_token };
    }
    default:
      throw new Error(`Unsupported social provider`);
  }
}

export async function GET(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error) return Response.redirect(`${base}/calendar?connect=error&provider=${provider}`, 302);
  if (!code) return Response.redirect(`${base}/calendar?connect=missing&provider=${provider}`, 302);

  try {
    const tokens = await exchangeToken(provider as SocialProvider, code, base);
    return Response.redirect(`${base}/calendar?connect=success&provider=${provider}&account=${encodeURIComponent(tokens.name || '')}`, 302);
  } catch (exchangeError) {
    return Response.redirect(`${base}/calendar?connect=error&provider=${provider}`, 302);
  }
}