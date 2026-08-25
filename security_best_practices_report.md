# Security Review — NHL Connect (Niche Healthcare Mobile + Desktop + Convex)

**Repository:** `willburhachita/niche-health-group-mobile-`
**Review date:** 2026-08-25
**Reviewed commit:** `6140be9`
**Reviewer:** Senior security engineer (automated deep review)
**Scope:** Expo/React Native mobile app (`src/`), Electron desktop app (`apps/desktop/`), Convex backend (`convex/`), deployment/config, dependencies.

---

## 0. Executive Summary

This application stores and processes **Protected Health Information (PHI)** — patient names, dates of birth, national ID (NRC) numbers, diagnoses, allergies, medications, treatment notes, vitals, insurance/NHIMA membership data, and **bank account numbers** (`convex/schema.ts:171-232`) — plus staff payroll and clinical messaging.

**The backend currently has no authentication of any kind.**

There is no `convex/auth.config.ts` in the repository. Per Convex's own documented behaviour (`convex/_generated/ai/guidelines.md`, "Authentication guidelines"), without that file `ctx.auth.getUserIdentity()` always returns `null`. Consistent with this, a repo-wide search for `ctx.auth` / `getUserIdentity` across `convex/`, `src/`, and `apps/` returns **zero results**, and the clients use plain `ConvexProvider` (`App.js:11,30`) rather than `ConvexProviderWithAuth`, so no credential is ever transmitted.

The practical consequence: **all 258 Convex queries and mutations are unauthenticated public internet endpoints.** Anyone with a deployment URL and the public `convex` npm client can read and modify the entire database — the whole patient register, every treatment note, all financial records, all staff private messages — with no account, no token, and no login.

> **Deployment note (added after review).** This project has three Convex deployments: `production` (`zany-squirrel-782`), `dev/ecobrood` (`robust-rook-737`), and `dev/wilbur-hachita` (`silent-meerkat-382`). The URL committed to this repository — in `apps/desktop/.env`, hardcoded again at `apps/desktop/vite.config.ts:32`, and in `docs/planning/desktop-app-plan.md:262` — is **`silent-meerkat-382`, a personal dev sandbox**, not production. The production deployment is referenced nowhere in the repo.
>
> This does **not** narrow the findings. Every finding below is a defect in the **code**, so it applies to whichever deployment this code is deployed to — production included. Two consequences follow:
> 1. **Production runs the same vulnerable code.** Data being safely *stored* in production is not the same as production being *secure*.
> 2. **A committed dev-sandbox URL is its own exposure** if that sandbox holds real patient data, since the URL is public in git history and the sandbox is equally unauthenticated.
>
> Confirm which deployment each shipped client actually talks to. Mobile reads `EXPO_PUBLIC_CONVEX_URL` (`App.js:11`), which is not set anywhere in this repo — no root `.env`, no `env` block in `eas.json` — so it comes from the EAS build environment and must be verified there.

Compounding this, a single public query returns staff records containing **plaintext passwords** and **live OTP codes** (`convex/auth.ts:7-31`, `convex/auth.ts:76-83`), and the role/permission system trusts an **attacker-supplied `email` string** as proof of identity (`convex/utils/permissions.ts:117-171`).

The intended architecture — Privy OTP issuing a JWT, bridged via `ConvexProviderWithAuth`, with Convex enforcing device trust — is fully specified in `docs/planning/master-plan/04-auth.md:1-80` but **was never implemented**. What shipped is a client-side simulation of that design.

### Reconciliation with prior work

I searched the repository and full git history for earlier security artifacts, reports, or plans. **No prior security review exists** (`src/screens/more/PrivacySecurityScreen.js` is a UI settings screen, not an assessment; the `*security*` hits under `.claude/skills/` and `.agents/skills/` are vendored Convex performance-audit skill files, unrelated). The only pre-existing security-adjacent asset is `convex/backendPermissions.test.ts`, which tests the permission *matrix* in isolation against a mocked database. Those tests pass, but they validate table lookup logic only — they never exercise the question of whether the caller is who they claim to be, which is precisely where the system fails. This report is therefore the first baseline.

### Severity counts

| Severity | Count |
|---|---|
| Critical | 7 |
| High | 12 |
| Medium | 12 |
| Low | 6 |

> **Bottom line:** In its current state this system should not hold real patient data. If it already does, treat this as an active breach-exposure condition and work the Emergency Containment items in §5 today.

---

## 1. Critical Findings

---

### C-01 — No authentication on the Convex backend; every function is a public endpoint

**Severity:** Critical
**Affected:** `convex/` (entire directory — no `auth.config.ts` present); `App.js:11,30`; `apps/desktop/src/main.tsx`; all 258 exported functions

**What is wrong**
Convex requires `convex/auth.config.ts` to validate JWTs. That file does not exist. No function anywhere calls `ctx.auth.getUserIdentity()`. The mobile client wraps the app in plain `ConvexProvider`:

```js
// App.js:11
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL);
// App.js:30
<ConvexProvider client={convex}>
```

`ConvexProvider` does not attach auth tokens to requests. Functions registered with `query()` / `mutation()` / `action()` are, by Convex's design, exposed to the public internet. Every function in this backend is registered that way except two `internalMutation`s.

**Exploit scenario**
The deployment URL is committed in `apps/desktop/.env`. An attacker needs nothing else:

```js
import { ConvexHttpClient } from "convex/browser";
const c = new ConvexHttpClient("https://silent-meerkat-382.eu-west-1.convex.cloud");
await c.query("auth:getAllStaffAccounts", {});   // every staff account + plaintext passwords
await c.query("patients:list", {});              // the entire patient register
await c.query("archive:listArchived", {});       // every archived patient/invoice/expense
```

No credential, no session, no login. A decompiled APK or the shipped Electron bundle also yields the URL.

**Impact**
Total, unauthenticated compromise of confidentiality, integrity and availability for all PHI, financial records, and staff communications. This is a reportable data breach under essentially any health-privacy regime (HIPAA, GDPR Art. 9, Zambia Data Protection Act 2021).

**Concrete fix**
1. Adopt a real identity provider. The documented plan is Privy (`docs/planning/master-plan/04-auth.md`); Clerk, Auth0, or WorkOS are equally valid. Whichever you choose, create `convex/auth.config.ts`:
   ```ts
   export default {
     providers: [{ domain: process.env.AUTH_ISSUER_URL, applicationID: "convex" }],
   };
   ```
2. Switch both clients to `ConvexProviderWithAuth` with a `fetchAccessToken` implementation.
3. Introduce a single server-side helper and route **every** function through it:
   ```ts
   // convex/utils/auth.ts
   export async function requireAccount(ctx: QueryCtx | MutationCtx) {
     const identity = await ctx.auth.getUserIdentity();
     if (!identity) throw new Error("Unauthenticated");
     const account = await ctx.db
       .query("staffAccounts")
       .withIndex("by_tokenIdentifier", q => q.eq("tokenIdentifier", identity.tokenIdentifier))
       .unique();
     if (!account?.isActive) throw new Error("Unauthenticated");
     return account;
   }
   ```
   Per the Convex guidelines, key the lookup on `identity.tokenIdentifier`, **not** `identity.subject`.
4. Add `tokenIdentifier: v.string()` to `staffAccounts` with a `by_tokenIdentifier` index; link it at first login.

**Test / verification**
- Automated: a `convex-test` suite asserting that calling each public function with no identity throws `Unauthenticated`. Make this a CI gate that fails on any unprotected export.
- Manual: run the `ConvexHttpClient` snippet above against a staging deployment; every call must be rejected.
- Add a lint/CI script that greps for `= query({` / `= mutation({` and fails if the handler body does not reach `requireAccount`.

---

### C-02 — Passwords stored and compared in plaintext

**Severity:** Critical
**Affected:** `convex/schema.ts:14`; `convex/auth.ts:202-222` (esp. `:215`); `convex/auth.ts:131-200` (`:162`); `convex/seed.ts:16-70`

**What is wrong**
The schema declares `password: v.string()` with no hashing. `createStaffAccount` inserts the password as received (`convex/auth.ts:162`). Verification is a plaintext string comparison:

```ts
// convex/auth.ts:215
if (account.password !== password) {
```

No bcrypt/scrypt/Argon2, no salt, no work factor. The comparison is also non-constant-time (minor next to the rest).

**Exploit scenario**
Any database read — via C-03's public query, a Convex dashboard compromise, a backup/export, or a support engineer's screen — yields directly usable credentials. Because staff reuse passwords, this pivots into their email accounts, which is exactly where the OTP for this app is delivered (see H-01).

**Impact**
Permanent compromise of every staff credential. Unlike a hashed store, there is no "the hashes were strong" mitigation available in an incident response; every password is immediately live, and credential-stuffing against staff email/banking follows.

**Concrete fix**
1. Move password verification into a Node-runtime Convex **action** (hashing libraries need Node built-ins; per the guidelines, `"use node";` must be in a file with no queries/mutations — e.g. `convex/passwordActions.ts`).
2. Hash with Argon2id (or bcrypt cost ≥ 12). Store `passwordHash`; drop the `password` field from the schema entirely.
3. Migrate: on next successful login, re-hash and null the plaintext field; then force-rotate every credential (they are already public — see C-05).
4. Use a constant-time comparison for the hash check.
5. Never return the hash to a client under any circumstance.

**Test / verification**
- Assert no document in `staffAccounts` retains a `password` field after migration.
- Unit test: same password hashed twice produces different hashes (salting works) and both verify.
- Grep gate in CI: `password:` must not appear in `convex/schema.ts`.

---

### C-03 — Public queries return full staff records including plaintext passwords and live OTP codes

**Severity:** Critical
**Affected:** `convex/auth.ts:7-31` (`getAccountByEmail`), `convex/auth.ts:76-83` (`getAllStaffAccounts`), `convex/auth.ts:622-627` (`listStaff`), `convex/auth.ts:65-74` (`getStaffByUserId`)

**What is wrong**
These are `query()` exports — public endpoints — and they return the raw `staffAccounts` document with **no field projection**. That document includes `password`, `verificationCode` (the live OTP), `otpExpiry`, `role`, `permissions`, and `trustedDevices`.

```ts
// convex/auth.ts:76-83
export const getAllStaffAccounts = query({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.db.query("staffAccounts").collect();
    return accounts;              // ← every password, every OTP, unfiltered
  },
});
```

**Exploit scenario**
A single unauthenticated call to `auth:getAllStaffAccounts` dumps the complete credential store. `getAccountByEmail` additionally lets an attacker poll one target's `verificationCode` field in real time, reading the OTP the instant it is issued — without any access to that person's inbox.

**Impact**
Instant full-administrative compromise. Combined with C-02, no cracking is needed; combined with H-01, the OTP factor is neutralised. This is the single most directly exploitable finding in the report.

**Concrete fix**
1. Gate all four behind `requireAccount` (C-01).
2. Never return the raw document. Introduce an explicit projection and use it everywhere:
   ```ts
   const publicAccount = (a: Doc<"staffAccounts">) => ({
     _id: a._id, userId: a.userId, email: a.email, role: a.role,
     displayName: a.displayName, title: a.title,
     isActive: a.isActive, isOnboarded: a.isOnboarded,
   });
   ```
3. `getAllStaffAccounts` / `listStaff` additionally require `manageStaff`.
4. Structurally: move `password`/`verificationCode`/`otpExpiry` out of `staffAccounts` into a separate `staffSecrets` table that no public function ever queries. This makes over-fetching impossible rather than merely forbidden.

**Test / verification**
- Automated: assert the JSON returned by every auth query contains none of the keys `password`, `verificationCode`, `otpExpiry`.
- Manual: call each endpoint unauthenticated and confirm rejection; call as a `member` and confirm the projection.

---

### C-04 — Authorization is derived from a caller-supplied argument (universal privilege escalation)

**Severity:** Critical
**Affected:** `convex/utils/permissions.ts:117-171`; all 36 call sites — `convex/auth.ts:139,658,698,729`; `convex/patients.ts`; `convex/appointments.ts`; `convex/invoices.ts`; `convex/paymentsClinic.ts`; `convex/treatmentNotes.ts:85,129,151`

**What is wrong**
`checkPermission` takes the caller's identity **as a function parameter** and looks up the role for whatever string it is given:

```ts
// convex/utils/permissions.ts:117-128
export async function checkPermission(
  db: DatabaseReader,
  emailOrId: string | undefined | null,   // ← supplied by the client
  permission: Permission
): Promise<boolean> {
  if (emailOrId.includes("@")) {
    account = await db.query("staffAccounts")
      .withIndex("by_email", q => q.eq("email", emailOrId.toLowerCase())).first();
```

Every caller passes a client-controlled string: `createdBy`, `adminId`, `adminEmail`, `providerId`, `approvedBy`. This directly violates the rule stated in the project's own `convex/_generated/ai/guidelines.md`: *"NEVER accept a `userId` or any user identifier as a function argument for authorization purposes. Always derive the user identity server-side via `ctx.auth.getUserIdentity()`."*

**Exploit scenario**
The permission check is satisfied by *typing an admin's email address*:

```js
await c.mutation("auth:updateStaffRoleAndPermissions", {
  accountId: "<any account id>",
  role: "admin",
  permissions: [],
  adminEmail: "wilburhachita@gmail.com",   // ← the entire authorization check
});
```

Admin emails are trivially obtained from `auth:getAllStaffAccounts`, from `activityLogs`, or from `NHL_Connect_Tester_Guide.txt:23` in this repository. The same pattern promotes accounts, approves attacker devices (`approveDeviceRequest`, `convex/auth.ts:658`), and approves clinical treatment notes (`treatmentNotes.approve`, `convex/treatmentNotes.ts:151`).

**Impact**
Every permission gate in the system is decorative. Even after C-01 is fixed, this bug alone would let any authenticated `member` act as an admin. Note the interaction: fixing authentication *without* fixing this leaves full privilege escalation intact.

**Concrete fix**
1. Change the signature so an identity string cannot be passed in:
   ```ts
   export async function requirePermission(
     ctx: QueryCtx | MutationCtx, permission: Permission
   ): Promise<Doc<"staffAccounts">> {
     const account = await requireAccount(ctx);          // from C-01
     if (!hasPermission(account, permission)) {
       throw new Error("Forbidden");
     }
     return account;
   }
   ```
2. Delete every `createdBy` / `adminId` / `adminEmail` / `approvedBy` **authorization** argument. Where the value is needed for an audit trail, populate it server-side from the resolved account — never from args.
3. Validate `permissions[]` against `PERMISSION_KEYS` in `updateStaffRoleAndPermissions` (`convex/auth.ts:721-757`); it currently accepts arbitrary strings.
4. Add a guard so a non-admin can never grant themselves `manageStaff`, and block self-role-elevation.

**Test / verification**
- Rewrite `convex/backendPermissions.test.ts` to drive real functions through `convex-test` with `t.withIdentity({...})` rather than testing the matrix against a mock. The existing tests pass while the system is fully bypassable — that gap is the lesson.
- Add an explicit regression test: identity = `member`, call `updateStaffRoleAndPermissions` with an admin's email in args → must throw `Forbidden`.

---

### C-05 — Live production credentials committed to the repository

**Severity:** Critical
**Affected:** `NHL_Connect_Tester_Guide.txt:23-24,540-550`; `convex/seed.ts:16-70`; `src/data/mockAuth.js:131,149,167,185,203,221,239`; `apps/desktop/.env`; `args.json`

**What is wrong**
The tester guide contains the working admin credentials in plaintext:

```
NHL_Connect_Tester_Guide.txt:23-24
  Email:    wilburhachita@gmail.com
  Password: Michelle13//.
```

The same password is the seeded admin password (`convex/seed.ts:19`) and appears again in `src/data/mockAuth.js:131` — which is **bundled into the shipped mobile app**. `NHL_Connect_Tester_Guide.txt:545-550` lists six further staff accounts with passwords. `convex/seed.ts` also hardcodes fixed OTP codes (`verificationCode: "123456"`, `:19`). `apps/desktop/.env` commits the production Convex deployment URL, and `args.json` commits a personal email address.

**Exploit scenario**
Anyone with repository access — or anyone who decompiles the APK to recover `mockAuth.js` — logs in as the admin. `wilburhachita@gmail.com` is also the account hardwired into the client-side device-trust backdoor (H-09), so it bypasses device approval too.

**Impact**
Direct administrative access. These credentials must be treated as **already public and already compromised**, regardless of whether the repository is currently private — they are in git history, in build artifacts, and in at least one distributed tester document.

**Concrete fix**
1. **Rotate now**, before any code work: change that admin password and every account in `:545-550`; rotate `SENDGRID_API_KEY`; rotate the Geoapify key (M-01).
2. Delete the credential blocks from `NHL_Connect_Tester_Guide.txt`; replace with "credentials issued separately via password manager."
3. Delete `src/data/mockAuth.js` — it is dead mock data shipping real passwords into the app bundle. Confirm no imports remain first.
4. Rewrite `convex/seed.ts` to generate random passwords via CSPRNG at seed time and print them once; never commit fixed passwords or fixed OTPs.
5. Add `apps/desktop/.env` to `.gitignore` (the current rule `.env*.local` does not match a bare `.env`) and `git rm --cached` it. Remove `args.json` or strip the email.
6. Purge history with `git filter-repo`, force-push, and have all clones re-cloned. Rotation (step 1) is what actually protects you; history purge is hygiene.
7. Add secret scanning (`gitleaks` / GitHub push protection) as a pre-commit hook and CI gate.

**Test / verification**
- `gitleaks detect --no-git` returns clean on the working tree; `gitleaks detect` on full history after purge.
- Confirm the old admin password fails against the live deployment.
- `grep -rn "Michelle13" .` returns nothing.

---

### C-06 — All PHI read paths are unauthenticated and unauthorized

**Severity:** Critical
**Affected:** `convex/patients.ts:7-84`; `convex/treatmentNotes.ts:6-49`; `convex/archive.ts:3-66`; `convex/invoices.ts:7-116`; `convex/appointments.ts:6-95`; `convex/payroll.ts:47-74`; `convex/files.ts:19-71`; `convex/patientCases.ts`, `patientForms.ts`, `patientLetters.ts`, `patientRecalls.ts`, `patientCommunications.ts`

**What is wrong**
Only **6 of 44** backend files import the permissions helper, and within those, the checks appear almost exclusively on *mutations*. Essentially every read path is ungated. `convex/patients.ts` imports `enforcePermission` at `:4` but calls it zero times in `list` (`:7`), `get` (`:26`), `search` (`:34`), `listRecent` (`:48`), or `countByStatus` (`:63`):

```ts
// convex/patients.ts:26-31
export const get = query({
  args: { id: v.id("patients") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);      // no auth, no authz, full PHI document
  },
});
```

`convex/treatmentNotes.ts:6-15` returns clinical SOAP notes for any patient ID. `isPrivate` (`convex/schema.ts:509`) is stored but **never enforced anywhere**. `convex/archive.ts:3-26` returns every archived patient, invoice and expense in one unauthenticated call. `convex/payroll.ts:57-62` returns every staff member's salary.

**Exploit scenario**
`await c.query("patients:list", {})` returns up to 200 complete patient records — name, DOB, NRC number, phone, address, allergies, conditions, medications, insurance policy numbers, and bank account numbers. `archive:listArchived` returns the rest. Iterating `treatmentNotes:listByPatient` over those IDs yields the full clinical history of the practice.

**Impact**
Mass PHI exfiltration in minutes, silently — there is no audit trail on reads (H-05). This is the payload that C-01 makes reachable.

**Concrete fix**
1. Gate every query with `requirePermission(ctx, 'viewPatients' | 'viewTreatmentNote' | 'viewFinancials' | ...)`.
2. Enforce `isPrivate` on treatment notes: only the authoring `providerId` or an admin may read a private note.
3. Apply data minimisation — the patient *list* view does not need `bankAccountNumber`, `nrcNumber`, or `policyNumber`. Return a lean projection for lists and full detail only from `get`, gated separately.
4. Replace unbounded `.collect()` in `convex/archive.ts:6-10` with `.take(n)` or pagination, per the Convex guidelines.
5. Add read-access audit logging for patient and treatment-note reads (see H-05).

**Test / verification**
- Per-role integration matrix: for each role × each PHI query, assert allow/deny against the documented matrix in `convex/utils/permissions.ts:48-115`.
- Specific test: `member` role → `patients:list` must throw.
- Specific test: provider A cannot read provider B's `isPrivate` note.

---

### C-07 — Sessions are an unauthenticated plaintext email string; trivially forged

**Severity:** Critical
**Affected:** `src/hooks/useAuth.js:12,67-92,94-135`; `apps/desktop/src/hooks/useAuth.ts:6,29-49`

**What is wrong**
There is no session token. The "session" is the user's email address, written to unencrypted storage, and "restoring" it means re-fetching the account by that email:

```js
// src/hooks/useAuth.js:87
try { await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ email })); } catch {}

// src/hooks/useAuth.js:67-70
const stored = await AsyncStorage.getItem(SESSION_KEY);
const { email } = JSON.parse(stored);
const account = await convex.query(api.auth.getAccountByEmail, { email });
```

The desktop app does the same in `localStorage` (`apps/desktop/src/hooks/useAuth.ts:31,42`). `expo-secure-store` is installed (`package.json`) and configured as a plugin (`app.json`), but **is never imported anywhere in the codebase** — the secure storage was set up and then not used.

There is no expiry, no rotation, no signature, and no server-side session record, so `logout()` (`src/hooks/useAuth.js:158-164`) only clears local state — it cannot invalidate anything server-side.

**Exploit scenario**
On a rooted/jailbroken device, from a malicious app with shared storage access, or on any shared desktop, an attacker writes:
```js
localStorage.setItem('nhl_desktop_session', '{"email":"wilburhachita@gmail.com"}')
```
and refreshes. The app loads the admin account and grants full admin UI. On desktop this needs only the DevTools console, which F12 opens in production builds (M-08). No password, no OTP, no device approval.

**Impact**
Complete authentication bypass from any device with local access. Combined with C-01 there is no server-side check that would catch it. Stolen device = permanent admin access with no revocation path.

**Concrete fix**
1. Replace with real JWTs from the identity provider (C-01). Short-lived access token (≤15 min) + refresh token.
2. Store tokens in `expo-secure-store` on mobile (Keychain/Keystore — the dependency is already installed) and in Electron `safeStorage` on desktop. Never `AsyncStorage`/`localStorage`.
3. Add a server-side `sessions` table keyed by token ID with `revokedAt`, so logout, admin-forced logout, and device removal actually terminate access.
4. On logout, call a server mutation that revokes the session, then clear local storage.
5. Add idle timeout (15 min is typical for clinical systems) and absolute session lifetime.

**Test / verification**
- Manual: hand-craft a storage entry with another user's email → app must not authenticate.
- Automated: after `logout`, a captured token must be rejected by the backend.
- Confirm via device filesystem inspection that no credential is readable outside Keychain/Keystore.

---

## 2. High Findings

---

### H-01 — OTP factor is fully bypassable; device trust is decided client-side

**Severity:** High
**Affected:** `convex/auth.ts:87-105` (`storeOTPCode`), `convex/auth.ts:107-127` (`verifyOTPCode`), `convex/auth.ts:7-31`; `src/hooks/useAuth.js:101,121-132`

**What is wrong**
Three independent defeats of the OTP step:
1. The OTP is stored on the account document (`verificationCode`, `convex/schema.ts:15`) and returned by the public `getAccountByEmail` (C-03) — an attacker reads the code directly.
2. `verifyOTPCode` (`convex/auth.ts:107`) has **no attempt limit**. A 6-digit code has 10⁶ possibilities and a 10-minute window; unthrottled, exhaustive guessing is straightforward.
3. The code is generated with `Math.random()` (`convex/auth.ts:95`), which is not cryptographically secure (see H-08).

Separately, device trust is evaluated **on the client**:
```js
// src/hooks/useAuth.js:101
const trusted = account.trustedDevices?.includes(activeDeviceId) || false;
```
The server never enforces it. A modified client simply sets `trusted = true`.

> Per the review scope, the deliberate absence of 2FA/MFA is **not** being reported. This finding is different: it concerns the OTP mechanism that *is* implemented and shipping, and the device-trust control that is advertised to users as protecting their account.

**Exploit scenario**
Attacker calls `getAccountByEmail` for the target, reads `verificationCode`, submits it to `verifyOTPCode`, then reads `password` from the same response — bypassing both the email-possession check and the password. Device approval is then skipped client-side.

**Impact**
The login flow provides no meaningful barrier beyond knowing a staff email address. Users and admins believe device approval protects them; it does not.

**Concrete fix**
1. Never expose `verificationCode` (fixed by C-03; also move to a separate secrets table).
2. Store only a **hash** of the OTP; compare hashes.
3. Rate-limit: max 5 attempts per account per 15 min, then lock and alert. Invalidate the code on first failure burst.
4. Generate with `crypto.getRandomValues()`.
5. Enforce device trust **server-side** — on every request, check the presented device ID against `trustedDevices`; reject if absent. Bind the device ID to the session token.

**Test / verification**
- Automated: 6 wrong OTP submissions → 6th throws rate-limit error.
- Automated: valid OTP for device X + request from device Y → rejected.
- Confirm OTP never appears in any query response.

---

### H-02 — Convex file storage is completely open (upload, read, delete)

**Severity:** High
**Affected:** `convex/files.ts:5-10,12-17,19-25,27-47,49-71,73-84`; `convex/messages.ts:172`; `convex/channels.ts:59-61`

**What is wrong**
Every storage operation is an ungated public mutation/query:

```ts
// convex/files.ts:5-10 — anyone can obtain a signed upload URL
export const generateUploadUrl = mutation({ args: {}, handler: async (ctx) =>
  await ctx.storage.generateUploadUrl() });

// convex/files.ts:12-17 — anyone can turn any storageId into a signed download URL
export const getStorageUrl = query({ args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => await ctx.storage.getUrl(args.storageId) });

// convex/files.ts:73-84 — anyone can permanently delete any file
export const deleteFileRecord = mutation({ args: { id: v.id("files") }, ... });
```

`listByPatient` (`:49-71`) returns every file attached to a patient **with resolved signed URLs** — scans, lab results, consent forms, ID photos. `uploadFileRecord` (`:27-47`) accepts an arbitrary `uploadedBy` string and performs no validation of filename, MIME type, or size.

**Exploit scenario**
`files:listFiles` enumerates all records; `files:listByPatient` yields signed URLs to medical documents. Those URLs, once issued, are bearer credentials that can be shared freely. Destructively, `deleteFileRecord` in a loop destroys all clinical attachments — with no backup path defined (M-11).

**Impact**
Mass exfiltration of medical documents and identity photos; unauthenticated destruction of clinical records; storage abused as free anonymous file hosting under the clinic's domain (a phishing/malware-hosting reputational risk).

**Concrete fix**
1. Gate all six functions with `requireAccount` + the appropriate permission.
2. `listByPatient` / `getStorageUrl`: verify the caller may access that specific patient before resolving a URL.
3. `deleteFileRecord`: require an archive permission; prefer soft-delete with retention (clinical records generally must not be hard-deleted).
4. On upload: validate MIME type against an allowlist, cap file size, sanitise/normalise filenames (never trust `args.name` in any path context), and derive `uploadedBy` server-side.
5. Consider AV scanning for uploads reaching clinical staff.

**Test / verification**
- Unauthenticated `generateUploadUrl` → rejected.
- Staff member without `viewPatients` requesting another patient's file URL → rejected.
- Upload of a `.exe` or oversized file → rejected.

---

### H-03 — Telehealth consultation rooms are publicly listed and have no lobby

**Severity:** High
**Affected:** `convex/telehealth.ts:186-194,151-156,211-234,6-71`; `src/screens/clinic/TelehealthCallScreen.js:176-189`

**What is wrong**
`listActive` is a public query returning every live session document including `roomUrl`:

```ts
// convex/telehealth.ts:186-194
export const listActive = query({ args: {}, handler: async (ctx) =>
  await ctx.db.query("telehealthSessions").withIndex("by_status", q => q.eq("status","active")).collect() });
```

The room is a public `meet.jit.si` URL (`convex/telehealth.ts:31-32`) built from `Date.now()` plus `Math.random()`, with the pre-join gate explicitly disabled client-side:

```js
// src/screens/clinic/TelehealthCallScreen.js:180
'config.prejoinPageEnabled=false',
```

`startSession` (`:6`) also accepts an arbitrary `customRoomUrl` (`:14`) which is loaded straight into a `WebView` (`src/screens/clinic/TelehealthCallScreen.js:313`).

**Exploit scenario**
Poll `telehealth:listActive`, take any `roomUrl`, open it — you are silently inside a live doctor–patient consultation, with no lobby, no password, and no admission prompt. Separately, an attacker calls `startSession` with `customRoomUrl` pointing at an attacker-controlled page, which the clinician's WebView then renders (phishing for credentials inside a trusted app frame).

**Impact**
Live eavesdropping on clinical consultations — among the most sensitive PHI disclosures possible, and undetectable to the participants. The `customRoomUrl` path adds in-app phishing and WebView-based attack surface.

**Concrete fix**
1. Gate all telehealth queries; scope `listActive` to sessions where the caller is the provider or a listed invitee.
2. Use authenticated video: Jitsi JWT (JaaS) or a provider with per-participant tokens. Never rely on URL secrecy.
3. Re-enable the pre-join/lobby screen and require explicit admission by the provider.
4. Remove `customRoomUrl`, or validate it strictly against an allowlist of approved hosts before it reaches the WebView.
5. Harden the WebView: `originWhitelist` restricted, `javaScriptEnabled` only as required, disable file access.

**Test / verification**
- Unauthenticated `telehealth:listActive` → rejected; as an unrelated staff member → empty result.
- Join attempt without a valid participant token → rejected by the video provider.
- `startSession` with `customRoomUrl: "https://evil.test"` → rejected.

---

### H-04 — All staff direct messages and channels are readable by anyone

**Severity:** High
**Affected:** `convex/messages.ts:6-24,26-34,36-75,119-152,212-230`; `convex/channels.ts:36-69,19-35,207-235`

**What is wrong**
`listConversations` (`convex/messages.ts:6`) returns **every** conversation in the deployment with no viewer filter — it never checks `conv.members` against a caller. `getMessages` (`:36`) returns any conversation's messages given its ID; the `viewerId` argument (`:37`) is optional and used only to hide messages the *viewer themselves* deleted (`:46`), not to authorize access. `getChannelMessages` (`convex/channels.ts:36`) behaves the same way, and resolves attachment `storageId`s into live signed URLs (`:59-61`).

`deleteMessage`/`editMessage` (`convex/messages.ts:119,140`) do check `msg.senderId !== userId` — but `userId` is a client-supplied argument, so the check is defeated by passing the victim's ID (same class as C-04). `clearAllConversationsAndMessages` (`:212`) and `deleteChannel` (`convex/channels.ts:207`) are ungated destructive mutations.

**Exploit scenario**
`messages:listConversations` enumerates every conversation ID; iterating `messages:getMessages` dumps the clinic's entire internal communications — which, in a clinical setting, routinely contain patient names, conditions, and treatment discussion. Attachments come back as ready-to-use signed URLs.

**Impact**
Full disclosure of staff communications and embedded PHI; ability to impersonate staff by editing their sent messages; unauthenticated destruction of all message history.

**Concrete fix**
1. Derive the viewer from `requireAccount`; filter `listConversations` to conversations whose `members` include the caller.
2. In `getMessages` / `getChannelMessages`, verify membership before returning anything.
3. `deleteMessage` / `editMessage`: compare `msg.senderId` to the **server-derived** identity, never to an argument.
4. Remove `clearAllConversationsAndMessages` from production, or restrict it to admins with confirmation and audit logging.
5. Resolve attachment URLs only after the membership check passes.

**Test / verification**
- Staff A calls `listConversations` → only conversations A belongs to.
- Staff A calls `getMessages` with B-and-C's conversation ID → rejected.
- Staff A calls `editMessage` passing B's `userId` → rejected.

---

### H-05 — Audit log is unauthenticated, forgeable, and does not record reads

**Severity:** High
**Affected:** `convex/activityLogs.ts:4-15,17-29,31-48,50-74`

**What is wrong**
`logActivity` is a public mutation accepting an arbitrary `performedBy` string (`:35`) — anyone can write fabricated entries attributed to anyone. `listActivityLogs` (`:4`) and `getActivityStats` (`:50`) are public reads, so the log is also an intelligence source (it leaks staff emails, patient names in `target`/`details`, and organisational structure).

Critically, logging is only invoked on a handful of *mutations*. **No read of patient data is logged anywhere.** The log is also mutable through the same open backend, so an attacker can append noise or (via other open mutations) tamper with history.

**Exploit scenario**
An attacker exfiltrates the entire patient register (C-06) and **no record of it exists**. Should they wish to misdirect an investigation, they can forge `logActivity` entries implicating a legitimate staff member.

**Impact**
No forensic capability. In a breach you cannot determine what was accessed, by whom, or when — which in most health-privacy regimes forces you to notify **every** patient rather than an affected subset, and undermines any regulatory defence.

**Concrete fix**
1. Remove the public `logActivity` mutation entirely. Convert to an `internalMutation` invoked only server-side, with `performedBy` populated from `requireAccount`.
2. Gate `listActivityLogs` / `getActivityStats` behind `viewActivityLogs`.
3. Log **reads** of PHI: patient view, treatment-note view, file download, report export. This is a baseline expectation for clinical systems.
4. Make logs append-only; ship them to external write-once storage (SIEM or equivalent) so an application-level compromise cannot rewrite them.
5. Add alerting on anomalies: bulk reads, off-hours access, repeated permission failures.

**Test / verification**
- `activityLogs:logActivity` no longer exists in the public API surface.
- Reading a patient record produces exactly one audit entry with the server-derived actor.
- A `member` calling `listActivityLogs` → rejected.

---

### H-06 — Seed and destructive "dev utility" mutations are exposed in production

**Severity:** High
**Affected:** `convex/seed.ts:5`; `convex/seedStock.ts:10,387`; `convex/auth.ts:554-591,594-606,609-619`; `convex/messages.ts:212`; `convex/channels.ts:207`

**What is wrong**
Several destructive maintenance functions are public mutations with no guard:

```ts
// convex/auth.ts:554 — comment says "wipe and rebuild"
export const syncUsersWithStaffAccounts = mutation({ args: {}, ... });
//   :560-561  deletes up to 500 user profiles unconditionally

// convex/auth.ts:594 — "(dev utility)"
export const resetTrustedDevices = mutation({ args: { email: v.string() }, ... });

// convex/auth.ts:609 — "(dev utility)"
export const clearAllDeviceRequests = mutation({ args: {}, ... });
```

`seed.ts:5` is guarded only by an "already seeded" check (`:10-13`); `seedStock.ts:10` writes stock data. Their presence in the production bundle also means the hardcoded credentials in `seed.ts` ship to production.

**Exploit scenario**
`resetTrustedDevices({email:"<admin>"})` clears the admin's trusted devices — a denial-of-service against the admin, and a way to force a re-approval flow the attacker can exploit. `syncUsersWithStaffAccounts` wipes the `users` table. `clearAllDeviceRequests` erases the pending-approval queue, hiding an attacker's own device request from admins.

**Impact**
Unauthenticated data destruction, targeted account lockout, and suppression of the device-approval security control.

**Concrete fix**
1. Delete `seed.ts` and `seedStock.ts` from the deployed backend; run seeding via CLI against dev only, or convert to `internalMutation` (callable from the dashboard/CLI but not from the internet).
2. Convert every "dev utility" to `internalMutation`.
3. Gate `syncUsersWithStaffAccounts` behind an admin permission and make it non-destructive (upsert, not wipe-and-rebuild).
4. Establish a rule: any function whose name contains `seed|clear|reset|sync|wipe|delete all` must be `internalMutation`. Enforce in CI.

**Test / verification**
- Assert none of these names appear in the generated public `api` object.
- Attempt each from an external HTTP client → function-not-found.

---

### H-07 — No rate limiting anywhere; account enumeration on login

**Severity:** High
**Affected:** `src/screens/auth/LoginScreen.js:27-39`; `convex/notifications.ts:112-128`; `convex/auth.ts:107-127,202-222`; entire backend

**What is wrong**
No rate limiting exists on any endpoint — not on login, OTP verification, OTP resend, or bulk data queries. The login flow also discloses account existence explicitly:

```js
// src/screens/auth/LoginScreen.js:29-31
if (result.error === 'Account not found') {
  navigation.navigate('OTP', { email: targetEmail, isNotStaff: true });
```
which renders *"You are not registered as a staff member"* (`src/screens/auth/OTPScreen.js:139`). The backend returns the same distinguishing error from `sendOTPCode` (`convex/notifications.ts:127`) and from `verifyPassword` — `"Account not found"` vs `"Incorrect password"` (`convex/auth.ts:213,217`).

**Exploit scenario**
An attacker submits a wordlist of likely staff addresses and gets a definitive yes/no per address, building a target list. Unthrottled `verifyPassword` then permits unlimited password guessing, and unthrottled `sendOTPCode` allows mail-bombing a staff member (and burning SendGrid quota/reputation).

**Impact**
Efficient account discovery, unlimited credential brute force, OTP brute force (H-01), email flooding, and cost/quota exhaustion. Also a mass-scraping enabler for C-06 — nothing slows a full database dump.

**Concrete fix**
1. Adopt `@convex-dev/rate-limiter`. Suggested budgets: `sendOTPCode` 3/hour/email + 10/hour/IP; `verifyOTPCode` 5/15 min/account; `verifyPassword` 5/15 min/account with exponential backoff and lockout.
2. Return a single generic message for all login failures: *"If this address belongs to a staff account, a verification code has been sent."* Remove the `isNotStaff` branch.
3. Equalise response timing between the found/not-found paths.
4. Add per-identity read quotas on bulk queries to blunt scraping.
5. Alert admins on repeated failures for one account.

**Test / verification**
- Automated: 6 rapid `verifyPassword` calls → 6th rejected.
- Automated: responses and timings for a known vs unknown email are indistinguishable.
- Manual: 10 rapid OTP requests → throttled.

---

### H-08 — Security-critical values generated with `Math.random()`

**Severity:** High
**Affected:** `convex/auth.ts:95,152`; `src/utils/authHelpers.js:254-272,274-276,279-281`; `convex/telehealth.ts:31`

**What is wrong**
`Math.random()` is not a CSPRNG; its internal state can be recovered from a modest number of observed outputs, making subsequent values predictable.

```ts
// convex/auth.ts:95 — OTP
const code = String(Math.floor(100000 + Math.random() * 900000));

// src/utils/authHelpers.js:262-269 — staff passwords
password += upper[Math.floor(Math.random() * upper.length)];

// src/utils/authHelpers.js:280 — device identifier, ~8 chars
return 'device-' + Math.random().toString(36).substring(2, 10);
```

`generateStrongPassword` (`:254`) additionally shuffles with `sort(() => Math.random() - 0.5)`, which is a biased shuffle — it does not produce a uniform permutation. Device IDs (`:280`) carry roughly 41 bits of weak entropy and are the token behind "trusted device."

**Exploit scenario**
An attacker who can observe outputs (e.g. by repeatedly triggering account creation) can predict subsequent generated passwords and OTPs. Weak, guessable device IDs undermine the device-trust control (H-01) — brute-forcing an 8-character base-36 space is feasible.

**Impact**
Predictable OTPs and initial passwords; forgeable device identities. Undermines authentication even after the other fixes land.

**Concrete fix**
1. Server-side (Convex runtime provides Web Crypto): use `crypto.getRandomValues()`.
   ```ts
   const buf = new Uint32Array(1);
   crypto.getRandomValues(buf);
   const code = String(100000 + (buf[0] % 900000));
   ```
2. Move password generation **server-side** — it should never happen on a client (see M-03).
3. Device IDs: use `crypto.randomUUID()` (≥122 bits), generated once and stored in secure storage.
4. Replace the biased shuffle with Fisher–Yates over CSPRNG bytes.
5. Telehealth room IDs: irrelevant once H-03's token auth lands, but use a CSPRNG regardless.

**Test / verification**
- CI grep gate: `Math.random` must not appear in `convex/` or in any auth/crypto path in `src/utils/`.
- Statistical smoke test over 10⁵ generated codes: uniform distribution, no repeats beyond expectation.

---

### H-09 — Hardcoded backdoor auto-trusts a specific account's device

**Severity:** High
**Affected:** `src/hooks/useAuth.js:198-217`

**What is wrong**
A production code path bypasses the device-approval control for one hardcoded email:

```js
// src/hooks/useAuth.js:198-217
// For the admin account in development, auto-trust the device
useEffect(() => {
  if (currentAccount?.email === 'wilburhachita@gmail.com' && isDevicePending) {
    convex.mutation(api.auth.addTrustedDevice, { accountId: currentAccount._id, deviceId })
      .then(() => { ... setIsAuthenticated(true); });
  }
}, [currentAccount, isDevicePending, deviceId, convex]);
```

The comment says "in development," but there is no environment guard — this runs in production builds. `addTrustedDevice` (`convex/auth.ts:364-382`) is itself an ungated public mutation, so any account can be given a trusted device by anyone.

**Exploit scenario**
That email and its password are published in this repository (`NHL_Connect_Tester_Guide.txt:23-24`, C-05). An attacker logs in with those credentials on any device; the backdoor auto-approves the device and grants admin access without admin approval. Independently, `addTrustedDevice` can be called directly for any `accountId`.

**Impact**
A permanent, publicly documented administrative backdoor that defeats the device-approval control entirely.

**Concrete fix**
1. Delete lines `198-217` outright. If emulator convenience is needed, gate on `__DEV__` **and** a non-production Convex deployment — never on an email address.
2. Gate `addTrustedDevice` (`convex/auth.ts:364`) so a device can only be self-registered as *pending*, with approval requiring `approveDevices`.
3. Rotate that account's credentials (C-05) and audit `trustedDevices` on every account for unrecognised entries.

**Test / verification**
- `grep -rn "wilburhachita" src/` returns nothing.
- Login with that account on a fresh device → device-pending state, requires admin approval.
- Unauthenticated `addTrustedDevice` → rejected.

---

### H-10 — Vulnerable dependencies, including critical advisories

**Severity:** High
**Affected:** `package.json`, `package-lock.json`, `apps/desktop/package.json`, `apps/desktop/package-lock.json`

**What is wrong**
`npm audit` reports:
- **Root (mobile):** 27 vulnerabilities — 2 critical, 15 high, 9 moderate, 1 low
- **`apps/desktop`:** 33 vulnerabilities — 3 critical, 26 high, 2 moderate, 2 low

Notable: `ws` (high — uninitialised memory disclosure, GHSA-58qx-3vcg-4xpx, plus memory-exhaustion DoS) reached through **`convex` itself** in both projects; `vite <=6.4.2` (high — `server.fs.deny` bypass, GHSA-fx2h-pf6j-xcff); `@babel/core` (low — arbitrary file read via `sourceMappingURL`). `npm audit fix` resolves most without breaking changes.

Positively, `package.json` scripts contain no `postinstall` or other suspicious lifecycle hooks in either project, and both lockfiles are committed with integrity hashes.

**Exploit scenario**
`ws` uninitialised memory disclosure is reachable through the Convex client's WebSocket transport, potentially leaking adjacent process memory — which in this app holds PHI and session data. The `vite` issue affects the dev server (developer machines), not shipped artifacts.

**Impact**
Memory disclosure in a process handling PHI; DoS against clients; developer-machine exposure via the dev server.

**Concrete fix**
1. Run `npm audit fix` in both projects; re-audit and triage the remainder individually.
2. Upgrade `convex` to a release depending on a patched `ws`; upgrade `vite` past 6.4.2.
3. Enable Dependabot/Renovate with grouped weekly PRs.
4. Add `npm audit --audit-level=high` as a CI gate for both workspaces.
5. Adopt `npm ci` (never `npm install`) in CI so lockfile integrity is enforced.

**Test / verification**
- `npm audit --audit-level=high` exits 0 in both projects.
- App builds and smoke-tests pass post-upgrade.

---

### H-11 — PHI and credentials written to server logs

**Severity:** High
**Affected:** 97 `console` statements across `convex/`; notably `convex/auth.ts:10,17,25,27,41,49,98,116,124,140,205,212,216,219,232-233,359,367,377,413,493,532,603,616,645,661,677,701,733`; `convex/messages.ts:14,29,31,45`; `convex/files.ts:22,39,44`; `convex/activityLogs.ts:12,26,45`

**What is wrong**
Backend logging is verbose and includes identifiers and account state:

```ts
// convex/auth.ts:17
console.log(`[AUTH] ✅ Found account (exact match): ${exact.email} | role: ${exact.role} | onboarded: ${exact.isOnboarded}`);
// convex/auth.ts:216
console.log(`[AUTH] ❌ verifyPassword FAILED — wrong password for ${email}`);
// convex/auth.ts:232-233
console.log(`[AUTH] 📋 completeOnboarding for account: ${accountId}`);
console.log(`[AUTH]    title=${title}, fullName=${fullName}, phone=${phone}`);
```

`completeOnboarding` logs full name and phone number. Auth logs record email plus role plus authentication outcome. Convex retains function logs and forwards them to any configured log stream (Axiom/Datadog), so this PHI/PII propagates to third-party systems, typically with broader access and longer retention than the database.

**Exploit scenario**
Anyone with Convex dashboard read access or access to the log-drain destination — including third-party SaaS staff and any contractor granted observability access — reads staff PII and authentication patterns without touching the database or leaving a database audit trail.

**Impact**
PHI/PII disclosure through a channel outside your access-control model, and log-based reconstruction of who accessed what. Logs are also frequently included in support bundles and screenshots.

**Concrete fix**
1. Remove all identifier interpolation from logs. Log stable opaque IDs (`accountId`) rather than email/name/phone, and never log authentication outcomes tied to an address.
2. Introduce a small logging helper with a redaction allowlist; forbid raw `console.log` in `convex/` via lint rule.
3. Never log password fields, OTPs, or tokens — verify none currently do (none observed, but the pattern is fragile).
4. Set the shortest workable log retention; document it in your data-processing record.
5. Review any configured log streams for third-party exposure.

**Test / verification**
- CI lint rule fails on `console.log` in `convex/`.
- Run the login and onboarding flows; grep captured logs for the test user's email/phone/name → zero hits.

---

### H-12 — Staff payroll and salary data publicly readable

**Severity:** High
**Affected:** `convex/payroll.ts:47-55,57-62,66-74,109-195,196-227,228-276`

**What is wrong**
Salary configuration and payroll records are exposed via ungated queries:

```ts
// convex/payroll.ts:57-62
export const listSalaryConfigs = query({ args: {}, handler: async (ctx) =>
  await ctx.db.query("staffSalaryConfig").collect() });
```

`getSalaryConfig` (`:47`) takes a `userId` argument with no ownership check — classic IDOR. The payroll mutations (`generatePayroll` `:109`, `approvePayroll` `:196`, `markPaid` `:228`) carry no permission checks either.

**Exploit scenario**
One unauthenticated call returns every staff member's salary. Any staff member can read colleagues' and executives' compensation. `markPaid`/`approvePayroll` can be invoked by anyone, corrupting financial records and potentially triggering improper payments.

**Impact**
Serious HR/privacy breach with real internal fallout; financial-record integrity loss; fraud exposure.

**Concrete fix**
1. Gate all payroll queries behind `viewFinancials`; restrict `listSalaryConfigs` to admins.
2. `getSalaryConfig`: allow only the owner (server-derived identity) or an admin.
3. Gate `generatePayroll` / `approvePayroll` / `markPaid` behind `manageReports`/admin, and require separation of duties (the approver must differ from the generator).
4. Audit-log every payroll approval and payment.

**Test / verification**
- Staff A calls `getSalaryConfig({userId: B})` → rejected.
- `member` calls `listSalaryConfigs` → rejected.
- The same account cannot both generate and approve one payroll run.

---

## 3. Medium Findings

---

### M-01 — Third-party API key hardcoded in the mobile bundle
**Severity:** Medium | **Affected:** `src/components/chat/ChatBubble.js:39`

A Geoapify key is embedded in client source: `...&apiKey=0ddb714e7a8942cdbe2b4f52c4ebb21d`. It ships in the APK and is recoverable by anyone. **Exploit:** extract and abuse the key, exhausting quota and billing the clinic; the key is also unrestricted as written. **Impact:** financial abuse, service disruption. **Fix:** rotate the key; proxy static-map requests through a Convex action so the key stays server-side; apply Geoapify referrer/IP restrictions; add usage alerts. **Test:** `grep -rn "apiKey=" src/` returns nothing; map tiles still render via the proxy.

### M-02 — Unvalidated URLs opened from message content and loaded into a WebView
**Severity:** Medium | **Affected:** `src/components/chat/ChatBubble.js:91,134`; `src/screens/clinic/TelehealthCallScreen.js:269,313`; `apps/desktop/electron/main.cjs:173-176`

`Linking.openURL(message.fileUrl)` (`ChatBubble.js:134`) passes a database-controlled string straight to the OS handler; since any attacker can write messages (H-04), the value is untrusted. Schemes such as `javascript:`, `file:`, `intent:` and custom app schemes become reachable. In Electron, `shell.openExternal(href)` (`main.cjs:173`) likewise forwards any URL to the OS without scheme validation. **Exploit:** a crafted `fileUrl` triggers an unintended local handler or drives the user to a credential-phishing page from inside a trusted app. **Impact:** phishing, local scheme abuse, possible local file access. **Fix:** validate every URL against an `https:`-only allowlist (plus `tel:`/`mailto:` where intended) before `openURL`/`openExternal`; for storage files, resolve through your own signed-URL helper rather than trusting the stored string; restrict `WebView` with `originWhitelist`. **Test:** a message with `fileUrl: "javascript:alert(1)"` or `file:///etc/passwd` opens nothing.

### M-03 — Staff credentials generated client-side, then sent via clipboard and plaintext `mailto:`
**Severity:** Medium | **Affected:** `src/screens/more/AdminAddStaffScreen.js:65-70,72-85`; `src/utils/authHelpers.js:254-272`

The new-staff password is generated on the device (`authHelpers.js:254`, with `Math.random()` — H-08), copied to the system clipboard (`:67`), and emailed as plaintext through the user's own mail client (`:84`). **Exploit:** the Android/iOS clipboard is readable by other apps and syncs across devices (Universal Clipboard, Windows Cloud Clipboard); the `mailto:` body traverses mail servers in cleartext and persists in Sent folders indefinitely. **Impact:** credential disclosure at provisioning time for every account created. **Fix:** generate the password server-side with a CSPRNG and never return it to the admin's client; instead send the new staff member a **single-use, short-lived invite link** that forces them to set their own password; if a clipboard copy is retained, use an auto-expiring clipboard entry and warn the user. **Test:** the admin UI never displays a password; the invite link expires after use and after 24h.

### M-04 — No server-side session invalidation or revocation
**Severity:** Medium | **Affected:** `src/hooks/useAuth.js:158-164`; `apps/desktop/src/hooks/useAuth.ts:46-49`; `convex/auth.ts:488-506`

`logout()` only clears local state. Because there is no server-side session (C-07), nothing can be revoked. `deactivateStaffAccount` (`convex/auth.ts:488`) sets `isActive: false`, but with no session store a client that has already cached the account continues to function, and there is no way to terminate an in-flight session. Removing a trusted device has no effect on an active session either. **Exploit:** a terminated employee's device retains working access; a stolen device cannot be cut off. **Impact:** no ability to respond to device loss or offboarding — a core incident-response gap. **Fix:** implement the `sessions` table from C-07 with `revokedAt`; add an admin "sign out all devices" action; check `isActive` and session revocation on every request; revoke all sessions automatically on deactivation and on device removal. **Test:** deactivate an account with a live session → next request fails within one token lifetime; "sign out all devices" immediately invalidates every session.

### M-05 — `.env` committed; `.gitignore` does not cover it
**Severity:** Medium | **Affected:** `apps/desktop/.env`; `.gitignore:29-30`; `args.json`

`.gitignore` ignores `.env*.local` only, which does not match a bare `.env` — so `apps/desktop/.env` is tracked, exposing the production Convex deployment URL. `args.json` commits a personal email address. No `.env.example` exists to document required variables. **Exploit:** the deployment URL is the one prerequisite for exploiting C-01 through C-06. **Impact:** removes the last (very thin) layer of obscurity around an unauthenticated backend. **Fix:** add `.env`, `.env.*`, `!.env.example` to `.gitignore`; `git rm --cached apps/desktop/.env`; add a committed `.env.example` with empty placeholders; supply real values through EAS secrets and the Convex dashboard. Note the URL itself is low-sensitivity **once authentication exists** — fixing C-01 is what actually matters here. **Test:** `git ls-files | grep -E "\.env$"` returns nothing; a clean clone builds from `.env.example` instructions.

### M-06 — OTP code embedded in the email `<title>` element
**Severity:** Medium | **Affected:** `convex/notifications.ts:139`

`<title>${code} is your NHL Connect verification code</title>`. Many mail clients surface the title/preheader in notification previews and lock-screen banners. **Exploit:** shoulder-surfing or a locked-screen notification reveals the OTP without unlocking the device — precisely the scenario the OTP is meant to defend. **Impact:** OTP disclosure via device lock screen. **Fix:** remove the code from the title and any preheader text; use a neutral title ("Your NHL Connect verification code") and place the digits in the body only; consider setting an explicit preheader that omits the code. **Test:** trigger an OTP email and confirm no lock-screen preview on iOS/Android reveals the digits.

### M-07 — `dangerouslySetInnerHTML` on a mapped value (pattern risk)
**Severity:** Medium | **Affected:** `apps/desktop/src/screens/settings/SettingsScreen.tsx:305`

`<span ... dangerouslySetInnerHTML={{ __html: f.value }} />` renders values from a mapped array. **This is not currently exploitable** — the three entries at `:298-301` are hardcoded literals, present only so `&amp;` renders as `&`. The risk is that the sink is one refactor away from receiving database-sourced content (e.g. clinic settings via the ungated `clinicConfig.set`, `convex/clinicConfig.ts:27`), at which point it becomes stored XSS in an Electron renderer. **Impact:** if it regresses, script execution in the desktop app's renderer context. **Fix:** replace with a plain `{f.value}` and use the literal `&` character in the data; if HTML is ever genuinely needed, sanitise with DOMPurify. Also gate `clinicConfig.set` behind `editClinicSettings`. **Test:** a lint rule (`react/no-danger`) fails the build on new occurrences; the `&` still renders correctly.

### M-08 — DevTools openable in production Electron builds
**Severity:** Medium | **Affected:** `apps/desktop/electron/main.cjs:161-170`

An unconditional `before-input-event` handler opens DevTools on F12 in **any** build — the comment states this explicitly ("always visible in production via F12"). **Exploit:** on a shared clinic workstation, anyone presses F12 and gains a JavaScript console in the app's origin — enough to read `localStorage` (forging the session, C-07), inspect cached PHI, and call Convex functions directly. **Impact:** trivial local escalation and PHI inspection on shared machines. **Fix:** gate the handler on `isDev`; ship production builds with DevTools disabled. If field diagnostics are needed, use a hidden key sequence plus a support-issued unlock code, and log its use. **Test:** F12 in a packaged build does nothing; in `npm run dev` it still opens.

### M-09 — No Content Security Policy in the Electron renderer
**Severity:** Medium | **Affected:** `apps/desktop/index.html`; `apps/desktop/electron/main.cjs:124-130`

The renderer's `webPreferences` are otherwise sound (`contextIsolation: true`, `nodeIntegration: false`, `webSecurity: true` — good), but no CSP is set via meta tag or `onHeadersReceived`. **Exploit:** with no CSP, any injected markup (see M-07) can load remote scripts and exfiltrate to an arbitrary origin. **Impact:** removes defence-in-depth against XSS; widens the blast radius of any injection. **Fix:** add a strict CSP — `default-src 'self'; script-src 'self'; connect-src 'self' https://*.convex.cloud https://*.convex.site; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; object-src 'none'; frame-ancestors 'none'`. Also add `sandbox: true` to `webPreferences` if the preload permits. **Test:** the app functions normally under CSP; an injected `<script src="https://evil.test">` is blocked with a console violation.

### M-10 — Financial working data persisted to `localStorage`
**Severity:** Medium | **Affected:** `apps/desktop/src/screens/operations/LedgerWorkbook.tsx:36,55`

The ledger grid is persisted unencrypted: `localStorage.setItem('niche_ledger_workbook', JSON.stringify(grid))`. **Exploit:** on a shared workstation, any user profile with filesystem access to the Electron user-data directory reads the clinic's financial working papers; it also survives logout, since `logout()` clears only the session key. **Impact:** financial data disclosure and persistence beyond session lifetime. **Fix:** persist working drafts server-side against the authenticated user, or use Electron `safeStorage` for local encryption at rest; clear all app-scoped storage on logout, not just the session key. **Test:** log out → `localStorage` contains no ledger data; inspect the user-data directory for plaintext financial content.

### M-11 — No environment separation, backups, or incident-response plan
**Severity:** Medium | **Affected:** `eas.json:1-14`; `apps/desktop/.env`; repository-wide (no CI/CD, no runbooks)

A single Convex deployment appears to serve both development and production — `apps/desktop/.env` hardcodes one URL, and `seed.ts`/`seedStock.ts` (with fixed credentials) are deployed alongside production code (H-06). `eas.json` defines `preview` and `production` build profiles but no distinct environment variables. There is no `.github/workflows/`, no documented backup or restore procedure, no retention policy, and no incident-response runbook — despite `NHL_Connect_Tester_Guide.txt` indicating live tester activity. **Exploit:** a developer running `seed:seedAll` or a "dev utility" against production destroys or corrupts live patient data with no verified restore path. **Impact:** potential unrecoverable loss of clinical records; inability to meet breach-notification timelines. **Fix:** create separate `dev`/`staging`/`prod` Convex deployments with distinct URLs and keys; block deploys of seed/dev functions to prod in CI; enable and **test** Convex backups on a schedule, storing exports encrypted with restricted access; document RPO/RTO; write an incident-response runbook covering credential rotation, session revocation, log preservation, and patient notification; add CI (lint, tests, `npm audit`, secret scan) gating deploys. **Test:** perform a restore drill from backup into staging and verify data integrity; confirm `seed:*` is absent from the production API surface.

### M-12 — Permission override array is unvalidated and replaces the role wholesale
**Severity:** Medium | **Affected:** `convex/utils/permissions.ts:152-155`; `convex/auth.ts:721-757`

```ts
// convex/utils/permissions.ts:152-155
if (account.permissions && Array.isArray(account.permissions)) {
  return account.permissions.includes(permission);   // role matrix bypassed entirely
}
```
`updateStaffRoleAndPermissions` (`convex/auth.ts:725`) accepts `permissions: v.array(v.string())` — arbitrary strings, never validated against `PERMISSION_KEYS`. Once any override array is set, the role matrix is ignored completely, so a `member` with `permissions: ['adminPanel']` is an admin regardless of role, and the client's separate copy of the matrix (`src/utils/authHelpers.js:61-238`) can drift out of sync with the backend's (`convex/utils/permissions.ts:48-115`). The behaviour does fail closed for an empty array. **Exploit:** combined with C-04, any caller sets an arbitrary permission array on any account. Even after C-04 is fixed, typos silently grant or revoke access with no error. **Impact:** silent privilege escalation and confusing, unauditable authorization state. **Fix:** validate every entry against `PERMISSION_KEYS` and reject unknown keys; treat overrides as *additive/subtractive deltas* on the role rather than a full replacement, or make the replacement explicit in the UI; extract the permission matrix into one shared module imported by backend, mobile, and desktop so it cannot drift; log every permission change to the audit trail. **Test:** setting `permissions: ['notARealPermission']` → rejected; the three matrix copies are replaced by one shared source and a test asserts equality.

---

## 4. Low Findings

**L-01 — Type-confusion fallback in `checkPermission`** (`convex/utils/permissions.ts:137-147`). `db.get(emailOrId as any)` inside a `try {} catch {}` that silently suppresses errors, then duck-types the result: any document with `role`, `isActive` and `email` fields is accepted as a staff account. Fragile and hard to audit. **Fix:** remove the fallback; resolve identity solely from the verified token (C-01). Never `catch {}` silently in an authorization path.

**L-02 — Unbounded `.collect()` on growing tables** (`convex/archive.ts:6-10`; `convex/auth.ts:48,58,79,427,461,612,625,634-635`; `convex/messages.ts:9`; `convex/payroll.ts:60`). Contradicts the project's own Convex guidelines ("ALWAYS return a bounded collection"). Availability risk as tables grow, and each call returns more data to an attacker in one request. **Fix:** replace with `.take(n)` or `paginate()`.

**L-03 — Weak seeded passwords** (`convex/seed.ts:27,35,43,51,59,67`). `Doctor123!`, `Nurse123!` etc. match common wordlist patterns. **Fix:** covered by C-05's CSPRNG generation; add a password policy (length ≥ 12, breach-list check via k-anonymity HIBP API) enforced server-side.

**L-04 — Personal email committed in `args.json`** (`args.json:1`) — `{"email":"ecobrood@gmail.com"}`. Minor PII in version control; also unclear whether this file is still used. **Fix:** remove the file or strip the value.

**L-05 — No jailbreak/root detection or screenshot protection**. Given C-07's plaintext local session and on-screen PHI, mobile clinical apps commonly add `FLAG_SECURE` (Android) / screenshot blur (iOS) on PHI screens, and warn on compromised devices. **Fix:** add `expo-screen-capture` `preventScreenCaptureAsync()` on patient/treatment screens; consider root/jailbreak detection as a warning signal. Lower priority than fixing the storage itself.

**L-06 — No biometric or passcode re-authentication**. There is no local re-auth gate before viewing PHI on an already-unlocked device, and no idle lock. **Fix:** after the session work in C-07, add `expo-local-authentication` to re-authenticate on resume and after idle timeout. *(This is a device-local access control, distinct from the intentionally deferred 2FA/MFA — see §6.)*

---

## 5. Fix Plan

Ordered by risk and implementation dependency. Phase 0 is containment and should begin immediately; Phases 1–2 are the structural rebuild that everything else depends on.

### Phase 0 — Emergency containment (today, before any code work)

These are independent of each other and require no refactoring.

| # | Action | Findings | Effort |
|---|---|---|---|
| 0.1 | **Rotate every credential**: the admin password, all six staff passwords in the tester guide, `SENDGRID_API_KEY`, the Geoapify key | C-05, M-01 | 1h |
| 0.2 | **Restrict the deployment.** If real patient data is present, take the production deployment offline or IP-restrict it until Phase 1 lands. If it holds only test data, confirm that in writing before proceeding | C-01 | 1h |
| 0.3 | **Delete or internalise seed/dev-utility functions** (`seed.ts`, `seedStock.ts`, `syncUsersWithStaffAccounts`, `resetTrustedDevices`, `clearAllDeviceRequests`, `clearAllConversationsAndMessages`) | H-06 | 2h |
| 0.4 | **Strip credentials from the repo**: tester guide, `mockAuth.js`, `seed.ts`; untrack `apps/desktop/.env`; fix `.gitignore` | C-05, M-05 | 2h |
| 0.5 | **Remove the hardcoded device-trust backdoor** (`useAuth.js:198-217`) | H-09 | 15m |
| 0.6 | **Project sensitive fields out of auth queries** — even before full auth, stop returning `password`/`verificationCode` | C-03 | 1h |
| 0.7 | **Preserve and review existing logs** for signs of prior unauthorised access; assess breach-notification obligations | H-05 | — |

### Phase 1 — Authentication foundation (week 1) — *blocks everything below*

| # | Action | Findings | Depends on |
|---|---|---|---|
| 1.1 | Select and integrate the identity provider (Privy per `docs/planning/master-plan/04-auth.md`, or Clerk/Auth0); create `convex/auth.config.ts` | C-01 | 0.1 |
| 1.2 | Switch both clients to `ConvexProviderWithAuth`; store tokens in `expo-secure-store` / Electron `safeStorage` | C-01, C-07 | 1.1 |
| 1.3 | Add `tokenIdentifier` + index to `staffAccounts`; build `requireAccount(ctx)` | C-01 | 1.1 |
| 1.4 | Add the `sessions` table with revocation; wire real logout, "sign out all devices", and revoke-on-deactivation | C-07, M-04 | 1.3 |
| 1.5 | Move passwords to Argon2id in a Node action; drop the plaintext field; force a global password reset | C-02 | 1.3 |

### Phase 2 — Authorization rebuild (week 2)

| # | Action | Findings | Depends on |
|---|---|---|---|
| 2.1 | Replace `checkPermission(db, emailOrId, ...)` with `requirePermission(ctx, ...)`; delete every identity argument from every signature | C-04, L-01 | 1.3 |
| 2.2 | Gate **all 258** functions. Work file-by-file; treat "no gate" as a build failure | C-06, H-02, H-03, H-04, H-05, H-12 | 2.1 |
| 2.3 | Add ownership/membership checks: conversations, channels, files, telehealth, salary configs, private treatment notes | H-02, H-03, H-04, H-12, C-06 | 2.2 |
| 2.4 | Consolidate the three permission matrices into one shared module; validate override arrays against `PERMISSION_KEYS` | M-12 | 2.1 |
| 2.5 | Rewrite `backendPermissions.test.ts` as `convex-test` integration tests using `t.withIdentity()`; add the per-role × per-function matrix as a CI gate | all | 2.2 |

### Phase 3 — Authentication hardening (week 3)

| # | Action | Findings | Depends on |
|---|---|---|---|
| 3.1 | Add `@convex-dev/rate-limiter` to login, OTP verify, OTP resend, password verify | H-07, H-01 | 1.5 |
| 3.2 | Replace all `Math.random()` in security paths with `crypto.getRandomValues()`; hash stored OTPs | H-08, H-01 | 1.5 |
| 3.3 | Enforce device trust server-side; bind device ID to session | H-01 | 1.4 |
| 3.4 | Generic login errors; equalise timing; remove the "not registered as staff" disclosure | H-07 | 3.1 |
| 3.5 | Server-side invite links replacing client-generated passwords over clipboard/`mailto:` | M-03 | 1.5 |

### Phase 4 — Data protection and telemetry (week 4)

| # | Action | Findings |
|---|---|---|
| 4.1 | Purge identifiers from all backend logs; add a redaction helper and a lint rule | H-11 |
| 4.2 | Audit-log PHI **reads**; make logs append-only; ship to external write-once storage | H-05 |
| 4.3 | Apply data minimisation to list projections (drop `bankAccountNumber`, `nrcNumber`, `policyNumber` from list views) | C-06 |
| 4.4 | Enable and **test-restore** encrypted Convex backups; document RPO/RTO | M-11 |
| 4.5 | Field-level encryption for the highest-sensitivity fields (bank account, NRC) so a DB export alone does not expose them | C-06, M-11 |
| 4.6 | Remove OTP from the email title/preheader | M-06 |

### Phase 5 — Client and platform hardening (week 5)

| # | Action | Findings |
|---|---|---|
| 5.1 | `npm audit fix` in both projects; upgrade `convex` and `vite`; enable Dependabot; add audit CI gate | H-10 |
| 5.2 | URL allowlist validation before every `openURL` / `openExternal`; restrict `WebView` origins; remove `customRoomUrl` | M-02, H-03 |
| 5.3 | Gate Electron DevTools on `isDev`; add a strict CSP; replace `dangerouslySetInnerHTML` | M-08, M-09, M-07 |
| 5.4 | Proxy the Geoapify key server-side | M-01 |
| 5.5 | Move ledger drafts off `localStorage`; clear all app storage on logout | M-10 |
| 5.6 | Screenshot protection on PHI screens; biometric re-auth on resume and idle lock | L-05, L-06 |
| 5.7 | Replace unbounded `.collect()` with `.take()`/pagination | L-02 |

### Phase 6 — Operational maturity (ongoing)

Separate dev/staging/prod Convex deployments (M-11); CI pipeline with lint, tests, `npm audit`, and secret scanning gating deploys; incident-response runbook; anomaly alerting on bulk reads and off-hours access; scheduled restore drills; and a re-review of this report once Phases 1–2 land.

---

## 6. Not In Scope / Accepted Risk

**Two-factor / multi-factor authentication (2FA/MFA) is intentionally disabled** for the time being. This was a deliberate product decision by the project owner. Its absence is **not** reported as a finding here, must not be treated as a blocker for this review, and should not be raised in future reviews unless the decision is revisited.

To be precise about the boundary, since several findings sit adjacent to it:

- **Not reported:** the absence of a second authentication factor (TOTP, hardware key, push approval, SMS as a second factor).
- **Reported anyway, and out of that exemption:** defects in the **email OTP mechanism that is currently implemented and shipping** (H-01, M-06). This flow is live in `convex/auth.ts:87-127` and `src/screens/auth/OTPScreen.js`, is presented to users as a security control, and is currently bypassable outright. A shipped control that does not work is a different matter from a control deliberately not shipped.
- **Reported anyway:** the **device-trust/approval** control (H-01, H-09). This is an independent control with its own admin approval workflow (`src/screens/more/AdminDeviceApprovalsScreen.js`), advertised to users, and currently enforced only client-side with a hardcoded bypass.
- **Reported anyway (Low):** **local device re-authentication** — biometric/passcode gating and idle lock (L-06). This protects PHI on an already-unlocked shared device and is a device-local access control, not a second authentication factor.

**Other accepted context:**

- The Convex **deployment URL** (`apps/desktop/.env`) is low-sensitivity *by design* — once C-01 is fixed, knowing the URL confers nothing. It is flagged (M-05) only because today it is the sole prerequisite for full compromise. Do not over-invest in hiding it; invest in C-01.
- **Client-side permission checks** (`src/utils/authHelpers.js`, `apps/desktop/src/utils/permissions.ts`) are legitimate UX affordances for hiding inapplicable UI. They are not a security failing *provided* the server enforces independently (Phase 2). They are only dangerous today because no server-side enforcement exists.
- `vite` and `@babel/core` advisories (H-10) affect **developer machines and build tooling**, not shipped artifacts. They should be patched, but they are not production exposure.
- The **Electron renderer baseline** (`contextIsolation: true`, `nodeIntegration: false`, `webSecurity: true`, `setWindowOpenHandler` denying in-app navigation, `Menu.setApplicationMenu(null)`) is correctly configured — noted here as a positive, with only CSP, DevTools gating, and `openExternal` validation outstanding.
- **Lockfile integrity** is sound: both `package-lock.json` files are committed with integrity hashes, and no suspicious `postinstall` or lifecycle scripts were found in either project's `package.json`.

---

## 7. Data Unreadable Unless Authorized — Checklist

Current state of the guarantee *"sensitive data is unreadable unless the requester is authenticated and authorized."*

Legend: ❌ fails · ⚠️ partial · ✅ passes

### Authentication

| # | Control | Status | Evidence | Fix |
|---|---|---|---|---|
| A1 | Backend requires proof of identity | ❌ | No `convex/auth.config.ts`; zero `ctx.auth` uses | C-01 / 1.1–1.3 |
| A2 | Client transmits a credential | ❌ | `ConvexProvider`, not `ConvexProviderWithAuth` (`App.js:30`) | C-01 / 1.2 |
| A3 | Sessions are signed, expiring tokens | ❌ | Session is a plaintext email (`useAuth.js:87`) | C-07 / 1.4 |
| A4 | Passwords hashed at rest | ❌ | Plaintext compare (`auth.ts:215`) | C-02 / 1.5 |
| A5 | Credentials never returned to clients | ❌ | `getAllStaffAccounts` returns `password` | C-03 / 0.6 |
| A6 | OTP unguessable and unreadable | ❌ | `Math.random()`; exposed via query | H-01, H-08 / 3.2 |
| A7 | Brute force throttled | ❌ | No rate limiting anywhere | H-07 / 3.1 |
| A8 | No account enumeration | ❌ | "not registered as a staff member" | H-07 / 3.4 |
| A9 | Device trust enforced server-side | ❌ | Client-side check + hardcoded bypass | H-01, H-09 / 3.3 |

### Authorization

| # | Control | Status | Evidence | Fix |
|---|---|---|---|---|
| B1 | Identity derived server-side, never from args | ❌ | `checkPermission(db, emailOrId, …)` | C-04 / 2.1 |
| B2 | Every query gated | ❌ | 6 of 44 files import the helper; reads ungated | C-06 / 2.2 |
| B3 | Every mutation gated | ❌ | 36 checks across 258 functions, all bypassable | C-04 / 2.2 |
| B4 | Ownership/membership enforced (IDOR) | ❌ | Messages, files, salary, telehealth all open | H-02/03/04/12 / 2.3 |
| B5 | `isPrivate` treatment notes enforced | ❌ | Field stored (`schema.ts:509`), never checked | C-06 / 2.3 |
| B6 | Admin paths protected | ❌ | Role change via arg-supplied email | C-04 / 2.1 |
| B7 | Permission values validated | ❌ | Arbitrary strings accepted (`auth.ts:725`) | M-12 / 2.4 |
| B8 | Single source of truth for the matrix | ❌ | Three divergent copies | M-12 / 2.4 |
| B9 | Seed/dev functions unreachable in prod | ❌ | Public mutations | H-06 / 0.3 |

### Storage (Convex file storage)

| # | Control | Status | Evidence | Fix |
|---|---|---|---|---|
| C1 | Upload requires authorization | ❌ | `generateUploadUrl` public (`files.ts:5`) | H-02 / 2.2 |
| C2 | Download URL requires authorization | ❌ | `getStorageUrl` public (`files.ts:12`) | H-02 / 2.2 |
| C3 | Per-patient file access checked | ❌ | `listByPatient` returns signed URLs (`files.ts:49`) | H-02 / 2.3 |
| C4 | Deletion restricted | ❌ | `deleteFileRecord` public (`files.ts:73`) | H-02 / 2.2 |
| C5 | Upload type/size validated | ❌ | No validation | H-02 / 2.2 |
| C6 | Signed URLs short-lived and scoped | ⚠️ | Convex defaults; issued without any check | H-02 / 2.3 |

### Logs

| # | Control | Status | Evidence | Fix |
|---|---|---|---|---|
| D1 | No PII/PHI in server logs | ❌ | 97 statements; name/phone/email logged | H-11 / 4.1 |
| D2 | No credentials/OTP in logs | ⚠️ | None observed, but no policy or lint gate | H-11 / 4.1 |
| D3 | Audit log tamper-resistant | ❌ | Public, forgeable `logActivity` | H-05 / 4.2 |
| D4 | PHI **reads** audited | ❌ | Not logged at all | H-05 / 4.2 |
| D5 | Log retention bounded and documented | ❌ | Undefined | H-11 / 4.1 |

### Cache and client state

| # | Control | Status | Evidence | Fix |
|---|---|---|---|---|
| E1 | Tokens in Keychain/Keystore | ❌ | `expo-secure-store` installed, never imported | C-07 / 1.2 |
| E2 | No sensitive data in `AsyncStorage` | ❌ | Session email (`useAuth.js:87`) | C-07 / 1.2 |
| E3 | No sensitive data in `localStorage` | ❌ | Session + ledger (`LedgerWorkbook.tsx:55`) | C-07, M-10 / 5.5 |
| E4 | Client state cleared on logout | ⚠️ | Session key only; ledger persists | M-10 / 5.5 |
| E5 | Screenshot protection on PHI screens | ❌ | Not implemented | L-05 / 5.6 |
| E6 | Idle lock / re-auth on resume | ❌ | Not implemented | L-06 / 5.6 |
| E7 | No PHI in URLs or deep links | ✅ | Navigation params only; no web routing of PHI | — |
| E8 | No PHI in push notifications | ⚠️ | In-app only today; `body` text would carry PHI if push is added (`telehealth.ts:61`) | Review before enabling push |

### Exports, backups, telemetry

| # | Control | Status | Evidence | Fix |
|---|---|---|---|---|
| F1 | Export/report paths authorized | ❌ | `archive:listArchived` fully public | C-06 / 2.2 |
| F2 | Backups configured and encrypted | ❌ | None documented | M-11 / 4.4 |
| F3 | Restore tested | ❌ | No drill | M-11 / 4.4 |
| F4 | A stolen DB export would be unreadable | ❌ | Plaintext passwords; unencrypted bank/NRC fields | C-02, 4.5 |
| F5 | Third-party telemetry excludes PHI | ✅ | No analytics/crash SDK present — keep it that way, or gate PHI redaction before adding one | — |
| F6 | Client-exposed keys minimised | ❌ | Geoapify key in bundle (`ChatBubble.js:39`) | M-01 / 5.4 |
| F7 | Prod/dev environments separated | ❌ | Single deployment | M-11 / 6 |

**Summary: 3 of 44 controls currently pass.** The single change that moves the most rows is Phase 1 + Phase 2 — authentication plus server-derived authorization. Most remaining items are meaningful only once those land.

---

## 8. Methodology and Coverage

**Reviewed:** all 44 files in `convex/` (schema, 258 functions, permission helper, tests); `src/` (~110 screens, components, hooks, utils) with focused review of auth, storage, networking, and PHI-rendering paths; `apps/desktop/src/` (~40 files) plus Electron main/preload; build and deployment config (`app.json`, `eas.json`, `.gitignore`, `.easignore`, `vite.config.ts`, `package.json` × 2); `docs/planning/master-plan/` for intended design; `NHL_Connect_Tester_Guide.txt`; and full git history for prior security artifacts and committed secrets.

**Tools:** `npm audit` (both workspaces), manual static review, pattern sweeps for identity-from-argument, ungated exports, secrets, unsafe sinks, and insecure storage.

**Not performed:** dynamic testing against the live deployment (no authorization to do so was given — no exploit in this report was executed, all are derived from code reading); Convex dashboard/IAM configuration review; SendGrid account configuration; mobile binary analysis of a built APK; network traffic interception.

**Confidence:** High for all Critical and High findings — each is directly evidenced in committed code at the cited lines. M-07 is explicitly flagged as *not currently exploitable* (pattern risk only). The claim that no authentication exists rests on three independent confirmations: absent `auth.config.ts`, zero `ctx.auth` call sites, and plain `ConvexProvider` on both clients.

**Recommended next step:** authorized dynamic verification against a **staging** deployment (never production with real PHI) to confirm the exploit paths in C-01, C-03, C-04 and C-06, followed by re-review after Phases 1–2.
