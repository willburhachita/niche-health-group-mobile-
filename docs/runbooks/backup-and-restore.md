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

## 2. The three deployments

This project has three Convex deployments:

| Deployment | Name | Role |
|---|---|---|
| `production` | `zany-squirrel-782` | Live data. **Referenced nowhere in this repo.** |
| `dev/ecobrood` | `robust-rook-737` | Personal dev sandbox |
| `dev/wilbur-hachita` | `silent-meerkat-382` | Personal dev sandbox |

**The repo is configured to point at a personal dev sandbox, not production:**

- `apps/desktop/.env` → `silent-meerkat-382`
- `apps/desktop/vite.config.ts:32` → `silent-meerkat-382` **hardcoded as the
  build fallback**, so it is baked into every desktop build even when `.env`
  says something else
- `docs/planning/desktop-app-plan.md:262` → `silent-meerkat-382`

Mobile reads `EXPO_PUBLIC_CONVEX_URL` (`App.js:11`), which is **not set
anywhere in this repo** — no root `.env`, and `eas.json` has no `env` block.
It must be supplied by EAS dashboard environment variables or a local `.env`
at build time. Confirm which deployment the distributed APK actually talks to.

Check which deployment your CLI is currently pointed at before running
anything:

```bash
cat .env.local | grep CONVEX_DEPLOYMENT     # or check the Convex dashboard
```

> ⚠️ **`npx convex deploy` does NOT copy data.** It deploys *code* to the
> production deployment. Data only moves via `export` → `import`.

> ⚠️ **Never point a dev build at production.** Developing against
> `zany-squirrel-782` puts live patient data at risk from ordinary
> development mistakes.

---

## 3. Repointing the apps at the correct deployment

If the desktop or mobile build is aimed at the wrong deployment, fix the
config — do **not** move data to match the config.

- `apps/desktop/.env` → `VITE_CONVEX_URL`
- **`apps/desktop/vite.config.ts:32`** — must be changed too, or the
  hardcoded fallback silently overrides `.env` in packaged builds. Prefer
  removing the fallback entirely so a missing variable fails loudly instead
  of quietly connecting to a dev sandbox.
- Mobile: `EXPO_PUBLIC_CONVEX_URL` in the EAS build environment.

Rebuild and redistribute the Android APK and the desktop installer after any
change.

### If a dev sandbox turns out to hold real patient data

Snapshot it first (`./scripts/backup.sh`), then treat it as an exposure:
its URL is committed to git and, until the auth work lands, it is
unauthenticated. Move the records to production only if they are the
authoritative copy, then purge the sandbox. Do not delete anything until the
snapshot is verified and the data is confirmed present in production.

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
