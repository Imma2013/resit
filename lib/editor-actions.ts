import type { DesignNode } from './types';

export type EditorAction =
  | { type: 'set_text'; nodeId: string; text: string }
  | { type: 'set_color'; nodeId: string; color: string }
  | { type: 'move'; nodeId: string; x: number; y: number }
  | { type: 'resize'; nodeId: string; width: number; height: number }
  | { type: 'add_text'; text: string; x: number; y: number; color?: string }
  | { type: 'add_shape'; x: number; y: number; width?: number; height?: number; color?: string };

export function applyEditorActions(nodes: DesignNode[], actions: unknown[]): { nodes: DesignNode[]; applied: number } {
  let next = nodes;
  let applied = 0;

  for (const value of actions) {
    if (!isRecord(value) || typeof value.type !== 'string') continue;
    const action = value as Record<string, unknown>;
    if (action.type === 'set_text' && typeof action.nodeId === 'string' && typeof action.text === 'string') {
      const nodeId = action.nodeId;
      const text = action.text;
      next = next.map((node) => node.id === nodeId ? { ...node, text } : node);
      applied += 1;
    } else if (action.type === 'set_color' && typeof action.nodeId === 'string' && isColor(action.color)) {
      const nodeId = action.nodeId;
      const color = action.color;
      next = next.map((node) => node.id === nodeId ? { ...node, color } : node);
      applied += 1;
    } else if (action.type === 'move' && typeof action.nodeId === 'string' && isFiniteNumber(action.x) && isFiniteNumber(action.y)) {
      const nodeId = action.nodeId;
      const x = action.x;
      const y = action.y;
      next = next.map((node) => node.id === nodeId ? { ...node, x: clamp(x, 0, 560), y: clamp(y, 0, 560) } : node);
      applied += 1;
    } else if (action.type === 'resize' && typeof action.nodeId === 'string' && isFiniteNumber(action.width) && isFiniteNumber(action.height)) {
      const nodeId = action.nodeId;
      const width = action.width;
      const height = action.height;
      next = next.map((node) => node.id === nodeId ? { ...node, width: clamp(width, 24, 560), height: clamp(height, 24, 560) } : node);
      applied += 1;
    } else if (action.type === 'add_text' && typeof action.text === 'string' && isFiniteNumber(action.x) && isFiniteNumber(action.y)) {
      const x = action.x;
      const y = action.y;
      const text = action.text;
      next = [...next, { id: `ai-text-${Date.now()}-${applied}`, kind: 'text', x: clamp(x, 0, 560), y: clamp(y, 0, 560), width: 250, height: 48, text, color: isColor(action.color) ? action.color : '#17171b' }];
      applied += 1;
    } else if (action.type === 'add_shape' && isFiniteNumber(action.x) && isFiniteNumber(action.y)) {
      const x = action.x;
      const y = action.y;
      const width = isFiniteNumber(action.width) ? action.width : 160;
      const height = isFiniteNumber(action.height) ? action.height : 100;
      next = [...next, { id: `ai-shape-${Date.now()}-${applied}`, kind: 'shape', x: clamp(x, 0, 560), y: clamp(y, 0, 560), width: clamp(width, 24, 560), height: clamp(height, 24, 560), color: isColor(action.color) ? action.color : '#7138e8' }];
      applied += 1;
    }
  }

  return { nodes: next, applied };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
