import { Id } from "../convex/_generated/dataModel";

/**
 * Shared types for both mobile and desktop implementations
 */

export interface MoodItem {
  _id: Id<"moodboard">;
  imageUrl: string;
  title: string;
  description?: string;
  tags: string[];
  color?: string;
  addedAt: number;
  // New fields for social media embeds
  embedUrl?: string;
  embedType?: string; // "pinterest", "twitter", "instagram"
  embedData?: any; // iframely response data
}

export interface MoodItemForm {
  imageUrl: string;
  title: string;
  description: string;
  tags: string[];
  color: string;
  // New fields for social media embeds
  embedUrl?: string;
  embedType?: string;
  embedData?: any;
}

export const defaultColors: string[] = [
  "#FFDAB9", // Peach
  "#FFB6B6", // Light pink
  "#A5D6A7", // Light green
  "#81C784", // Green
  "#FFE0B2", // Light peach
  "#FFCCBC", // Light salmon
  "#FFAB91", // Salmon
  "#FFF5EE", // Soft white
];

export const emptyMoodItemForm: MoodItemForm = {
  imageUrl: "",
  title: "",
  description: "",
  tags: [],
  color: defaultColors[0],
  embedUrl: "",
  embedType: "",
  embedData: null
};
