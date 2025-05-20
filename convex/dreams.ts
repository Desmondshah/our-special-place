import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const remove = mutation({
  args: { id: v.id("dreams") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  }
});

export const add = mutation({
  args: {
    title: v.string(),
    category: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    console.log("Adding dream:", args);
    const id = await ctx.db.insert("dreams", args);
    console.log("Dream added with ID:", id);
    return id;
  }
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const dreams = await ctx.db
      .query("dreams")
      .order("desc")
      .collect();
    console.log("Retrieved dreams:", dreams);
    return dreams;
  }
});
