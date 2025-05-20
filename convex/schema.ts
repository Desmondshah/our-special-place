import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  plans: defineTable({
    title: v.string(),
    date: v.string(),
    type: v.string(),
    website: v.optional(v.string()),
    mapsLink: v.optional(v.string()),
    isCompleted: v.boolean(),
    memory: v.optional(v.object({
      photos: v.array(v.string()),
      rating: v.number(),
      notes: v.array(v.string()),
      createdAt: v.string()
    }))
  }),
  bucketList: defineTable({
    title: v.string(),
    category: v.string(),
    targetDate: v.optional(v.string()),
    isCompleted: v.boolean(),
    links: v.optional(v.object({
      website: v.optional(v.string()),
      maps: v.optional(v.string()),
      flights: v.optional(v.string()),
      airbnb: v.optional(v.string()),
      tripadvisor: v.optional(v.string())
    })),
    notes: v.optional(v.string())
  }),
  dreams: defineTable({
    title: v.string(),
    category: v.string(),
    imageUrl: v.optional(v.string()),
    description: v.optional(v.string())
  }),
  milestones: defineTable({
    title: v.string(),
    date: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    photos: v.array(v.string()),
    icon: v.string()
  }),
  cinema: defineTable({
    title: v.string(),
    poster: v.string(),
    link: v.string(),
    addedAt: v.number(),
    watched: v.optional(v.boolean()),
    watchedAt: v.optional(v.number())
  }).index("by_addedAt", ["addedAt"])
   .index("by_watched", ["watched"]),

  moodboard: defineTable({
    imageUrl: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    tags: v.array(v.string()),
    color: v.optional(v.string()),
    addedAt: v.number(),
    // New fields for social media embeds
    embedUrl: v.optional(v.string()),
    embedType: v.optional(v.string()), // "pinterest", "twitter", "instagram"
    embedData: v.optional(v.any())
  }).index("by_addedAt", ["addedAt"]),
});
