# Runbook — Backup, Restore, and Dev Data

Operational procedures for the NHL Connect Convex deployment.

> **Nothing in this runbook deletes anything.** Every command here either
> reads from the deployment or writes to a new local file. The only
> destructive command in Convex is `npx convex import --replace`, which is
> called out explicitly and only ever aimed at a **dev** deployment.

---

## 1. Take a backup (do this before any change)

```bash
./scripts/backup.sh            # macOS / Linux
.\scripts\backup.ps1           # Windows PowerShell
```

Writes a timestamped snapshot to `backups/`, then prints per-table row
counts and confirms file storage is included.

**After every backup:**
1. Copy the `.zip` somewhere **off the Convex account** — if that account is
   compromised, the backup must not go with it.
2. Encrypt it at rest. It contains real patient data: names, dates of birth,
   NRC numbers, diagnoses, medications, and bank account numbers.
3. Save the printed row counts. They are your integrity baseline.
4. Never commit it. `backups/.gitignore` blocks this already.

Take a fresh backup **before each phase** of the security work.

---

## 2. Which deployment am I pointed at?

This determines whether any data migration is needed at all.

```bash
cat .env.local | grep CONVEX_DEPLOYMENT
```

- `CONVEX_DEPLOYMENT=prod:silent-meerkat-382` → already production. Nothing
  to migrate. Create a **separate dev deployment** so nobody develops
  against live patient data.
- `CONVEX_DEPLOYMENT=dev:silent-meerkat-382` → the live app has been running
  on a dev deployment. Data is intact but should be moved to prod (§3).

No `.env.local`? Check the Convex dashboard — the deployment is labelled
Production or Development there.

> ⚠️ **`npx convex deploy` does NOT copy data.** It deploys *code* to a
> production deployment. Run it against an empty prod and the app will look
> like it lost everything. Data only moves via `export` → `import`.
> Do not run `convex deploy` until you know which deployment you are on.

---

## 3. Move data to a new production deployment

Only if §2 showed you are on a dev deployment.

```bash
# 1. Snapshot the current (dev) deployment — this is your rollback
./scripts/backup.sh

# 2. Deploy code to production (creates it empty)
npx convex deploy

# 3. Load the data into production
npx convex import --prod --replace backups/<snapshot>.zip
```

Then repoint both clients at the new prod URL:

- `apps/desktop/.env` → `VITE_CONVEX_URL`
- **`apps/desktop/vite.config.ts:32`** — the old URL is **hardcoded as a
  fallback** here and gets baked into every build. Changing `.env` alone is
  not enough.
- Mobile: `EXPO_PUBLIC_CONVEX_URL` in the EAS build environment.

Rebuild and redistribute the Android APK and the desktop installer.

**Before decommissioning the old deployment:**
- Compare per-table row counts against the snapshot — they must match.
- Spot-check 5 patients, 5 invoices, 5 treatment notes field by field.
- Confirm file attachments still open.
- Keep the old deployment read-only for **at least 30 days**. Do not delete it.

---

## 4. Restore from a backup

```bash
npx convex import --replace backups/<snapshot>.zip
```

`--replace` overwrites the target deployment's data. Confirm which
deployment you are pointed at (§2) before running it. Add `--prod` to
target production explicitly.

**Practise this at least once into a scratch deployment.** An untested
backup is not a backup.

---

## 5. Dev/test data without copying patient records

You wanted the same data available in dev for testing. Copying live records
into dev would put real patient data on a second, less-protected deployment
— and until the auth work lands, dev would be as open as prod is now. The
anonymiser gives you the same shape, volume and relationships with the
identifying data replaced.

```bash
# 1. Extract a snapshot
unzip backups/<snapshot>.zip -d /tmp/snap
#    PowerShell: Expand-Archive backups\<snapshot>.zip -DestinationPath C:\tmp\snap

# 2. Anonymise into a new directory (input is never modified)
node scripts/anonymize-snapshot.mjs /tmp/snap /tmp/snap-dev

# 3. Re-zip
cd /tmp/snap-dev && zip -r ../dev-seed.zip .
#    PowerShell: Compress-Archive -Path C:\tmp\snap-dev\* -DestinationPath C:\tmp\dev-seed.zip

# 4. Import into DEV ONLY
npx convex import --replace /tmp/dev-seed.zip
```

**What is preserved** — every `_id` and cross-table reference (joins work),
row counts and table structure, clinical arrays (allergies, conditions,
medications), vitals, statuses, dates and monetary amounts.

**What is replaced** — names, emails, phone numbers, addresses, NRC numbers,
dates of birth (shifted ±180 days, so approximate age survives), insurance
and policy numbers, bank details, emergency contacts, and all clinical free
text (treatment note SOAP fields, messages, letters, call notes).

**Consistency** — pseudonymisation is deterministic and keyed on each
person's `userId`/`externalId`/`_id`, so one staff member gets the *same*
fake name and email in `staffAccounts`, `users`, `activityLogs` and
everywhere else. Re-running produces identical output.

**Storage blobs are excluded by default.** Scanned documents and ID photos
cannot be redacted automatically, so file attachments will not resolve in
the dev copy. `--keep-storage` overrides this and carries the real files
across — only do that if you accept real PHI landing in dev.

**After import**, every `staffAccounts.password` is `RESET_ME_IN_DEV`. Set
real dev credentials before using the environment.

**Residual risk, stated plainly:** this is strong pseudonymisation, not a
guarantee of irreversibility. A rare condition combined with other retained
fields could in principle narrow down an individual. Treat the dev
deployment as confidential — do not make it public.

---

## 6. Data-safety rules during migrations

1. Snapshot before every phase.
2. Use `ctx.db.patch`, never `ctx.db.replace`, so unlisted fields survive.
3. Add new fields as `v.optional` first; never make a field required before
   backfilling (Convex rejects the deploy).
4. Deprecate rather than delete — mark old fields `v.optional` with a
   comment explaining why.
5. Dry-run every migration (`dryRun: true`) before it touches real rows.
6. Never ship a schema change and a data backfill in the same deploy.

See `.claude/skills/convex-migration-helper/SKILL.md` for the full
widen-migrate-narrow workflow.

---

## 7. Recommended backup schedule

| When | What |
|---|---|
| Before every phase of the security work | Manual `./scripts/backup.sh` |
| Daily | Automated snapshot, retained 30 days |
| Weekly | Snapshot retained 12 months (clinical retention) |
| Quarterly | Restore drill into a scratch deployment |

Store backups encrypted, off the Convex account, with access limited to
named individuals. Log every restore.
