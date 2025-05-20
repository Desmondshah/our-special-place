import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

// Generate a URL for file uploads
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // Get the storage configuration from Convex
    const uploadUrl = await ctx.storage.generateUploadUrl();
    return uploadUrl;
  },
});

// Get a URL for serving an uploaded file
export const getUrl = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    try {
      // Get the URL for the file
      const url = await ctx.storage.getUrl(args.storageId);
      return url;
    } catch (error) {
      console.error("Error getting file URL:", error);
      throw new ConvexError({
        message: "Failed to get file URL",
        status: 500,
      });
    }
  },
});

// Delete an uploaded file
export const deleteFile = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    try {
      // Delete the file
      await ctx.storage.delete(args.storageId);
      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      throw new ConvexError({
        message: "Failed to delete file",
        status: 500,
      });
    }
  },
});
