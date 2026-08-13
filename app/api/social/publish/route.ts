import { NextResponse } from 'next/server';
import type { SocialProvider } from '@/lib/types';

type PublishRequest = {
  title?: string;
  caption: string;
  channels: SocialProvider[];
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  scheduledAt?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PublishRequest;
    const { title, caption, channels, mediaType, mediaUrl, scheduledAt } = body;

    if (!caption && !mediaUrl) {
      return NextResponse.json({ error: 'Caption or media is required to publish.' }, { status: 400 });
    }

    if (!channels || channels.length === 0) {
      return NextResponse.json({ error: 'At least one social channel must be selected.' }, { status: 400 });
    }

    const results: Array<{
      provider: SocialProvider;
      status: 'published' | 'scheduled' | 'failed';
      postId?: string;
      message: string;
    }> = [];

    const isScheduled = typeof scheduledAt === 'number' && scheduledAt > Date.now();

    for (const provider of channels) {
      // Platform-specific verification
      switch (provider) {
        case 'x': {
          if (caption.length > 280) {
            results.push({
              provider: 'x',
              status: 'failed',
              message: 'X (Twitter) posts cannot exceed 280 characters.',
            });
            continue;
          }
          break;
        }
        case 'instagram': {
          if (!mediaUrl && !mediaType) {
            results.push({
              provider: 'instagram',
              status: 'failed',
              message: 'Instagram requires an image or video attachment.',
            });
            continue;
          }
          break;
        }
        case 'youtube': {
          if (mediaType !== 'video') {
            results.push({
              provider: 'youtube',
              status: 'failed',
              message: 'YouTube requires a video attachment.',
            });
            continue;
          }
          break;
        }
        case 'tiktok': {
          if (!mediaUrl && !mediaType) {
            results.push({
              provider: 'tiktok',
              status: 'failed',
              message: 'TikTok requires media attachments.',
            });
            continue;
          }
          break;
        }
      }

      // Simulate or dispatch platform API calls
      const mockPostId = `post-${provider}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      results.push({
        provider,
        status: isScheduled ? 'scheduled' : 'published',
        postId: mockPostId,
        message: isScheduled
          ? `Queued for ${new Date(scheduledAt).toLocaleString()}`
          : `Successfully published to ${provider.toUpperCase()}`,
      });
    }

    const hasSuccess = results.some((r) => r.status === 'published' || r.status === 'scheduled');

    return NextResponse.json({
      success: hasSuccess,
      results,
      title,
      caption,
      mediaType,
      mediaUrl,
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Unknown publishing error';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
