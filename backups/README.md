# backups/

Convex snapshots land here.

**Contents are git-ignored and must stay that way.** A snapshot of this
deployment contains real patient data — names, dates of birth, NRC numbers,
diagnoses, medications, bank account numbers — plus staff credentials.

Create one with:

```bash
./scripts/backup.sh          # macOS / Linux
.\scripts\backup.ps1         # Windows PowerShell
```

Then copy it somewhere off the Convex account and encrypt it at rest.

Full procedures: [`docs/runbooks/backup-and-restore.md`](../docs/runbooks/backup-and-restore.md)
