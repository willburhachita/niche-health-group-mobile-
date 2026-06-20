import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  getPermissionsForRole,
  hasPermission as checkPermission,
  generateDeviceId,
  TITLE_OPTIONS,
} from '../utils/authHelpers';

const SESSION_KEY = '@niche_auth_session';
const DEVICE_ID_KEY = '@niche_device_id';

const AuthContext = createContext({
  isAuthenticated: false,
  isLoading: false,
  needsOnboarding: false,
  isDevicePending: false,
  currentUserId: null,
  currentAccount: null,
  role: null,
  permissions: null,
  deviceId: null,
  login: () => {},
  logout: () => {},
  hasPermission: () => false,
  completeOnboarding: () => {},
  retryDeviceCheck: () => {},
});

// Get or create a persistent device ID stored in AsyncStorage
async function getOrCreatePersistentDeviceId() {
  try {
    const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (stored) return stored;
    const newId = generateDeviceId();
    await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
    return newId;
  } catch {
    return generateDeviceId(); // fallback if AsyncStorage fails
  }
}

export function AuthProvider({ children }) {
  const convex = useConvex();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isDevicePending, setIsDevicePending] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [deviceId, setDeviceId] = useState(null);

  // Helper: check if profile is incomplete
  const isProfileIncomplete = (account) =>
    !account.isOnboarded || !account.fullName || !account.phone || !account.title;

  // Load persistent device ID + restore session on app start
  useEffect(() => {
    (async () => {
      try {
        // 1. Get or create a persistent device ID
        const persistedDeviceId = await getOrCreatePersistentDeviceId();
        setDeviceId(persistedDeviceId);

        // 2. Restore auth session
        const stored = await AsyncStorage.getItem(SESSION_KEY);
        if (stored) {
          const { email } = JSON.parse(stored);
          const account = await convex.query(api.auth.getAccountByEmail, { email });
          if (account) {
            setCurrentAccount(account);
            if (isProfileIncomplete(account)) {
              setNeedsOnboarding(true);
            }
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        }
      } catch {}
      setIsLoading(false);
    })();
  }, [convex]);

  const persistSession = async (email) => {
    try { await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ email })); } catch {}
  };

  const clearSession = async () => {
    try { await AsyncStorage.removeItem(SESSION_KEY); } catch {}
  };

  const login = useCallback(async (account) => {
    setIsLoading(true);
    setCurrentAccount(account);

    // deviceId may still be loading on first render — re-read from storage as fallback
    const activeDeviceId = deviceId || await getOrCreatePersistentDeviceId();

    const trusted = account.trustedDevices?.includes(activeDeviceId) || false;
    const profileIncomplete = isProfileIncomplete(account);

    if (trusted) {
      // Device already trusted — proceed
      convex.mutation(api.auth.createLoginAlert, {
        staffId: account._id,
        deviceName: 'Current Device',
      });
      persistSession(account.email);

      if (profileIncomplete) {
        setNeedsOnboarding(true);
        setIsDevicePending(false);
        setIsAuthenticated(true);
      } else {
        setNeedsOnboarding(false);
        setIsDevicePending(false);
        setIsAuthenticated(true);
      }
    } else {
      // Untrusted device — request admin approval
      convex.mutation(api.auth.createDeviceRequest, {
        staffId: String(account._id),
        deviceId: activeDeviceId,
        deviceName: 'Mobile Device',
        platform: 'Android/iOS',
      });
      setIsDevicePending(true);
      setNeedsOnboarding(false);
      setIsAuthenticated(false);
    }

    setIsLoading(false);
  }, [deviceId, convex]);

  const retryDeviceCheck = useCallback(async () => {
    if (!currentAccount) return;
    // Re-fetch account from DB to get latest trustedDevices
    const fresh = await convex.query(api.auth.getAccountByEmail, { email: currentAccount.email });
    if (!fresh) return;
    const trusted = fresh.trustedDevices?.includes(deviceId) || false;
    if (trusted) {
      convex.mutation(api.auth.createLoginAlert, {
        staffId: fresh._id,
        deviceName: 'Current Device',
      });
      persistSession(fresh.email);
      setCurrentAccount(fresh);
      setIsDevicePending(false);
      if (isProfileIncomplete(fresh)) {
        setNeedsOnboarding(true);
      }
      setIsAuthenticated(true);
    }
  }, [currentAccount, deviceId, convex]);

  const logout = useCallback(() => {
    clearSession();
    setIsAuthenticated(false);
    setIsDevicePending(false);
    setNeedsOnboarding(false);
    setCurrentAccount(null);
  }, []);

  const completeOnboarding = useCallback(async (title, fullName, phone) => {
    if (!currentAccount) return;
    // Call Convex mutation to update DB
    const result = await convex.mutation(api.auth.completeOnboarding, {
      accountId: currentAccount._id,
      title,
      fullName,
      phone,
    });
    setCurrentAccount({
      ...currentAccount,
      isOnboarded: true,
      title,
      fullName,
      displayName: result.displayName,
      phone,
    });
    setNeedsOnboarding(false);
  }, [currentAccount, convex]);

  const hasPermissionFn = useCallback(
    (permission) => {
      if (!currentAccount) return false;
      return checkPermission(currentAccount.role, permission);
    },
    [currentAccount]
  );

  const role = currentAccount?.role || null;
  const permissions = role ? getPermissionsForRole(role) : null;
  const currentUserId = currentAccount?.userId || null;

  // For the admin account in development, auto-trust the device
  useEffect(() => {
    if (currentAccount?.email === 'wilburhachita@gmail.com' && isDevicePending) {
      convex.mutation(api.auth.addTrustedDevice, {
        accountId: currentAccount._id,
        deviceId,
      }).then(() => {
        convex.mutation(api.auth.createLoginAlert, {
          staffId: currentAccount._id,
          deviceName: 'Emulator',
        });
        setIsDevicePending(false);
        if (isProfileIncomplete(currentAccount)) {
          setNeedsOnboarding(true);
        }
        persistSession(currentAccount.email);
        setIsAuthenticated(true);
      });
    }
  }, [currentAccount, isDevicePending, deviceId, convex]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        needsOnboarding,
        isDevicePending,
        currentUserId,
        currentAccount,
        role,
        permissions,
        deviceId,
        login,
        logout,
        hasPermission: hasPermissionFn,
        completeOnboarding,
        retryDeviceCheck,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
