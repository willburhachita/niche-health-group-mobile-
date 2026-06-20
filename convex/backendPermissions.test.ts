import { describe, it, expect } from 'vitest';
import { checkPermission, enforcePermission } from './utils/permissions';
import { DatabaseReader } from './_generated/server';

const mockDb = (staffAccount: any) => {
  const queryResult = {
    first: () => Promise.resolve(staffAccount),
  };
  const query = () => ({
    withIndex: () => ({
      first: () => Promise.resolve(staffAccount),
    }),
    first: () => Promise.resolve(staffAccount),
  });
  
  return {
    query,
    get: () => Promise.resolve(staffAccount),
  } as unknown as DatabaseReader;
};

describe('Convex Backend Permission Enforcement', () => {
  describe('checkPermission', () => {
    it('should return false if caller is undefined or null', async () => {
      const db = mockDb(null);
      const res = await checkPermission(db, null, 'adminPanel');
      expect(res).toBe(false);
    });

    it('should return false if staff account is inactive', async () => {
      const db = mockDb({
        email: 'staff@clinic.com',
        role: 'admin',
        isActive: false,
      });
      const res = await checkPermission(db, 'staff@clinic.com', 'adminPanel');
      expect(res).toBe(false);
    });

    it('should return true for admin role on any permission', async () => {
      const db = mockDb({
        email: 'admin@clinic.com',
        role: 'admin',
        isActive: true,
      });
      const res = await checkPermission(db, 'admin@clinic.com', 'adminPanel');
      expect(res).toBe(true);
      
      const res2 = await checkPermission(db, 'admin@clinic.com', 'createPatient');
      expect(res2).toBe(true);
    });

    it('should return true if custom overrides array explicitly has the permission', async () => {
      const db = mockDb({
        email: 'nurse@clinic.com',
        role: 'member',
        permissions: ['createPatient'],
        isActive: true,
      });
      const res = await checkPermission(db, 'nurse@clinic.com', 'createPatient');
      expect(res).toBe(true);

      const res2 = await checkPermission(db, 'nurse@clinic.com', 'adminPanel');
      expect(res2).toBe(false);
    });

    it('should enforce role-based permissions fallback', async () => {
      const db = mockDb({
        email: 'receptionist@clinic.com',
        role: 'moderator',
        isActive: true,
      });
      // Moderator has clinicDashboard and viewPatients, but not viewFinancials or adminPanel
      expect(await checkPermission(db, 'receptionist@clinic.com', 'clinicDashboard')).toBe(true);
      expect(await checkPermission(db, 'receptionist@clinic.com', 'viewPatients')).toBe(true);
      expect(await checkPermission(db, 'receptionist@clinic.com', 'viewFinancials')).toBe(false);
      expect(await checkPermission(db, 'receptionist@clinic.com', 'adminPanel')).toBe(false);
    });
  });

  describe('enforcePermission', () => {
    it('should throw an error if permission is denied', async () => {
      const db = mockDb({
        email: 'member@clinic.com',
        role: 'member',
        isActive: true,
      });
      await expect(enforcePermission(db, 'member@clinic.com', 'adminPanel'))
        .rejects.toThrow("Unauthorized: Required permission 'adminPanel'");
    });

    it('should succeed and not throw if permission is allowed', async () => {
      const db = mockDb({
        email: 'admin@clinic.com',
        role: 'admin',
        isActive: true,
      });
      await expect(enforcePermission(db, 'admin@clinic.com', 'adminPanel'))
        .resolves.not.toThrow();
    });
  });
});
