import type { DesignNode, ShapeType } from './types';

export type EditorAction =
  | { type: 'set_text'; nodeId?: string; text: string }
  | { type: 'set_color'; nodeId?: string; color: string }
  | { type: 'set_font'; nodeId?: string; fontFamily?: string; fontSize?: number; fontWeight?: string; textAlign?: 'left' | 'center' | 'right'; letterSpacing?: number; lineHeight?: number }
  | { type: 'set_border'; nodeId?: string; borderColor?: string; borderWidth?: number; borderRadius?: number }
  | { type: 'set_shadow'; nodeId?: string; boxShadow?: string }
  | { type: 'set_filter'; nodeId?: string; filter?: string }
  | { type: 'set_opacity'; nodeId?: string; opacity: number }
  | { type: 'set_z_index'; nodeId?: string; zIndex: number }
  | { type: 'move'; nodeId?: string; x: number; y: number }
  | { type: 'resize'; nodeId?: string; width: number; height: number }
  | { type: 'add_text'; text: string; x?: number; y?: number; color?: string; fontSize?: number; fontWeight?: string; fontFamily?: string }
  | { type: 'add_shape'; shapeType?: ShapeType; x?: number; y?: number; width?: number; height?: number; color?: string; borderRadius?: number; borderColor?: string; borderWidth?: number }
  | { type: 'add_image'; src?: string; prompt?: string; x?: number; y?: number; width?: number; height?: number; filter?: string }
  | { type: 'delete_node'; nodeId: string }
  | { type: 'duplicate_node'; nodeId: string }
  | { type: 'align'; alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'; nodeIds?: string[] }
  | { type: 'apply_theme'; theme: 'dark_neon' | 'sunset_minimal' | 'modern_clean' | 'warm_brutalist' | 'cyber_purple' };

export const PRESET_THEMES: Record<string, { bg: string; primary: string; secondary: string; accent: string; text: string }> = {
  dark_neon: { bg: '#0b0c10', primary: '#1f2833', secondary: '#45a29e', accent: '#66fcf1', text: '#ffffff' },
  sunset_minimal: { bg: '#fff7f0', primary: '#ff6b6b', secondary: '#feca57', accent: '#ee5253', text: '#222f3e' },
  modern_clean: { bg: '#f8fafc', primary: '#0f172a', secondary: '#3b82f6', accent: '#6366f1', text: '#1e293b' },
  warm_brutalist: { bg: '#fdf6e2', primary: '#2d3436', secondary: '#e17055', accent: '#d63031', text: '#2d3436' },
  cyber_purple: { bg: '#0d0221', primary: '#240046', secondary: '#7b2cbf', accent: '#ff9e00', text: '#ffffff' },
};

export function applyEditorActions(nodes: DesignNode[], actions: unknown[], selectedNodeId?: string): { nodes: DesignNode[]; applied: number } {
  let next = [...nodes];
  let applied = 0;

  for (const value of actions) {
    if (!isRecord(value) || typeof value.type !== 'string') continue;
    const action = value as Record<string, unknown>;
    const targetId = (typeof action.nodeId === 'string' && action.nodeId) ? action.nodeId : selectedNodeId;

    switch (action.type) {
      case 'set_text': {
        if (targetId && typeof action.text === 'string') {
          next = next.map((n) => n.id === targetId ? { ...n, text: action.text as string } : n);
          applied += 1;
        }
        break;
      }
      case 'set_color': {
        if (typeof action.color === 'string') {
          if (targetId) {
            next = next.map((n) => n.id === targetId ? { ...n, color: action.color as string } : n);
          } else {
            // Apply to first shape or background if nothing selected
            next = next.map((n) => n.kind === 'shape' ? { ...n, color: action.color as string } : n);
          }
          applied += 1;
        }
        break;
      }
      case 'set_font': {
        if (targetId) {
          next = next.map((n) => {
            if (n.id !== targetId) return n;
            return {
              ...n,
              fontFamily: typeof action.fontFamily === 'string' ? action.fontFamily : n.fontFamily,
              fontSize: isFiniteNumber(action.fontSize) ? (action.fontSize as number) : n.fontSize,
              fontWeight: typeof action.fontWeight === 'string' ? action.fontWeight : n.fontWeight,
              textAlign: isTextAlign(action.textAlign) ? action.textAlign : n.textAlign,
              letterSpacing: isFiniteNumber(action.letterSpacing) ? (action.letterSpacing as number) : n.letterSpacing,
              lineHeight: isFiniteNumber(action.lineHeight) ? (action.lineHeight as number) : n.lineHeight,
            };
          });
          applied += 1;
        }
        break;
      }
      case 'set_border': {
        if (targetId) {
          next = next.map((n) => {
            if (n.id !== targetId) return n;
            return {
              ...n,
              borderColor: typeof action.borderColor === 'string' ? action.borderColor : n.borderColor,
              borderWidth: isFiniteNumber(action.borderWidth) ? (action.borderWidth as number) : n.borderWidth,
              borderRadius: isFiniteNumber(action.borderRadius) ? (action.borderRadius as number) : n.borderRadius,
            };
          });
          applied += 1;
        }
        break;
      }
      case 'set_shadow': {
        if (targetId && typeof action.boxShadow === 'string') {
          next = next.map((n) => n.id === targetId ? { ...n, boxShadow: action.boxShadow as string } : n);
          applied += 1;
        }
        break;
      }
      case 'set_filter': {
        if (targetId && typeof action.filter === 'string') {
          next = next.map((n) => n.id === targetId ? { ...n, filter: action.filter as string } : n);
          applied += 1;
        }
        break;
      }
      case 'set_opacity': {
        if (targetId && isFiniteNumber(action.opacity)) {
          next = next.map((n) => n.id === targetId ? { ...n, opacity: clamp(action.opacity as number, 0, 1) } : n);
          applied += 1;
        }
        break;
      }
      case 'move': {
        if (targetId && isFiniteNumber(action.x) && isFiniteNumber(action.y)) {
          next = next.map((n) => n.id === targetId ? { ...n, x: clamp(action.x as number, 0, 560), y: clamp(action.y as number, 0, 560) } : n);
          applied += 1;
        }
        break;
      }
      case 'resize': {
        if (targetId && isFiniteNumber(action.width) && isFiniteNumber(action.height)) {
          next = next.map((n) => n.id === targetId ? { ...n, width: clamp(action.width as number, 16, 560), height: clamp(action.height as number, 16, 560) } : n);
          applied += 1;
        }
        break;
      }
      case 'add_text': {
        if (typeof action.text === 'string') {
          const x = isFiniteNumber(action.x) ? clamp(action.x as number, 0, 500) : 40;
          const y = isFiniteNumber(action.y) ? clamp(action.y as number, 0, 500) : 200;
          const fontSize = isFiniteNumber(action.fontSize) ? (action.fontSize as number) : 28;
          const color = typeof action.color === 'string' ? action.color : '#17171b';
          const fontFamily = typeof action.fontFamily === 'string' ? action.fontFamily : 'Inter, sans-serif';
          const fontWeight = typeof action.fontWeight === 'string' ? action.fontWeight : '700';
          next.push({
            id: `text-${Date.now()}-${applied}`,
            kind: 'text',
            text: action.text,
            x,
            y,
            width: 320,
            height: 60,
            fontSize,
            color,
            fontFamily,
            fontWeight,
            textAlign: 'left',
          });
          applied += 1;
        }
        break;
      }
      case 'add_shape': {
        const x = isFiniteNumber(action.x) ? clamp(action.x as number, 0, 500) : 60;
        const y = isFiniteNumber(action.y) ? clamp(action.y as number, 0, 500) : 60;
        const width = isFiniteNumber(action.width) ? clamp(action.width as number, 20, 560) : 200;
        const height = isFiniteNumber(action.height) ? clamp(action.height as number, 20, 560) : 120;
        const color = typeof action.color === 'string' ? action.color : '#7138e8';
        const borderRadius = isFiniteNumber(action.borderRadius) ? (action.borderRadius as number) : 12;
        const shapeType = (action.shapeType as ShapeType) || 'rounded';
        next.push({
          id: `shape-${Date.now()}-${applied}`,
          kind: 'shape',
          shapeType,
          x,
          y,
          width,
          height,
          color,
          borderRadius,
        });
        applied += 1;
        break;
      }
      case 'add_image': {
        const x = isFiniteNumber(action.x) ? clamp(action.x as number, 0, 500) : 40;
        const y = isFiniteNumber(action.y) ? clamp(action.y as number, 0, 500) : 40;
        const width = isFiniteNumber(action.width) ? clamp(action.width as number, 40, 560) : 480;
        const height = isFiniteNumber(action.height) ? clamp(action.height as number, 40, 560) : 320;
        const src = typeof action.src === 'string' ? action.src : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
        next.push({
          id: `image-${Date.now()}-${applied}`,
          kind: 'image',
          src,
          prompt: typeof action.prompt === 'string' ? action.prompt : undefined,
          filter: typeof action.filter === 'string' ? action.filter : undefined,
          x,
          y,
          width,
          height,
          borderRadius: 8,
        });
        applied += 1;
        break;
      }
      case 'delete_node': {
        if (targetId) {
          next = next.filter((n) => n.id !== targetId);
          applied += 1;
        }
        break;
      }
      case 'duplicate_node': {
        if (targetId) {
          const original = next.find((n) => n.id === targetId);
          if (original) {
            next.push({
              ...original,
              id: `${original.kind}-${Date.now()}-${applied}`,
              x: clamp(original.x + 20, 0, 520),
              y: clamp(original.y + 20, 0, 520),
            });
            applied += 1;
          }
        }
        break;
      }
      case 'align': {
        const alignment = action.alignment;
        if (typeof alignment === 'string') {
          const targets = next.filter((n) => !action.nodeIds || (Array.isArray(action.nodeIds) && action.nodeIds.includes(n.id)));
          if (targets.length > 0) {
            next = next.map((n) => {
              if (action.nodeIds && Array.isArray(action.nodeIds) && !action.nodeIds.includes(n.id)) return n;
              if (alignment === 'center') return { ...n, x: Math.round((560 - n.width) / 2) };
              if (alignment === 'left') return { ...n, x: 40 };
              if (alignment === 'right') return { ...n, x: 560 - n.width - 40 };
              if (alignment === 'top') return { ...n, y: 40 };
              if (alignment === 'middle') return { ...n, y: Math.round((560 - n.height) / 2) };
              if (alignment === 'bottom') return { ...n, y: 560 - n.height - 40 };
              return n;
            });
            applied += 1;
          }
        }
        break;
      }
      case 'apply_theme': {
        const themeKey = typeof action.theme === 'string' ? action.theme : 'dark_neon';
        const theme = PRESET_THEMES[themeKey] || PRESET_THEMES.dark_neon;
        next = next.map((n) => {
          if (n.kind === 'shape') {
            return { ...n, color: theme.primary, borderColor: theme.accent, borderWidth: 1 };
          }
          if (n.kind === 'text') {
            return { ...n, color: theme.accent };
          }
          return n;
        });
        applied += 1;
        break;
      }
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

function isTextAlign(value: unknown): value is 'left' | 'center' | 'right' {
  return value === 'left' || value === 'center' || value === 'right';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

