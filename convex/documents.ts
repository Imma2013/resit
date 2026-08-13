import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const createProject = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Authentication required');
    const existing = await ctx.db.query('users').withIndex('by_firebase_uid', (q) => q.eq('firebaseUid', identity.subject)).unique();
    const ownerId = existing?._id ?? await ctx.db.insert('users', { firebaseUid: identity.subject });
    const projectId = await ctx.db.insert('projects', { ownerId, name: args.name, mode: 'graphic', updatedAt: Date.now() });
    await ctx.db.insert('documents', { projectId, version: 1, width: 560, height: 560, nodes: [], updatedAt: Date.now() });
    return projectId;
  },
});

export const saveDocument = mutation({
  args: {
    projectId: v.id('projects'),
    nodes: v.array(v.any()),
    width: v.number(),
    height: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Authentication required');
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error('Project not found');
    const user = await ctx.db.query('users').withIndex('by_firebase_uid', (q) => q.eq('firebaseUid', identity.subject)).unique();
    if (!user || user._id !== project.ownerId) throw new Error('Not authorized');
    const latest = await ctx.db.query('documents').withIndex('by_project', (q) => q.eq('projectId', args.projectId)).order('desc').first();
    return ctx.db.insert('documents', {
      projectId: args.projectId,
      version: (latest?.version ?? 0) + 1,
      nodes: args.nodes,
      width: args.width,
      height: args.height,
      updatedAt: Date.now(),
    });
  },
});

export const getDocument = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return ctx.db.query('documents').withIndex('by_project', (q) => q.eq('projectId', args.projectId)).order('desc').first();
  },
});
