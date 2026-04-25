/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activityLogs from "../activityLogs.js";
import type * as announcements from "../announcements.js";
import type * as appointments from "../appointments.js";
import type * as auth from "../auth.js";
import type * as channels from "../channels.js";
import type * as departments from "../departments.js";
import type * as expenses from "../expenses.js";
import type * as files from "../files.js";
import type * as invoices from "../invoices.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as patients from "../patients.js";
import type * as paymentsClinic from "../paymentsClinic.js";
import type * as scheduleEvents from "../scheduleEvents.js";
import type * as seed from "../seed.js";
import type * as stock from "../stock.js";
import type * as suppliers from "../suppliers.js";
import type * as telehealth from "../telehealth.js";
import type * as treatmentNotes from "../treatmentNotes.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activityLogs: typeof activityLogs;
  announcements: typeof announcements;
  appointments: typeof appointments;
  auth: typeof auth;
  channels: typeof channels;
  departments: typeof departments;
  expenses: typeof expenses;
  files: typeof files;
  invoices: typeof invoices;
  messages: typeof messages;
  notifications: typeof notifications;
  patients: typeof patients;
  paymentsClinic: typeof paymentsClinic;
  scheduleEvents: typeof scheduleEvents;
  seed: typeof seed;
  stock: typeof stock;
  suppliers: typeof suppliers;
  telehealth: typeof telehealth;
  treatmentNotes: typeof treatmentNotes;
  users: typeof users;
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
