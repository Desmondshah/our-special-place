import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("bucketList").collect();
  },
});

export const add = mutation({
  args: {
    title: v.string(),
    category: v.string(),
    targetDate: v.optional(v.string()),
    links: v.optional(
      v.object({
        flights: v.optional(v.string()),
        airbnb: v.optional(v.string()),
        maps: v.optional(v.string()),
        tripadvisor: v.optional(v.string()),
        website: v.optional(v.string())
      })
    ),
    notes: v.optional(v.string()),
    isCompleted: v.boolean()
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("bucketList", args);
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("bucketList"),
    title: v.string(),
    category: v.string(),
    targetDate: v.optional(v.string()),
    links: v.optional(
      v.object({
        flights: v.optional(v.string()),
        airbnb: v.optional(v.string()),
        maps: v.optional(v.string()),
        tripadvisor: v.optional(v.string()),
        website: v.optional(v.string())
      })
    ),
    notes: v.optional(v.string()),
    isCompleted: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const toggle = mutation({
  args: { id: v.id("bucketList"), isCompleted: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isCompleted: args.isCompleted });
  },
});

export const remove = mutation({
  args: { id: v.id("bucketList") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});