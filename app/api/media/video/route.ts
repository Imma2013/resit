import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'Veo is not configured. Add GEMINI_API_KEY to the server environment.' },
      { status: 503 },
    );
  }

  const body = await request.json() as { prompt?: unknown; duration?: unknown };
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) return Response.json({ error: 'A prompt is required.' }, { status: 400 });

  const duration = typeof body.duration === 'number' && body.duration >= 4 && body.duration <= 8 ? Math.round(body.duration) : 6;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const operation = await ai.models.generateVideos({
      model: process.env.GEMINI_VIDEO_MODEL || 'veo-3.1',
      prompt,
      config: { numberOfVideos: 1, durationSeconds: duration },
    });
    const uri = operation.response?.generatedVideos?.[0]?.video?.uri || null;
    if (!uri) return Response.json({ error: 'Veo returned no video.' }, { status: 502 });
    return Response.json({ uri });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Veo generation failed.' }, { status: 502 });
  }
}
