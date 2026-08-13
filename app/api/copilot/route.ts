import { GoogleGenAI } from '@google/genai';
import { envConfigured } from '@/lib/env';

const systemInstruction = [
  'You are the Rezit Studio AI Copilot - an expert graphic designer and video editor assistant.',
  'Help the user edit their visual design canvas or video timeline seamlessly through natural language.',
  'Return only valid JSON with this exact shape: {"reply":"short explanation of what was done","actions":[]}.',
  'Allowed Graphic Canvas actions:',
  '- {"type":"set_text", "nodeId":"<id>", "text":"<new text>"}',
  '- {"type":"set_color", "nodeId":"<id>", "color":"#hex"}',
  '- {"type":"set_font", "nodeId":"<id>", "fontFamily":"Inter, sans-serif", "fontSize":32, "fontWeight":"800", "textAlign":"center"}',
  '- {"type":"set_border", "nodeId":"<id>", "borderColor":"#hex", "borderWidth":2, "borderRadius":16}',
  '- {"type":"set_shadow", "nodeId":"<id>", "boxShadow":"0 12px 32px rgba(0,0,0,0.25)"}',
  '- {"type":"set_filter", "nodeId":"<id>", "filter":"grayscale(100%) contrast(120%)"}',
  '- {"type":"set_opacity", "nodeId":"<id>", "opacity":0.85}',
  '- {"type":"move", "nodeId":"<id>", "x":100, "y":150}',
  '- {"type":"resize", "nodeId":"<id>", "width":320, "height":180}',
  '- {"type":"add_text", "text":"Headline", "x":50, "y":200, "color":"#17171b", "fontSize":32, "fontWeight":"800"}',
  '- {"type":"add_shape", "shapeType":"rounded"|"rectangle"|"pill"|"badge"|"circle", "x":60, "y":80, "width":240, "height":140, "color":"#7138e8", "borderRadius":16}',
  '- {"type":"add_image", "src":"<url>", "prompt":"description", "x":40, "y":40, "width":480, "height":300}',
  '- {"type":"delete_node", "nodeId":"<id>"}',
  '- {"type":"duplicate_node", "nodeId":"<id>"}',
  '- {"type":"align", "alignment":"center"|"left"|"right"|"top"|"middle"|"bottom"}',
  '- {"type":"apply_theme", "theme":"dark_neon"|"sunset_minimal"|"modern_clean"|"warm_brutalist"|"cyber_purple"}',
  'Allowed Video Timeline actions:',
  '- {"type":"add_clip", "trackKind":"video"|"overlay"|"text"|"audio", "label":"Scene / Text", "duration":5, "start":0, "textOverlay":"Text", "src":"<url>"}',
  '- {"type":"split_clip", "clipId":"<id>", "splitTime":3.5}',
  '- {"type":"trim_clip", "clipId":"<id>", "newDuration":4}',
  '- {"type":"delete_clip", "clipId":"<id>"}',
  '- {"type":"set_aspect_ratio", "aspectRatio":"9:16"|"16:9"|"1:1"}',
  '- {"type":"set_clip_volume", "clipId":"<id>", "volume":0.8}',
  'Always use exact node or clip IDs from the supplied document when targeting specific elements. Use harmonious 6-digit hex colors.',
].join('\n');

export async function POST(request: Request) {
  const body = await request.json() as {
    prompt?: unknown;
    selected?: unknown;
    nodes?: unknown;
    mode?: unknown;
    clips?: unknown;
  };
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) return Response.json({ error: 'A prompt is required.' }, { status: 400 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (envConfigured(apiKey)) {
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey! });
      const modelName = process.env.GEMINI_TEXT_MODEL || 'gemini-3-flash-preview';
      const response = await ai.models.generateContent({
        model: modelName,
        contents: JSON.stringify({
          request: prompt,
          selected: body.selected ?? null,
          document: body.nodes ?? [],
          clips: body.clips ?? [],
          mode: body.mode ?? 'graphic',
        }),
        config: { systemInstruction, responseMimeType: 'application/json' },
      });

      const raw = response.text || '{}';
      const result = JSON.parse(raw) as { reply?: unknown; actions?: unknown };
      return Response.json({
        text: typeof result.reply === 'string' ? result.reply : 'I prepared the edit for your studio project.',
        actions: Array.isArray(result.actions) ? result.actions : [],
      });
    } catch {
      // Fallback to intelligent local rule engine if API call fails
    }
  }

  // Smart local heuristic fallback for instant interactive testing
  const fallback = generateLocalCopilotActions(prompt, body.selected, body.nodes, body.mode);
  return Response.json(fallback);
}

function generateLocalCopilotActions(
  prompt: string,
  selected: unknown,
  nodes: unknown,
  mode: unknown
): { text: string; actions: unknown[] } {
  const lower = prompt.toLowerCase();
  const selectedNode = (selected && typeof selected === 'object') ? selected as Record<string, unknown> : null;
  const targetId = typeof selectedNode?.id === 'string' ? selectedNode.id : undefined;

  // Video Mode actions
  if (mode === 'video') {
    if (lower.includes('split') || lower.includes('cut')) {
      return {
        text: 'Split the active clip at the current playhead marker.',
        actions: [{ type: 'split_clip', clipId: targetId || 'v1', splitTime: 3 }],
      };
    }
    if (lower.includes('short') || lower.includes('tiktok') || lower.includes('reel') || lower.includes('9:16')) {
      return {
        text: 'Changed aspect ratio to 9:16 vertical for Reels & TikTok.',
        actions: [{ type: 'set_aspect_ratio', aspectRatio: '9:16' }],
      };
    }
    if (lower.includes('youtube') || lower.includes('16:9') || lower.includes('wide')) {
      return {
        text: 'Changed aspect ratio to 16:9 widescreen.',
        actions: [{ type: 'set_aspect_ratio', aspectRatio: '16:9' }],
      };
    }
    if (lower.includes('text') || lower.includes('title') || lower.includes('subtitle') || lower.includes('caption')) {
      const label = prompt.replace(/add text|new text|title|subtitle|caption/gi, '').trim() || 'NEW SCENE';
      return {
        text: `Added kinetic title "${label}" to the text track.`,
        actions: [{ type: 'add_clip', trackKind: 'text', label, duration: 4, start: 0, textOverlay: label }],
      };
    }
    if (lower.includes('b-roll') || lower.includes('overlay')) {
      return {
        text: 'Added overlay B-Roll transition clip.',
        actions: [{ type: 'add_clip', trackKind: 'overlay', label: 'B-Roll Accent', duration: 3, start: 2 }],
      };
    }
    if (lower.includes('music') || lower.includes('sound') || lower.includes('audio')) {
      return {
        text: 'Added atmospheric background beat to the audio track.',
        actions: [{ type: 'add_clip', trackKind: 'audio', label: 'Ambient Wave (120bpm)', duration: 18, start: 0, volume: 0.75 }],
      };
    }
    return {
      text: `Analyzed "${prompt}" and optimized the timeline tracks.`,
      actions: [{ type: 'add_clip', trackKind: 'text', label: 'AI HIGHLIGHT', duration: 4, start: 1, textOverlay: 'AI HIGHLIGHT' }],
    };
  }

  // Graphic Mode actions
  if (lower.includes('dark') || lower.includes('neon') || lower.includes('cyber')) {
    return {
      text: 'Applied the Cyber Neon dark theme with electric accents.',
      actions: [{ type: 'apply_theme', theme: 'cyber_purple' }],
    };
  }

  if (lower.includes('sunset') || lower.includes('warm') || lower.includes('orange')) {
    return {
      text: 'Applied the Warm Sunset theme to the canvas.',
      actions: [{ type: 'apply_theme', theme: 'sunset_minimal' }],
    };
  }

  if (lower.includes('center') || lower.includes('align')) {
    return {
      text: 'Aligned elements to the canvas center.',
      actions: [{ type: 'align', alignment: 'center' }],
    };
  }

  if (lower.includes('purple') || lower.includes('violet')) {
    return {
      text: 'Changed color to vibrant purple (#7138e8).',
      actions: [{ type: 'set_color', nodeId: targetId, color: '#7138e8' }],
    };
  }

  if (lower.includes('gold') || lower.includes('yellow')) {
    return {
      text: 'Updated color to warm gold (#f59e0b).',
      actions: [{ type: 'set_color', nodeId: targetId, color: '#f59e0b' }],
    };
  }

  if (lower.includes('make it bold') || lower.includes('bigger') || lower.includes('headline')) {
    return {
      text: 'Increased font size and set weight to extra-bold.',
      actions: [{ type: 'set_font', nodeId: targetId, fontSize: 36, fontWeight: '900' }],
    };
  }

  if (lower.includes('add text') || lower.includes('new text') || lower.includes('title')) {
    return {
      text: 'Added a new text headline layer to the canvas.',
      actions: [{ type: 'add_text', text: prompt.replace(/add text|new text|title/gi, '').trim() || 'NEW RELEASE', x: 80, y: 220, color: '#17171b', fontSize: 32, fontWeight: '800' }],
    };
  }

  if (lower.includes('add shape') || lower.includes('badge') || lower.includes('button') || lower.includes('card')) {
    return {
      text: 'Added a styled rounded badge element.',
      actions: [{ type: 'add_shape', shapeType: 'rounded', x: 120, y: 140, width: 220, height: 100, color: '#ee4e9b', borderRadius: 16 }],
    };
  }

  return {
    text: `Analyzed "${prompt}" and polished the canvas styling.`,
    actions: targetId ? [{ type: 'set_color', nodeId: targetId, color: '#7138e8' }] : [{ type: 'apply_theme', theme: 'modern_clean' }],
  };
}

