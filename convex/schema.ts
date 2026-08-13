import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    firebaseUid: v.string(),
    email: v.optional(v.string()),
    displayName: v.optional(v.string()),
  }).index('by_firebase_uid', ['firebaseUid']),
  projects: defineTable({
    ownerId: v.id('users'),
    name: v.string(),
    mode: v.union(v.literal('graphic'), v.literal('video'), v.literal('calendar')),
    updatedAt: v.number(),
  }).index('by_owner', ['ownerId']),
  documents: defineTable({
    projectId: v.id('projects'),
    version: v.number(),
    width: v.number(),
    height: v.number(),
    nodes: v.array(v.any()),
    updatedAt: v.number(),
  }).index('by_project', ['projectId']),
  aiJobs: defineTable({
    ownerId: v.id('users'),
    projectId: v.optional(v.id('projects')),
    kind: v.union(v.literal('image'), v.literal('video'), v.literal('copilot')),
    status: v.union(v.literal('queued'), v.literal('running'), v.literal('complete'), v.literal('failed')),
    providerJobId: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_owner', ['ownerId']),
  socialAccounts: defineTable({
    ownerId: v.id('users'),
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
  }).index('by_owner', ['ownerId']),
  scheduledPosts: defineTable({
    ownerId: v.id('users'),
    title: v.optional(v.string()),
    caption: v.string(),
    channels: v.array(v.string()),
    assetIds: v.array(v.string()),
    mediaType: v.optional(v.union(v.literal('image'), v.literal('video'))),
    mediaUrl: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
    timezone: v.string(),
    status: v.union(v.literal('draft'), v.literal('scheduled'), v.literal('publishing'), v.literal('published'), v.literal('failed')),
  }).index('by_owner_schedule', ['ownerId', 'scheduledAt']),
});
