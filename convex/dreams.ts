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
    description: v.optional(v.string()), // <--- CORRECTED LINE
    imageUrl: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    console.log("Adding dream:", args); // Keep your logs if they are helpful
    // If description is undefined, it will be stored as such, which is fine for optional fields
    const id = await ctx.db.insert("dreams", {
        title: args.title,
        category: args.category,
        description: args.description, // Pass it directly
        imageUrl: args.imageUrl,
    });
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
