# 08 — Testing Strategy

---

## 8.1 Testing Philosophy

- Test real user flows, not implementation details
- Critical paths (auth, messaging, device trust) get the most coverage
- UI tests come after unit tests pass
- Staff beta is the ultimate integration test
- All P0 (crash) and P1 (data loss or security) bugs block release

---

## 8.2 Unit Testing

**Tool:** Jest (bundled with Expo)

### What to unit test:
| Module | Test Focus |
|--------|-----------|
| `dateHelpers.js` | All timestamp formatting cases |
| `formatters.js` | Initials generation, file size formatting, phone masking |
| `roleHelpers.js` | `isAdmin()`, `isDoctor()`, `hasRole()` accuracy |
| `deviceFingerprint.js` | Returns consistent hash for same inputs |
| Convex mutations (server-side) | Logic via Convex test utilities |
| Notification preference filter | Quiet hours logic, type filtering |

### Example unit test:
```javascript
// __tests__/dateHelpers.test.js
import { formatTimestamp } from '../src/utils/dateHelpers';

describe('formatTimestamp', () => {
  it('shows "Just now" for < 1 minute', () => {
    const now = Date.now();
    expect(formatTimestamp(now - 30000)).toBe('Just now');
  });
  it('shows "Xm ago" for < 60 minutes', () => {
    expect(formatTimestamp(Date.now() - 5 * 60 * 1000)).toBe('5m ago');
  });
  it('shows HH:MM for today', () => {
    const today = new Date(); today.setHours(10, 30);
    expect(formatTimestamp(today.getTime())).toBe('10:30');
  });
  it('shows "Yesterday" for yesterday', () => {
    const yest = Date.now() - 26 * 3600 * 1000;
    expect(formatTimestamp(yest)).toBe('Yesterday');
  });
});
```

### Running tests:
```bash
npx jest --watchAll
```

---

## 8.3 Component Testing

**Tool:** React Native Testing Library (`@testing-library/react-native`)

```bash
npm install --save-dev @testing-library/react-native
```

### What to test per component:
- Renders without crashing with minimal props
- Renders correct variant (e.g., `Button` primary vs. secondary)
- `onPress` is called when pressed
- Disabled state prevents `onPress`
- Badge shows count only when `count > 0`

### Example:
```javascript
// __tests__/components/Button.test.js
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../src/components/common/Button';

it('calls onPress when pressed', () => {
  const onPress = jest.fn();
  const { getByText } = render(<Button label="Send" onPress={onPress} />);
  fireEvent.press(getByText('Send'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('does not call onPress when disabled', () => {
  const onPress = jest.fn();
  const { getByText } = render(<Button label="Send" onPress={onPress} disabled />);
  fireEvent.press(getByText('Send'));
  expect(onPress).not.toHaveBeenCalled();
});
```

---

## 8.4 Integration Testing (Critical Flows)

These are end-to-end flows that must be manually validated at the end of each phase:

### Auth Flow
- [ ] New user: OTP sent → code entered → device registered → main app loads
- [ ] Returning user (trusted device): No OTP required → direct to main app
- [ ] New device for existing user: OTP → Device Pending screen → Admin approves → main app loads
- [ ] Revoked device: attempt login → error state → forced logout
- [ ] Invalid OTP: shake animation + error text appears; NOT forwarded to main app

### Messaging Flow
- [ ] Send a 1:1 message → recipient sees it in real-time
- [ ] Send a group message → all members see it
- [ ] Send a channel message → all channel members see it
- [ ] Unread badge updates when message received
- [ ] Badge clears when conversation opened
- [ ] File attachment appears correctly in chat

### Device Trust Flow
- [ ] Admin sees notification when new device logs in
- [ ] Admin approves device from web dashboard → user automatically gets access
- [ ] Admin rejects device → user sees access denied
- [ ] Revoked device auto-logs out on next app open

### Patient Flow
- [ ] Admin creates patient + receives secure link
- [ ] Patient opens link on mobile browser → sees chat interface
- [ ] Patient sends message → doctor sees it in staff app (patient section)
- [ ] Doctor replies → patient receives SMS notification
- [ ] Expired token → patient sees "link expired" message

### Schedule Flow
- [ ] Create event with attendees → event appears on their schedule
- [ ] Reminder notification fires 30 minutes before event
- [ ] Staff can acknowledge event
- [ ] Admin can edit and delete events

---

## 8.5 Security Testing

| Test | Method |
|------|--------|
| Patient cannot access staff DMs | Attempt via modified Convex query — should throw Forbidden |
| Non-admin cannot approve devices | Call `approveDevice` as nurse — should throw Forbidden |
| Unauthenticated access to Convex | Call any query without JWT — should return null/throw |
| Expired access token (patient) | Use token past expiry — should show expired screen |
| Cross-user message access | User A queries User B's private DMs — should throw Forbidden |
| Role escalation | Nurse attempting admin mutations — should throw Forbidden |

---

## 8.6 Beta Rollout Plan

### Internal Beta (Week 16–17)

**Participants:** 10 staff members
- 3 × Doctors (test messaging, schedule, patient comms)
- 3 × Nurses (test messaging, channels, notifications)
- 2 × Admin (test admin panel, device approvals, announcements)
- 1 × Pharmacist (test channels, DMs)
- 1 × Management (test schedule overview, reports)

**Distribution:**
- iOS: TestFlight via Expo EAS
- Android: Internal test track via Google Play Console (or direct APK)

**Feedback collection:**
- Google Form for structured feedback (1–5 ratings per feature area)
- WhatsApp group for quick bug reports (ironic, but practical for beta)
- GitHub Issues for all reported bugs

**Beta success criteria:**
- Zero P0 (crash) bugs outstanding
- Zero P1 (data loss / security) bugs outstanding
- At least 8/10 participants rate the app 4+/5 for ease of use
- Core flows (login, messaging, schedule) all work reliably

### Go/No-Go Checklist Before Launch:
- [ ] All P0 bugs resolved
- [ ] All P1 bugs resolved
- [ ] Convex production environment deployed and tested
- [ ] Privy production credentials configured
- [ ] App Store / Google Play submission approved
- [ ] Admin web dashboard accessible from clinic network
- [ ] Patient portal accessible via HTTPS
- [ ] Push notifications tested on real devices (not simulators)
- [ ] All staff briefed on how to download and use the app
- [ ] Admin briefed on device approval workflow

---

## 8.7 Performance Benchmarks

| Metric | Target |
|--------|--------|
| App cold start (to splash screen) | < 2 seconds |
| Login screen ready | < 1 second from cold start |
| Conversation list load | < 500ms with live Convex data |
| Message appear after send | < 300ms (real-time Convex) |
| Push notification delivery | < 5 seconds |
| Web dashboard load | < 3 seconds |

Performance is monitored via Expo EAS insights and Convex dashboard metrics.
