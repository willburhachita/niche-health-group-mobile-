import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useCallback, useEffect, useState } from 'react';
import { hasPermission as hasPermissionFor, getPermissionsForRole, PERMISSION_KEYS, type PermissionMap, type Permission } from '../utils/permissions';

const SESSION_KEY = 'nhl_desktop_session';

export interface AuthAccount {
  _id: string;
  userId: string;
  email: string;
  role: string;
  fullName?: string;
  displayName?: string;
  title?: string;
  isActive: boolean;
  isOnboarded: boolean;
  phone?: string | null;
  permissions?: string[];
}

interface SessionData {
  email: string;
  accountId: string;
  role: string;
}

export function useAuth() {
  const [session, setSession] = useState<SessionData | null>(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const account = useQuery(
    api.auth.getAccountByEmail,
    session?.email ? { email: session.email } : 'skip'
  ) as AuthAccount | null | undefined;

  const login = useCallback((data: SessionData) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    setSession(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  const isLoading = !!session && account === undefined;
  const isAuthenticated = !!session && !!account && account.isActive;
  const role = account?.role ?? session?.role ?? '';

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (account && account.permissions && Array.isArray(account.permissions)) {
        return account.permissions.includes(permission);
      }
      return hasPermissionFor(role, permission);
    },
    [account, role]
  );

  const permissions = account && account.permissions && Array.isArray(account.permissions)
    ? PERMISSION_KEYS.reduce((acc, k) => ({ ...acc, [k]: account.permissions!.includes(k) }), {} as PermissionMap)
    : getPermissionsForRole(role);

  return { isAuthenticated, isLoading, session, account, role, login, logout, hasPermission, permissions };
}
