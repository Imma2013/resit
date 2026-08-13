import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return ctx.db.query('users').withIndex('by_firebase_uid', (q) => q.eq('firebaseUid', identity.subject)).unique();
  },
});

export const store = mutation({
  args: { email: v.optional(v.string()), displayName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Authentication required');
    const existing = await ctx.db.query('users').withIndex('by_firebase_uid', (q) => q.eq('firebaseUid', identity.subject)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return ctx.db.insert('users', { firebaseUid: identity.subject, ...args });
  },
});
