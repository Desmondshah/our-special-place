import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query to get all mood board items
export const getAll = query({
  handler: async (ctx) => {
    const items = await ctx.db
      .query("moodboard")
      .withIndex("by_addedAt")
      .order("desc")
      .collect();
    return items;
  },
});

// Mutation to add a new mood board item
export const add = mutation({
  args: {
    imageUrl: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    tags: v.array(v.string()),
    color: v.optional(v.string()),
    // New fields for embeds
    embedUrl: v.optional(v.string()),
    embedType: v.optional(v.string()),
    embedData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { 
      imageUrl, 
      title, 
      description, 
      tags, 
      color,
      embedUrl,
      embedType,
      embedData 
    } = args;
    
    const id = await ctx.db.insert("moodboard", {
      imageUrl,
      title,
      description,
      tags,
      color,
      addedAt: Date.now(),
      embedUrl,
      embedType,
      embedData,
    });
    return id;
  },
});

// Mutation to update a mood board item
export const update = mutation({
  args: {
    id: v.id("moodboard"),
    imageUrl: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    color: v.optional(v.string()),
    // New fields for embeds
    embedUrl: v.optional(v.string()),
    embedType: v.optional(v.string()),
    embedData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Mutation to delete a mood board item
export const remove = mutation({
  args: {
    id: v.id("moodboard")
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
