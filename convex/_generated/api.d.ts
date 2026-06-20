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
import type * as archive from "../archive.js";
import type * as auth from "../auth.js";
import type * as billableItems from "../billableItems.js";
import type * as channels from "../channels.js";
import type * as clinicConfig from "../clinicConfig.js";
import type * as departments from "../departments.js";
import type * as expenses from "../expenses.js";
import type * as files from "../files.js";
import type * as inAppNotifs from "../inAppNotifs.js";
import type * as invoices from "../invoices.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as patientCases from "../patientCases.js";
import type * as patientCommunications from "../patientCommunications.js";
import type * as patientForms from "../patientForms.js";
import type * as patientLetters from "../patientLetters.js";
import type * as patientRecalls from "../patientRecalls.js";
import type * as patients from "../patients.js";
import type * as paymentTypes from "../paymentTypes.js";
import type * as paymentsClinic from "../paymentsClinic.js";
import type * as payroll from "../payroll.js";
import type * as recallTypes from "../recallTypes.js";
import type * as scheduleEvents from "../scheduleEvents.js";
import type * as seed from "../seed.js";
import type * as seedStock from "../seedStock.js";
import type * as serviceTypes from "../serviceTypes.js";
import type * as shifts from "../shifts.js";
import type * as stock from "../stock.js";
import type * as suppliers from "../suppliers.js";
import type * as taxConfigs from "../taxConfigs.js";
import type * as telehealth from "../telehealth.js";
import type * as timeEntries from "../timeEntries.js";
import type * as treatmentNoteTemplates from "../treatmentNoteTemplates.js";
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
  archive: typeof archive;
  auth: typeof auth;
  billableItems: typeof billableItems;
  channels: typeof channels;
  clinicConfig: typeof clinicConfig;
  departments: typeof departments;
  expenses: typeof expenses;
  files: typeof files;
  inAppNotifs: typeof inAppNotifs;
  invoices: typeof invoices;
  messages: typeof messages;
  notifications: typeof notifications;
  patientCases: typeof patientCases;
  patientCommunications: typeof patientCommunications;
  patientForms: typeof patientForms;
  patientLetters: typeof patientLetters;
  patientRecalls: typeof patientRecalls;
  patients: typeof patients;
  paymentTypes: typeof paymentTypes;
  paymentsClinic: typeof paymentsClinic;
  payroll: typeof payroll;
  recallTypes: typeof recallTypes;
  scheduleEvents: typeof scheduleEvents;
  seed: typeof seed;
  seedStock: typeof seedStock;
  serviceTypes: typeof serviceTypes;
  shifts: typeof shifts;
  stock: typeof stock;
  suppliers: typeof suppliers;
  taxConfigs: typeof taxConfigs;
  telehealth: typeof telehealth;
  timeEntries: typeof timeEntries;
  treatmentNoteTemplates: typeof treatmentNoteTemplates;
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
