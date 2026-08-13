const PLACEHOLDER_VALUES = new Set(['set-in-vercel-dashboard', 'set-after-convex-deploy', 'add-your-value']);

export function envConfigured(value: string | undefined): boolean {
  return typeof value === 'string' && value.length > 0 && !PLACEHOLDER_VALUES.has(value);
}