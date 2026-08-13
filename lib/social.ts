import type { SocialProvider } from './types';

export type { SocialProvider };

export const socialProviders: Array<{ id: SocialProvider; label: string }> = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'x', label: 'X (Twitter)' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'tiktok', label: 'TikTok' },
];

export function redirectUri(provider: SocialProvider, base: string): string {
  return `${base}/api/social/${provider}/callback`;
}

export function buildAuthorizeUrl(provider: SocialProvider, clientId: string, base: string): string {
  const redirect = encodeURIComponent(redirectUri(provider, base));
  switch (provider) {
    case 'linkedin':
      return 'https://www.linkedin.com/oauth/v2/authorization'
        + `?client_id=${clientId}`
        + `&redirect_uri=${redirect}`
        + '&response_type=code'
        + '&scope='
        + encodeURIComponent('openid profile email w_member_social');
    case 'youtube':
      return 'https://accounts.google.com/o/oauth2/v2/auth'
        + `?client_id=${clientId}`
        + `&redirect_uri=${redirect}`
        + '&response_type=code'
        + '&access_type=offline'
        + '&prompt=consent'
        + '&scope='
        + encodeURIComponent([
          'https://www.googleapis.com/auth/youtube.upload',
          'https://www.googleapis.com/auth/youtube.readonly',
          'https://www.googleapis.com/auth/yt-analytics.readonly',
          'openid',
        ].join(' '));
    case 'tiktok':
      return 'https://www.tiktok.com/v2/auth/authorize/'
        + `?client_key=${clientId}`
        + `&redirect_uri=${redirect}`
        + '&response_type=code'
        + '&scope='
        + encodeURIComponent('user.info.basic,user.info.profile,user.info.stats,video.list,video.publish,video.upload');
    case 'facebook':
    case 'instagram':
      return 'https://www.facebook.com/v20.0/dialog/oauth'
        + `?client_id=${clientId}`
        + `&redirect_uri=${redirect}`
        + '&response_type=code'
        + '&scope='
        + encodeURIComponent('pages_show_list,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish');
    case 'x':
      return 'https://twitter.com/i/oauth2/authorize'
        + `?client_id=${clientId}`
        + `&redirect_uri=${redirect}`
        + '&response_type=code'
        + '&state=resit'
        + '&code_challenge=resit'
        + '&code_challenge_method=plain'
        + '&scope='
        + encodeURIComponent('tweet.write tweet.read users.read media.write offline.access');
  }
}

export function clientIdEnv(provider: SocialProvider): string {
  switch (provider) {
    case 'linkedin': return 'LINKEDIN_CLIENT_ID';
    case 'youtube': return 'YOUTUBE_CLIENT_ID';
    case 'tiktok': return 'TIKTOK_CLIENT_KEY';
    case 'facebook':
    case 'instagram': return 'META_APP_ID';
    case 'x': return 'X_CLIENT_ID';
  }
}

