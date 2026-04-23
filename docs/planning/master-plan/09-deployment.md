# 09 — Deployment

---

## 9.1 Mobile App (Expo EAS)

### Setup EAS
```bash
npm install -g eas-cli
eas login
eas build:configure
```

### `eas.json`
```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "dev@nichehealthcare.co.uk" },
      "android": { "serviceAccountKeyPath": "./google-service-account.json" }
    }
  }
}
```

### Build Commands
```bash
# Internal preview (for beta testing)
eas build --platform all --profile preview

# Production build
eas build --platform all --profile production

# Submit to App Store / Play Store
eas submit --platform all --profile production
```

### app.json (key production settings)
```json
{
  "expo": {
    "name": "NHL Connect",
    "slug": "nhl-connect",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./src/assets/images/logo-mark.png",
    "splash": {
      "image": "./src/assets/images/logo.png",
      "resizeMode": "contain",
      "backgroundColor": "#FFFFFF"
    },
    "ios": {
      "bundleIdentifier": "co.uk.nichehealthcare.connect",
      "buildNumber": "1",
      "supportsTablet": false,
      "usesAppleSignIn": false
    },
    "android": {
      "package": "co.uk.nichehealthcare.connect",
      "versionCode": 1,
      "permissions": ["NOTIFICATIONS", "CAMERA", "READ_EXTERNAL_STORAGE"]
    },
    "plugins": [
      "expo-font",
      "expo-secure-store",
      ["expo-notifications", {
        "icon": "./src/assets/images/logo-mark.png",
        "color": "#3B4B8A"
      }]
    ]
  }
}
```

### Environment Variables
```bash
# .env (never committed)
EXPO_PUBLIC_CONVEX_URL=https://yourdeployment.convex.cloud
EXPO_PUBLIC_PRIVY_APP_ID=your-privy-app-id
```

Use `expo-constants` in the app to access `EXPO_PUBLIC_*` variables.

---

## 9.2 Convex Production Deployment

### Project Setup
```bash
npx convex dev     # development
npx convex deploy  # production
```

### Production environment
- Create a separate Convex project for production (not dev)
- Set environment variables in the Convex dashboard:
  - `PRIVY_APP_SECRET` — for verifying JWTs
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_FROM_NUMBER`

### Convex Auth Config (for Privy JWT validation)
```javascript
// convex/auth.config.js
export default {
  providers: [
    {
      domain: "privy.io",
      applicationID: process.env.PRIVY_APP_ID,
    }
  ]
};
```

### Deployment checklist
- [ ] `convex deploy` completed without errors
- [ ] Production Convex URL updated in all app environments
- [ ] Schema indexes all built
- [ ] Seed production data (admin user only — not test data)
- [ ] Cron jobs (schedule reminders) verified running in dashboard
- [ ] File storage limits confirmed for plan tier

---

## 9.3 Web Admin Dashboard

### Hosting: Vercel (recommended)

```bash
# From /web-dashboard directory
npm run build
vercel --prod
```

**Vercel config (`vercel.json`):**
```json
{
  "rewrites": [{ "source": "/((?!api/.*).*)", "destination": "/index.html" }],
  "env": {
    "REACT_APP_CONVEX_URL": "@convex_url_production",
    "REACT_APP_PRIVY_APP_ID": "@privy_app_id"
  }
}
```

**Subdomain:** `admin.nichehealthcare.co.uk` → DNS CNAME to Vercel deployment.

**Access restriction:** Admin dashboard should be further protected:
- Privy login required (same auth system)
- Only `staffRole: 'admin'` can access — enforced both client-side and Convex server-side
- Optional: restrict by IP to clinic network (Vercel middleware handles this)

---

## 9.4 Patient Portal

### Hosting: Vercel (separate project)

**Subdomain:** `patient.nichehealthcare.co.uk`

```bash
# From /patient-portal directory
npm run build
vercel --prod
```

**Key config:**
- All routes redirect to `index.html` (SPA)
- Token is read from URL query param at runtime
- No auth headers — token-based access only
- HTTPS enforced (Vercel default)

---

## 9.5 Desktop App (Electron)

### Build prerequisites
1. Build web-dashboard: `npm run build` → copy `build/` into `desktop/build/`
2. Run electron-builder

### `desktop/package.json` (key build config)
```json
{
  "name": "nhl-connect-desktop",
  "version": "1.0.0",
  "main": "main.js",
  "build": {
    "appId": "co.uk.nichehealthcare.connect.desktop",
    "productName": "NHL Connect",
    "icon": "assets/icon.png",
    "mac": {
      "category": "public.app-category.healthcare",
      "target": "dmg"
    },
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "linux": {
      "target": "AppImage"
    }
  },
  "scripts": {
    "build": "electron-builder",
    "dev": "electron ."
  }
}
```

```bash
npm run build
# Outputs:
# dist/NHL Connect.dmg         (macOS)
# dist/NHL Connect Setup.exe   (Windows)
# dist/NHL Connect.AppImage    (Linux)
```

**Distribution:** Internal only — share the installer via the clinic's shared drive or a private download link. No public app store for desktop.

---

## 9.6 Deployment Environments Summary

| Service | Development | Production |
|---------|------------|-----------|
| Mobile | `expo start` (dev client) | EAS production build |
| Convex | `npx convex dev` | `npx convex deploy` (prod project) |
| Web Dashboard | `npm start` (localhost:3000) | Vercel (`admin.nichehealthcare.co.uk`) |
| Patient Portal | `npm start` (localhost:3001) | Vercel (`patient.nichehealthcare.co.uk`) |
| Desktop | `npm run dev` | `npm run build` → distribute installer |

---

## 9.7 Over-the-Air Updates (Mobile)

Expo EAS Update allows pushing JS/asset changes without resubmitting to the app store:

```bash
# Push an OTA update (no native code changes)
eas update --branch production --message "Fix message timestamps"
```

This is ideal for bug fixes and minor UI changes. Any native module changes still require a full `eas build`.

Configure in `app.json`:
```json
"updates": {
  "enabled": true,
  "checkAutomatically": "ON_LOAD",
  "fallbackToCacheTimeout": 0
},
"runtimeVersion": { "policy": "appVersion" }
```
