import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const listAccounts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query('users').withIndex('by_firebase_uid', (q) => q.eq('firebaseUid', identity.subject)).unique();
    if (!user) return [];
    return ctx.db.query('socialAccounts').withIndex('by_owner', (q) => q.eq('ownerId', user._id)).collect();
  },
});

export const connectAccount = mutation({
  args: {
    provider: v.union(
      v.literal('youtube'),
      v.literal('tiktok'),
      v.literal('facebook'),
      v.literal('instagram'),
      v.literal('x'),
      v.literal('linkedin')
    ),
    externalAccountId: v.string(),
    displayName: v.string(),
    encryptedRefreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Authentication required');
    const user = await ctx.db.query('users').withIndex('by_firebase_uid', (q) => q.eq('firebaseUid', identity.subject)).unique();
    if (!user) throw new Error('User not found');
    const existing = await ctx.db
      .query('socialAccounts')
      .withIndex('by_owner', (q) => q.eq('ownerId', user._id))
      .filter((q) => q.eq(q.field('provider'), args.provider) && q.eq(q.field('externalAccountId'), args.externalAccountId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        displayName: args.displayName,
        encryptedRefreshToken: args.encryptedRefreshToken,
        expiresAt: args.expiresAt,
      });
      return existing._id;
    }
    return ctx.db.insert('socialAccounts', { ownerId: user._id, ...args });
  },
});

export const disconnectAccount = mutation({
  args: { accountId: v.id('socialAccounts') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Authentication required');
    const account = await ctx.db.get(args.accountId);
    if (!account) throw new Error('Account not found');
    const user = await ctx.db.query('users').withIndex('by_firebase_uid', (q) => q.eq('firebaseUid', identity.subject)).unique();
    if (!user || user._id !== account.ownerId) throw new Error('Not authorized');
    await ctx.db.delete(args.accountId);
  },
});
