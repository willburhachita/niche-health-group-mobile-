# 10 — Maintenance & Scaling

---

## 10.1 Bug Fixing Workflow

### Severity Classification

| Priority | Definition | SLA |
|----------|-----------|-----|
| P0 — Critical | App crashes, data loss, security breach, auth bypass | Fix within 24 hours |
| P1 — High | Feature completely broken, data incorrect | Fix within 3 days |
| P2 — Medium | Feature partially broken, has workaround | Fix within 1 week |
| P3 — Low | UI glitch, minor copy, cosmetic | Fix in next release |

### Bug Lifecycle

```
Staff reports bug (via in-app feedback or WhatsApp group)
→ Developer reproduces on simulator
→ Dev creates GitHub Issue with severity label
→ P0/P1: hotfix branch → fix → OTA update (if JS-only) or new build
→ P2/P3: add to sprint backlog → fix in next planned release
→ Close issue after confirming fix in production
```

### In-App Feedback (Future)
Add a "Report a Problem" option under `More → Settings → Help`. Submits a Convex mutation with:
- User ID
- Current screen
- Description
- App version
- Device info

---

## 10.2 Performance Monitoring

### Convex Dashboard
Monitor in the Convex dashboard:
- Query execution time (flag any > 200ms)
- Mutation throughput
- File storage usage
- Subscription count (active real-time connections)

### Expo EAS Insights
- Crash reports
- App load time
- ANR (App Not Responding) events on Android
- OTA update adoption rate

### Custom Logging (if needed)
For detailed tracing, integrate a lightweight service:
- **Sentry** (`@sentry/react-native`) — crash reports + performance traces
- Or **LogRocket** — session replay for web dashboard

Sentry setup:
```bash
npx expo install @sentry/react-native
```
```javascript
// App.js
import * as Sentry from '@sentry/react-native';
Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN });
```

---

## 10.3 Release Cadence

| Release Type | Frequency | Contents |
|-------------|-----------|---------|
| Patch (1.0.x) | As needed | P0/P1 bug fixes, OTA where possible |
| Minor (1.x.0) | Monthly | New features, P2 fixes, UX improvements |
| Major (x.0.0) | Quarterly | Breaking changes, major new modules |

**Changelog:** Maintain a `CHANGELOG.md` at the project root. For each release:
```markdown
## [1.1.0] - 2026-05-01
### Added
- File sharing in channels
- Staff directory search filters

### Fixed
- Chat list not updating in real-time on Android
- OTP input focus lost on back press
```

---

## 10.4 Convex Scaling

Convex scales automatically — no server management required. Key limits to watch:

| Metric | Free Plan | Pro Plan |
|--------|-----------|---------|
| Storage | 512 MB | Unlimited (metered) |
| Bandwidth | 1 GB/month | Metered |
| Function calls | 1M/month | Metered |
| File storage | 1 GB | Metered |

**Recommendation:** Upgrade to Convex Pro before beta (Phase 10). The free plan will hit limits with real staff usage.

**Message pagination strategy:** Messages are paginated (50 per load) to avoid loading entire conversation history on open. Implement "Load earlier messages" button.

**File storage:** Use Convex file storage for message attachments. Files are served via Convex CDN URLs.

---

## 10.5 User Scaling Strategy

As more staff join:
- **Channels:** Keep channel member counts manageable. Large departments (24+ people) should split into sub-channels.
- **Notifications:** Batch notifications to avoid overwhelming users. Use quiet hours.
- **Message history:** Archive conversations after 6 months of inactivity. Archived conversations are read-only but searchable.
- **Device cleanup:** Admin should periodically revoke old/unused trusted devices.

---

## 10.6 Future Feature Expansion

These are not in scope for v1.0 but are architecturally planned for:

### Near-term (v1.1 – v1.3)
| Feature | Notes |
|---------|-------|
| File sharing in channels | Convex file storage already in the data model |
| Message reactions (emoji) | Strict: use predefined icons, not Unicode emoji |
| Read receipts in groups | Extend `readBy` array rendering in bubble |
| Channel threads (replies) | Sub-conversation per channel message |
| Offline message queue | Store unsent messages in AsyncStorage; sync on reconnect |
| Voice messages | Record audio → upload to Convex storage → play in chat |

### Medium-term (v2.0)
| Feature | Notes |
|---------|-------|
| Video calls (1:1) | Integrate LiveKit or Daily.co |
| Shift swap requests | Staff can propose/accept shift swaps via schedule module |
| Patient records (basic) | Controlled view of assigned patient info for doctors |
| Advanced analytics | Admin dashboard charts: message volume, response times |
| Multi-language support | Internationalization (i18n) for non-English staff |

### Long-term (v3.0)
| Feature | Notes |
|---------|-------|
| AI-assisted triage | Flag urgent patient messages to on-call doctor |
| Integration with EHR | Read patient records from external systems (HL7/FHIR) |
| Audit export | Exportable PDF audit logs for regulatory compliance |
| HIPAA/GDPR compliance tools | Data retention policies, right-to-erasure flows |

---

## 10.7 Data Retention Policy

| Data Type | Retention | Action |
|-----------|-----------|--------|
| Messages | 2 years | Archive after 2 years; delete on request |
| Admin logs | 5 years (immutable) | Never deleted |
| Device records | 1 year after last access | Auto-purge via cron |
| Patient access tokens | 30 days (or custom) | Auto-expire via `accessTokenExpiry` |
| Notifications | 3 months | Convex cron soft-deletes old notifications |

Implement as Convex scheduled actions in `convex/crons.ts`.

---

## 10.8 Security Maintenance

| Task | Frequency |
|------|-----------|
| Review pending device approvals | Daily (admin responsibility) |
| Review admin logs for suspicious activity | Weekly |
| Rotate Privy app secret | Every 90 days |
| Audit active trusted devices | Monthly |
| Dependency vulnerability scan (`npm audit`) | Each release |
| Expo SDK update | Each major Expo release |
| Convex SDK update | Each minor Convex release |
| Review user permissions and roles | Quarterly |
| Penetration test (if patient data grows) | Annually |

---

## 10.9 Documentation Maintenance

All planning documents in `docs/planning/` should be treated as living documents:

- When a screen spec changes, update `screens.md`
- When a backend schema changes, update `03-backend.md`
- When a new component is added, update `styles.md` and `01-product-design.md`
- When a feature ships, mark the corresponding task in `tasks.md` as complete
- Keep `CHANGELOG.md` updated with every release

**Document owner:** Technical Project Manager (or lead developer if no dedicated PM).
