import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const listPosts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query('users').withIndex('by_firebase_uid', (q) => q.eq('firebaseUid', identity.subject)).unique();
    if (!user) return [];
    return ctx.db.query('scheduledPosts').withIndex('by_owner_schedule', (q) => q.eq('ownerId', user._id)).collect();
  },
});

export const createPost = mutation({
  args: {
    title: v.optional(v.string()),
    caption: v.string(),
    channels: v.array(v.string()),
    assetIds: v.array(v.string()),
    mediaType: v.optional(v.union(v.literal('image'), v.literal('video'))),
    mediaUrl: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
    timezone: v.string(),
    status: v.union(v.literal('draft'), v.literal('scheduled'), v.literal('publishing'), v.literal('published'), v.literal('failed')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Authentication required');
    const user = await ctx.db.query('users').withIndex('by_firebase_uid', (q) => q.eq('firebaseUid', identity.subject)).unique();
    if (!user) throw new Error('User not found');
    return ctx.db.insert('scheduledPosts', {
      ownerId: user._id,
      title: args.title,
      caption: args.caption,
      channels: args.channels,
      assetIds: args.assetIds,
      mediaType: args.mediaType,
      mediaUrl: args.mediaUrl,
      scheduledAt: args.scheduledAt,
      timezone: args.timezone,
      status: args.status,
    });
  },
});

export const updatePostStatus = mutation({
  args: {
    postId: v.id('scheduledPosts'),
    status: v.union(v.literal('draft'), v.literal('scheduled'), v.literal('publishing'), v.literal('published'), v.literal('failed')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Authentication required');
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error('Post not found');
    const user = await ctx.db.query('users').withIndex('by_firebase_uid', (q) => q.eq('firebaseUid', identity.subject)).unique();
    if (!user || user._id !== post.ownerId) throw new Error('Not authorized');
    await ctx.db.patch(args.postId, { status: args.status });
    return args.postId;
  },
});

export const deletePost = mutation({
  args: { postId: v.id('scheduledPosts') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Authentication required');
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error('Post not found');
    const user = await ctx.db.query('users').withIndex('by_firebase_uid', (q) => q.eq('firebaseUid', identity.subject)).unique();
    if (!user || user._id !== post.ownerId) throw new Error('Not authorized');
    await ctx.db.delete(args.postId);
  },
});
