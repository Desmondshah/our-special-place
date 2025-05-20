import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const remove = mutation({
  args: { id: v.id("cinema") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  }
});

export const add = mutation({
  args: {
    title: v.string(),
    poster: v.string(),
    link: v.string()
  },
  handler: async (ctx, args) => {
    console.log("Adding movie:", args);
    const id = await ctx.db.insert("cinema", {
      ...args,
      addedAt: Date.now(),
      watched: false,
      watchedAt: undefined
    });
    console.log("Movie added with ID:", id);
    return id;
  }
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const movies = await ctx.db
      .query("cinema")
      .collect();
    console.log("Retrieved movies:", movies);
    return movies;
  }
});

// Get only watched movies
export const getWatched = query({
  args: {},
  handler: async (ctx) => {
    const movies = await ctx.db
      .query("cinema")
      .withIndex("by_watched", (q) => q.eq("watched", true))
      .collect();
    return movies;
  }
});

// Get only unwatched movies
export const getUnwatched = query({
  args: {},
  handler: async (ctx) => {
    const movies = await ctx.db
      .query("cinema")
      .withIndex("by_watched", (q) => q.eq("watched", false))
      .collect();
    return movies;
  }
});

// Mark a movie as watched
export const markAsWatched = mutation({
  args: { 
    id: v.id("cinema"),
    watchedAt: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { 
      watched: true,
      watchedAt: args.watchedAt || Date.now()
    });
  }
});

// Unmark a movie as watched (renamed for clarity)
export const markAsUnwatched = mutation({
  args: { id: v.id("cinema") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { 
      watched: false,
      watchedAt: undefined
    });
  }
});

// Search movies by title
export const searchByTitle = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const { query } = args;
    if (!query.trim()) return [];
    
    // Get all movies and filter on the client
    // This is a simple implementation. For production apps with many records,
    // you'd want to implement a more efficient search mechanism
    const allMovies = await ctx.db.query("cinema").collect();
    const lowercaseQuery = query.toLowerCase();
    
    return allMovies.filter(movie => 
      movie.title.toLowerCase().includes(lowercaseQuery)
    );
  },
});
