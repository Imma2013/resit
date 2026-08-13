import { GoogleGenAI } from '@google/genai';
import { envConfigured } from '@/lib/env';

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!envConfigured(apiKey)) {
    return Response.json(
      { error: 'Nano Banana is not configured. Add GEMINI_API_KEY to the server environment.' },
      { status: 503 },
    );
  }

  const body = await request.json() as { prompt?: unknown };
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) return Response.json({ error: 'A prompt is required.' }, { status: 400 });

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image',
    contents: prompt,
    config: { responseModalities: ['IMAGE'] },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((part) => part.inlineData?.data);
  if (!imagePart?.inlineData?.data) {
    return Response.json({ error: 'Nano Banana returned no image.' }, { status: 502 });
  }

  return Response.json({
    mimeType: imagePart.inlineData.mimeType || 'image/png',
    dataUrl: `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`,
  });
}
