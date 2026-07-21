/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agents from "../agents.js";
import type * as availability from "../availability.js";
import type * as bookings from "../bookings.js";
import type * as catalog from "../catalog.js";
import type * as contacts from "../contacts.js";
import type * as conversations from "../conversations.js";
import type * as dashboard from "../dashboard.js";
import type * as ecommerce from "../ecommerce.js";
import type * as ecommerceSettings from "../ecommerceSettings.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as knowledge from "../knowledge.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_bookings from "../lib/bookings.js";
import type * as lib_defaults from "../lib/defaults.js";
import type * as lib_siteConfig from "../lib/siteConfig.js";
import type * as lib_time from "../lib/time.js";
import type * as lib_validation from "../lib/validation.js";
import type * as mpesa from "../mpesa.js";
import type * as organizations from "../organizations.js";
import type * as publicBooking from "../publicBooking.js";
import type * as publicSite from "../publicSite.js";
import type * as seed from "../seed.js";
import type * as seedTestOrg from "../seedTestOrg.js";
import type * as seedXuremiStore from "../seedXuremiStore.js";
import type * as seedXuremiTech from "../seedXuremiTech.js";
import type * as team from "../team.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agents: typeof agents;
  availability: typeof availability;
  bookings: typeof bookings;
  catalog: typeof catalog;
  contacts: typeof contacts;
  conversations: typeof conversations;
  dashboard: typeof dashboard;
  ecommerce: typeof ecommerce;
  ecommerceSettings: typeof ecommerceSettings;
  files: typeof files;
  http: typeof http;
  knowledge: typeof knowledge;
  "lib/auth": typeof lib_auth;
  "lib/bookings": typeof lib_bookings;
  "lib/defaults": typeof lib_defaults;
  "lib/siteConfig": typeof lib_siteConfig;
  "lib/time": typeof lib_time;
  "lib/validation": typeof lib_validation;
  mpesa: typeof mpesa;
  organizations: typeof organizations;
  publicBooking: typeof publicBooking;
  publicSite: typeof publicSite;
  seed: typeof seed;
  seedTestOrg: typeof seedTestOrg;
  seedXuremiStore: typeof seedXuremiStore;
  seedXuremiTech: typeof seedXuremiTech;
  team: typeof team;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
