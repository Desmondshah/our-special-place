/**
 * Shared utility functions for both mobile and desktop implementations
 */

import { MoodItem } from "./MoodBoardTypes";

/**
 * Reads a file as a Data URL
 */
export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function(event) {
      if (event.target && event.target.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    
    reader.onerror = function() {
      reject(new Error("Failed to read file"));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Check if file size is within the limit (5MB)
 */
export const isFileSizeValid = (file: File, maxSizeMB: number = 5): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

/**
 * Creates and displays a success animation
 */
export const playSuccessAnimation = (type: "save" | "delete" = "save"): void => {
  const color = type === "save" ? "rgba(165, 214, 167, 0.9)" : "rgba(255, 171, 145, 0.9)";
  const icon = type === "save" ? "✓" : "🗑️";
  
  // Create and add animation element
  const element = document.createElement('div');
  element.className = 'pixel-success-animation';
  element.style.backgroundColor = color;
  element.textContent = icon;
  document.body.appendChild(element);
  
  setTimeout(() => {
    element.remove();
  }, 1500);
};

/**
 * Filters mood items based on search query and/or tag
 */
export const filterMoodItems = (
  items: MoodItem[], 
  searchQuery: string = "", 
  activeTag: string = ""
): MoodItem[] => {
  if (!items || items.length === 0) return [];
  
  let filtered = [...items];
  
  // Filter by search query
  if (searchQuery.trim() !== "") {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(item => 
      item.title.toLowerCase().includes(query) || 
      (item.description && item.description.toLowerCase().includes(query)) ||
      item.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }
  
  // Filter by tag
  if (activeTag !== "") {
    filtered = filtered.filter(item => 
      item.tags.includes(activeTag)
    );
  }
  
  return filtered;
};

/**
 * Get all unique tags from mood items
 */
export const getAllTags = (items: MoodItem[]): string[] => {
  if (!items || items.length === 0) return [];
  
  // Extract all tags
  const allTags = items.reduce<string[]>((tags, item) => {
    return [...tags, ...item.tags];
  }, []);
  
  // Return unique tags
  return [...new Set(allTags)].sort();
};

/**
 * Format timestamp to readable date
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * NEW FUNCTIONS FOR SOCIAL MEDIA EMBEDS
 */

/**
 * Check if URL is a supported social media URL
 */
export const checkSocialMediaUrl = (url: string): { isValid: boolean, type: string | null } => {
  if (!url || typeof url !== 'string') return { isValid: false, type: null };
  
  // Check for Pinterest
  if (url.includes('pinterest.com') || url.includes('pin.it')) {
    return { isValid: true, type: 'pinterest' };
  }
  
  // Check for Twitter/X
  if (url.includes('twitter.com') || url.includes('x.com')) {
    return { isValid: true, type: 'twitter' };
  }
  
  // Check for Instagram
  if (url.includes('instagram.com')) {
    return { isValid: true, type: 'instagram' };
  }
  
  return { isValid: false, type: null };
};

/**
 * Fetch embed data from iframely API
 */
export const fetchEmbedData = async (url: string): Promise<any> => {
  try {
    const iframelyApiKey = '814cc6b45e93043061479f';
    const apiUrl = `https://iframe.ly/api/iframely?url=${encodeURIComponent(url)}&api_key=${iframelyApiKey}`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch embed data');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching embed data:', error);
    throw error;
  }
};

/**
 * Extract a good title from embed data
 */
export const getEmbedTitle = (embedData: any): string => {
  if (!embedData) return '';
  
  // Try different potential locations for the title
  if (embedData.meta && embedData.meta.title) {
    return embedData.meta.title;
  } else if (embedData.title) {
    return embedData.title;
  } else if (embedData.links && embedData.links.html && embedData.links.html.meta && embedData.links.html.meta.title) {
    return embedData.links.html.meta.title;
  }
  
  return 'Social Media Post';
};

/**
 * Extract a good description from embed data
 */
export const getEmbedDescription = (embedData: any): string => {
  if (!embedData) return '';
  
  // Try different potential locations for the description
  if (embedData.meta && embedData.meta.description) {
    return embedData.meta.description;
  } else if (embedData.description) {
    return embedData.description;
  } else if (embedData.links && embedData.links.html && embedData.links.html.meta && embedData.links.html.meta.description) {
    return embedData.links.html.meta.description;
  }
  
  return '';
};

/**
 * Extract a thumbnail image from embed data
 */
export const getEmbedThumbnail = (embedData: any): string => {
  if (!embedData) return '';
  
  // Try different potential locations for the thumbnail
  if (embedData.links && embedData.links.thumbnail && embedData.links.thumbnail.href) {
    return embedData.links.thumbnail.href;
  } else if (embedData.thumbnail_url) {
    return embedData.thumbnail_url;
  } else if (embedData.meta && embedData.meta.image) {
    return embedData.meta.image.url || embedData.meta.image;
  } else if (embedData.links && embedData.links.icon && embedData.links.icon.href) {
    return embedData.links.icon.href;
  }
  
  return '';
};

/**
 * Get oEmbed HTML for the embed (if available)
 */
export const getEmbedHtml = (embedData: any): string => {
  if (!embedData) return '';
  
  // Try different potential locations for the HTML
  if (embedData.html) {
    return embedData.html;
  } else if (embedData.links && embedData.links.html && embedData.links.html.html) {
    return embedData.links.html.html;
  }
  
  return '';
};

/**
 * Generate URL for iframely embed
 */
export const getIframelyEmbedUrl = (url: string): string => {
  const iframelyApiKey = '814cc6b45e93043061479f';
  return `https://cdn.iframe.ly/api/iframe?url=${encodeURIComponent(url)}&key=${iframelyApiKey}`;
};
