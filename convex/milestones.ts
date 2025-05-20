import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("milestones")
      .order("desc")
      .collect();
  },
});

export const add = mutation({
  args: {
    title: v.string(),
    date: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    photos: v.array(v.string()),
    icon: v.string()
  },
  handler: async (ctx, args) => {
    const { title, date, description, category, photos, icon } = args;
    
    // Check if all photos are URLs (not base64)
    const isValid = photos.every(photo => photo.startsWith('http'));
    if (!isValid && photos.length > 0) {
      throw new Error("All photos must be uploaded to Cloudinary first");
    }
    
    await ctx.db.insert("milestones", {
      title,
      date,
      description,
      category,
      photos,
      icon
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("milestones"),
    title: v.string(),
    date: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    photos: v.array(v.string()),
    icon: v.string()
  },
  handler: async (ctx, args) => {
    const { id, photos, ...otherUpdates } = args;
    
    // First update everything except photos
    await ctx.db.patch(id, otherUpdates);
    
    // Then check and update photos separately
    if (photos && photos.length > 0) {
      // Verify all photos are URLs (not base64)
      const isValid = photos.every(photo => photo.startsWith('http'));
      if (!isValid) {
        throw new Error("All photos must be uploaded to Cloudinary first");
      }
      
      // Update photos
      await ctx.db.patch(id, { photos });
    } else {
      // If no photos, set empty array
      await ctx.db.patch(id, { photos: [] });
    }
  },
});

export const remove = mutation({
  args: {
    id: v.id("milestones")
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});