/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as CloudinaryUploader from "../CloudinaryUploader.js";
import type * as MoodBoardTypes from "../MoodBoardTypes.js";
import type * as MoodBoardUtils from "../MoodBoardUtils.js";
import type * as auth from "../auth.js";
import type * as bucketList from "../bucketList.js";
import type * as cinema from "../cinema.js";
import type * as dreams from "../dreams.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as milestones from "../milestones.js";
import type * as moodboard from "../moodboard.js";
import type * as plans from "../plans.js";
import type * as router from "../router.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  CloudinaryUploader: typeof CloudinaryUploader;
  MoodBoardTypes: typeof MoodBoardTypes;
  MoodBoardUtils: typeof MoodBoardUtils;
  auth: typeof auth;
  bucketList: typeof bucketList;
  cinema: typeof cinema;
  dreams: typeof dreams;
  files: typeof files;
  http: typeof http;
  milestones: typeof milestones;
  moodboard: typeof moodboard;
  plans: typeof plans;
  router: typeof router;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
