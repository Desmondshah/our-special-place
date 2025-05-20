import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("plans").collect();
  },
});

export const add = mutation({
  args: {
    title: v.string(),
    date: v.string(),
    type: v.string(),
    website: v.optional(v.string()),
    mapsLink: v.optional(v.string()),
    isCompleted: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("plans", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("plans"),
    title: v.string(),
    date: v.string(),
    type: v.string(),
    website: v.optional(v.string()),
    mapsLink: v.optional(v.string()),
    isCompleted: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const toggle = mutation({
  args: { id: v.id("plans"), isCompleted: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isCompleted: args.isCompleted });
  },
});

export const remove = mutation({
  args: { id: v.id("plans") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const addMemory = mutation({
  args: {
    planId: v.id("plans"),
    memory: v.object({
      photos: v.array(v.string()),
      rating: v.number(),
      notes: v.array(v.string()),
      createdAt: v.string()
    })
  },
  handler: async (ctx, args) => {
    const { planId, memory } = args;
    const plan = await ctx.db.get(planId);
    if (!plan) throw new Error("Plan not found");
    await ctx.db.patch(planId, { memory });
  },
});
