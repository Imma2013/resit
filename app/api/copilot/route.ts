import { GoogleGenAI } from '@google/genai';
import { envConfigured } from '@/lib/env';

const systemInstruction = [
  'You are the Resit Studio Copilot.',
  'Help the user edit a visual design without taking control away from manual editing.',
  'Use the supplied document context to give concise, actionable design advice.',
  'Return only JSON with this shape: {"reply":"short explanation","actions":[]}.',
  'Allowed actions: set_text(nodeId,text), set_color(nodeId,color), move(nodeId,x,y), resize(nodeId,width,height), add_text(text,x,y,color), add_shape(x,y,width,height,color).',
  'Only use exact node IDs from the supplied document. Use valid six-digit hex colors and finite canvas coordinates.',
].join(' ');

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!envConfigured(apiKey)) {
    return Response.json(
      { error: 'Gemini is not configured. Add GEMINI_API_KEY to the server environment.' },
      { status: 503 },
    );
  }

  const body = await request.json() as {
    prompt?: unknown;
    selected?: unknown;
    nodes?: unknown;
  };
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) return Response.json({ error: 'A prompt is required.' }, { status: 400 });

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_TEXT_MODEL || 'gemini-3.6-flash',
    contents: JSON.stringify({
      request: prompt,
      selected: body.selected ?? null,
      document: body.nodes ?? [],
    }),
    config: { systemInstruction, responseMimeType: 'application/json' },
  });

  const raw = response.text || '{}';
  try {
    const result = JSON.parse(raw) as { reply?: unknown; actions?: unknown };
    return Response.json({
      text: typeof result.reply === 'string' ? result.reply : 'I prepared an edit for the current design.',
      actions: Array.isArray(result.actions) ? result.actions : [],
    });
  } catch {
    return Response.json({ text: raw, actions: [] });
  }
}
