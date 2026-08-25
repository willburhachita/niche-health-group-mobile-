#!/usr/bin/env node
// ── Anonymise a Convex snapshot for use as dev/test data ──────────────────
//
// Produces a copy of a snapshot with all patient and staff identifiers
// replaced by synthetic values, while preserving:
//   - every document _id and cross-table reference (joins still work)
//   - row counts and table structure (realistic volume for testing)
//   - clinical arrays, statuses, dates and money (realistic behaviour)
//
// Pseudonymisation is deterministic: the same real value always maps to the
// same fake value across every table, so relationships survive intact.
//
// NON-DESTRUCTIVE: reads the input directory, writes a new output directory.
// It never modifies the input and never touches any deployment.
//
// Usage:
//   1. unzip backups/<snapshot>.zip -d /tmp/snap          (PowerShell: Expand-Archive)
//   2. node scripts/anonymize-snapshot.mjs /tmp/snap /tmp/snap-dev
//   3. zip -r dev-seed.zip .   (from inside /tmp/snap-dev)
//   4. npx convex import --replace dev-seed.zip           (against DEV only)
//
import { createHmac } from "node:crypto";
import { readdirSync, statSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join, relative, dirname } from "node:path";

const [, , IN_DIR, OUT_DIR] = process.argv;
const KEEP_STORAGE = process.argv.includes("--keep-storage");

if (!IN_DIR || !OUT_DIR) {
  console.error("Usage: node scripts/anonymize-snapshot.mjs <input-dir> <output-dir> [--keep-storage]");
  process.exit(1);
}

// Salt makes the mapping non-reversible. Change it to re-randomise; keep it
// stable to get reproducible dev data across runs.
const SALT = process.env.ANON_SALT || "nhl-connect-dev-anonymisation-v1";

// ── Deterministic fake value helpers ──────────────────────────────────────
const h = (v) => createHmac("sha256", SALT).update(String(v ?? "")).digest("hex");
const num = (v, mod) => parseInt(h(v).slice(0, 8), 16) % mod;
const pick = (v, arr) => arr[num(v, arr.length)];

const FIRST = ["Alice","Brian","Chipo","Daniel","Esther","Farai","Grace","Henry","Idah","John",
               "Kunda","Lydia","Mavis","Nathan","Oliver","Patricia","Queen","Robert","Susan","Thomas"];
const LAST  = ["Banda","Chanda","Daka","Zulu","Mumba","Ngoma","Phiri","Sakala","Tembo","Lungu",
               "Mwale","Bwalya","Kabwe","Musonda","Nkonde","Simukonda"];

const fakeFirst = (v) => pick(v + ":first", FIRST);
const fakeLast  = (v) => pick(v + ":last", LAST);
const fakeFull  = (v) => `${fakeFirst(v)} ${fakeLast(v)}`;
const fakeEmail = (v) => `${fakeFirst(v).toLowerCase()}.${fakeLast(v).toLowerCase()}${num(v, 900) + 100}@example.invalid`;
const fakePhone = (v) => `+2609${String(num(v, 90000000) + 10000000)}`;
const fakeNrc   = (v) => `${String(num(v + ":a", 900000) + 100000)}/${String(num(v + ":b", 90) + 10)}/1`;
const fakeAcct  = (v) => String(num(v, 900000000) + 100000000);
const fakeAddr  = (v) => `${num(v, 400) + 1} ${pick(v + ":st", ["Great East","Kabulonga","Cairo","Independence","Church"])} Road, ${pick(v + ":city", ["Lusaka","Ndola","Kitwe","Livingstone"])}`;

// Shift a date by a deterministic ±180 days so approximate age is preserved
// but the exact date of birth is not.
const shiftDate = (v) => {
  if (!v || typeof v !== "string") return v;
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  d.setDate(d.getDate() + (num(v, 360) - 180));
  return d.toISOString().slice(0, 10);
};

const fakeText = (v, label) => `[${label} redacted for dev — ${h(v).slice(0, 8)}]`;

// ── Identity key ──────────────────────────────────────────────────────────
// Every fake name/email/phone for one person must be derived from a SINGLE
// stable key, otherwise firstName/lastName/displayName/initials disagree
// with each other and the same staff member gets different names in
// staffAccounts vs users. Staff are keyed on their userId/externalId (shared
// across both tables); patients on their _id.
const identityKey = (doc) => doc.userId || doc.externalId || doc._id || "";

// ── Per-table rules ───────────────────────────────────────────────────────
// Each rule is (value, doc) => newValue. Returning undefined drops the field.
// Fields not listed are kept. `_id`, `_creationTime` and anything ending in
// Id/Ids are ALWAYS kept so cross-table references survive.
const RULES = {
  patients: {
    firstName: (v, d) => fakeFirst(identityKey(d)),
    lastName: (v, d) => fakeLast(identityKey(d)),
    displayName: (v, d) => fakeFull(identityKey(d)),
    initials: (v, d) => `${fakeFirst(identityKey(d))[0]}${fakeLast(identityKey(d))[0]}`,
    dateOfBirth: shiftDate,
    phone: (v, d) => fakePhone(identityKey(d)),
    email: (v, d) => (v ? fakeEmail(identityKey(d)) : v),
    address: (v, d) => (v ? fakeAddr(identityKey(d)) : v),
    nrcNumber: (v, d) => (v ? fakeNrc(identityKey(d)) : v),
    occupation: (v) => (v ? pick(v, ["Teacher","Driver","Trader","Engineer","Farmer"]) : v),
    employer: (v) => (v ? pick(v, ["Acme Ltd","Zamco","Northern Co","Self-employed"]) : v),
    profileImageUrl: () => undefined,
    policyNumber: (v) => (v ? fakeAcct(v) : v),
    nhimaMemberNo: (v) => (v ? fakeAcct(v) : v),
    nhimaEmployer: (v) => (v ? pick(v, ["Acme Ltd","Zamco","Northern Co"]) : v),
    bankAccountName: (v, d) => (v ? fakeFull(identityKey(d)) : v),
    bankAccountNumber: (v) => (v ? fakeAcct(v) : v),
    bankBranchCode: (v) => (v ? String(num(v, 90000) + 10000) : v),
    emergencyContactName: (v) => (v ? fakeFull(v) : v),
    emergencyContactPhone: (v) => (v ? fakePhone(v) : v),
    otherInsuranceProviders: (v) =>
      Array.isArray(v) ? v.map((o) => ({ ...o, policyNumber: o.policyNumber ? fakeAcct(o.policyNumber) : o.policyNumber })) : v,
  },
  staffAccounts: {
    email: (v, d) => fakeEmail(identityKey(d)),
    phone: (v, d) => (v ? fakePhone(identityKey(d)) : v),
    fullName: (v, d) => (v ? fakeFull(identityKey(d)) : v),
    // displayName in this app is "Title. Surname F." — keep that shape.
    displayName: (v, d) =>
      v ? `${d.title ? d.title + ". " : ""}${fakeLast(identityKey(d))} ${fakeFirst(identityKey(d))[0]}.` : v,
    // Credentials are never carried into dev. Reset these after import.
    password: () => "RESET_ME_IN_DEV",
    verificationCode: () => undefined,
    otpExpiry: () => undefined,
  },
  users: {
    email: (v, d) => fakeEmail(identityKey(d)),
    phone: (v, d) => (v ? fakePhone(identityKey(d)) : v),
    firstName: (v, d) => fakeFirst(identityKey(d)),
    lastName: (v, d) => fakeLast(identityKey(d)),
    displayName: (v, d) => fakeFull(identityKey(d)),
    initials: (v, d) => `${fakeFirst(identityKey(d))[0]}${fakeLast(identityKey(d))[0]}`,
    bio: (v) => (v ? fakeText(v, "bio") : v),
  },
  treatmentNotes: {
    subjective: (v) => (v ? fakeText(v, "subjective") : v),
    objective: (v) => (v ? fakeText(v, "objective") : v),
    assessment: (v) => (v ? fakeText(v, "assessment") : v),
    plan: (v) => (v ? fakeText(v, "plan") : v),
    customResponses: (v) =>
      Array.isArray(v) ? v.map((r) => ({ ...r, value: fakeText(r.value, "response") })) : v,
  },
  messages:        { content: (v) => (v ? fakeText(v, "message") : v), fileName: (v) => (v ? "attachment.bin" : v) },
  channelMessages: { content: (v) => (v ? fakeText(v, "message") : v), fileName: (v) => (v ? "attachment.bin" : v) },
  telehealthSessions: {
    callNotes: (v) => (v ? fakeText(v, "call notes") : v),
    transcription: (v) => (v ? fakeText(v, "transcription") : v),
  },
  activityLogs: {
    performedBy: (v) => (v && String(v).includes("@") ? fakeEmail(v) : v),
    performedByName: (v) => (v ? fakeFull(v) : v),
    target: (v) => (v ? fakeText(v, "target") : v),
    details: (v) => (v ? fakeText(v, "details") : v),
  },
  patientLetters:        { content: (v) => (v ? fakeText(v, "letter") : v) },
  patientForms:          { content: (v) => (v ? fakeText(v, "form") : v) },
  patientCases:          { notes: (v) => (v ? fakeText(v, "case notes") : v) },
  patientCommunications: { content: (v) => (v ? fakeText(v, "communication") : v) },
  inAppNotifications:    { body: (v) => (v ? fakeText(v, "notification") : v) },
  files:                 { name: (v) => (v ? `file-${h(v).slice(0, 8)}.bin` : v), storageId: () => undefined },
};

// ── Generic safety net for tables with no explicit rule ───────────────────
// Fail-safe: if a field name looks identifying and we have no rule for its
// table, scrub it rather than let it through.
const SENSITIVE = [
  [/email/i, fakeEmail],
  [/phone|mobile|telephone/i, fakePhone],
  [/(first|last|full|display|contact)_?name|surname/i, (v) => fakeFull(v)],
  [/address/i, fakeAddr],
  [/nrc|national_?id|passport/i, fakeNrc],
  [/account_?number|iban|swift|card/i, fakeAcct],
  [/date_?of_?birth|dob/i, shiftDate],
  [/password|secret|token|api_?key|verification_?code/i, () => undefined],
];

const KEEP_ALWAYS = /^_id$|^_creationTime$|Id$|Ids$|^externalId$|^userId$/;

function scrubDoc(table, doc) {
  const rules = RULES[table];
  const out = {};
  for (const [k, v] of Object.entries(doc)) {
    if (KEEP_ALWAYS.test(k)) { out[k] = v; continue; }

    if (rules && k in rules) {
      const nv = rules[k](v, doc);
      if (nv !== undefined) out[k] = nv;
      continue;
    }

    if (!rules) {
      const hit = SENSITIVE.find(([re]) => re.test(k));
      if (hit) {
        // Key off the document's identity where there is one, so the same
        // person gets the same fake value in unhandled tables too.
        const nv = v == null ? v : hit[1](identityKey(doc) || v);
        if (nv !== undefined) out[k] = nv;
        continue;
      }
    }
    out[k] = v;
  }
  return out;
}

// ── Walk the snapshot ─────────────────────────────────────────────────────
function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const files = walk(IN_DIR);
if (files.length === 0) {
  console.error(`No files found under ${IN_DIR}. Did you extract the snapshot zip first?`);
  process.exit(1);
}

let tables = 0, rows = 0, skippedStorage = 0;
const unhandled = new Set();

for (const src of files) {
  const rel = relative(IN_DIR, src);

  // Storage blobs are scanned documents and ID photos — unredactable PHI.
  if (!KEEP_STORAGE && rel.split(/[\\/]/)[0] === "_storage") { skippedStorage++; continue; }

  const dest = join(OUT_DIR, rel);
  mkdirSync(dirname(dest), { recursive: true });

  if (!src.endsWith("documents.jsonl")) { copyFileSync(src, dest); continue; }

  const table = rel.split(/[\\/]/).slice(-2)[0];
  if (!RULES[table] && table !== "_storage") unhandled.add(table);

  const lines = readFileSync(src, "utf8").split("\n").filter((l) => l.trim());
  const out = lines.map((l) => JSON.stringify(scrubDoc(table, JSON.parse(l))));
  writeFileSync(dest, out.join("\n") + (out.length ? "\n" : ""));

  tables++; rows += out.length;
  console.log(`  ${table.padEnd(28)} ${String(out.length).padStart(6)} rows`);
}

console.log(`
-- Done ------------------------------------------------------------
Tables processed : ${tables}
Rows processed   : ${rows}
Storage blobs    : ${KEEP_STORAGE ? "KEPT (contains real PHI — be careful)" : `${skippedStorage} excluded`}
Output           : ${OUT_DIR}
`);

if (unhandled.size) {
  console.log(`Tables with no explicit rule (generic name-based scrubbing applied):
  ${[...unhandled].sort().join(", ")}

Review these before trusting the output. If any holds free-text PHI,
add an explicit rule to RULES in this script.
`);
}

console.log(`Reminder: import this into a DEV deployment only, never over production:
  npx convex import --replace <zipped-output>

All staffAccounts passwords are set to "RESET_ME_IN_DEV" — set real dev
credentials after import.`);
