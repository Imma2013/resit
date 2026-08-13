import { GoogleGenAI } from '@google/genai';

const systemInstruction = [
  'You are the Resit Studio Copilot.',
  'Help the user edit a visual design without taking control away from manual editing.',
  'Use the supplied document context to give concise, actionable design advice.',
  'Do not claim that an edit was committed. Describe proposed changes until the editor mutation tools are connected.',
].join(' ');

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
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
    config: { systemInstruction },
  });

  return Response.json({ text: response.text || 'Gemini returned no text.' });
}
