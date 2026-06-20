import { describe, it, expect } from 'vitest';
import { hasPermission, getPermissionsForRole } from '../utils/permissions';

describe('Role-Based Access Control (RBAC) System tests', () => {
  describe('hasPermission helper', () => {
    it('should grant all permissions to admin', () => {
      expect(hasPermission('admin', 'adminPanel')).toBe(true);
      expect(hasPermission('admin', 'createPatient')).toBe(true);
      expect(hasPermission('admin', 'createInvoice')).toBe(true);
      expect(hasPermission('admin', 'viewFinancials')).toBe(true);
    });

    it('should grant receptionist (moderator) correct clinical access but deny financial access', () => {
      expect(hasPermission('moderator', 'clinicDashboard')).toBe(true);
      expect(hasPermission('moderator', 'viewPatients')).toBe(true);
      expect(hasPermission('moderator', 'createPatient')).toBe(true);
      expect(hasPermission('moderator', 'editPatient')).toBe(true);
      expect(hasPermission('moderator', 'createAppointment')).toBe(true);
      expect(hasPermission('moderator', 'editAppointment')).toBe(true);
      expect(hasPermission('moderator', 'viewTreatmentNote')).toBe(true);
      expect(hasPermission('moderator', 'createTreatmentNote')).toBe(true);
      expect(hasPermission('moderator', 'editTreatmentNote')).toBe(true);
      expect(hasPermission('moderator', 'manageStock')).toBe(true);

      // Financials should be denied
      expect(hasPermission('moderator', 'viewFinancials')).toBe(false);
      expect(hasPermission('moderator', 'createInvoice')).toBe(false);
      expect(hasPermission('moderator', 'recordPayment')).toBe(false);
      expect(hasPermission('moderator', 'adminPanel')).toBe(false);
    });

    it('should grant power receptionist (moderator_plus) almost full access except admin and archiving', () => {
      expect(hasPermission('moderator_plus', 'clinicDashboard')).toBe(true);
      expect(hasPermission('moderator_plus', 'createPatient')).toBe(true);
      expect(hasPermission('moderator_plus', 'createInvoice')).toBe(true);
      
      // Admin and archiving should be denied
      expect(hasPermission('moderator_plus', 'adminPanel')).toBe(false);
      expect(hasPermission('moderator_plus', 'archivePatient')).toBe(false);
      expect(hasPermission('moderator_plus', 'archiveAppointment')).toBe(false);
      expect(hasPermission('moderator_plus', 'archiveInvoice')).toBe(false);
      expect(hasPermission('moderator_plus', 'editInvoice')).toBe(false);
    });

    it('should grant bookkeeper financial-only access and deny clinical note changes', () => {
      expect(hasPermission('bookkeeper', 'viewFinancials')).toBe(true);
      expect(hasPermission('bookkeeper', 'createInvoice')).toBe(true);
      expect(hasPermission('bookkeeper', 'recordPayment')).toBe(true);
      expect(hasPermission('bookkeeper', 'viewPatients')).toBe(true);

      // Clinical notes & scheduling edits should be denied
      expect(hasPermission('bookkeeper', 'createTreatmentNote')).toBe(false);
      expect(hasPermission('bookkeeper', 'editTreatmentNote')).toBe(false);
      expect(hasPermission('bookkeeper', 'createAppointment')).toBe(false);
      expect(hasPermission('bookkeeper', 'editAppointment')).toBe(false);
      expect(hasPermission('bookkeeper', 'adminPanel')).toBe(false);
    });

    it('should restrict member role to basic communication and shifts', () => {
      expect(hasPermission('member', 'messaging')).toBe(true);
      expect(hasPermission('member', 'channels')).toBe(true);
      expect(hasPermission('member', 'viewShifts')).toBe(true);
      expect(hasPermission('member', 'clockInOut')).toBe(true);

      // Deny EMR / Financials / Staff Admin
      expect(hasPermission('member', 'viewPatients')).toBe(false);
      expect(hasPermission('member', 'viewFinancials')).toBe(false);
      expect(hasPermission('member', 'adminPanel')).toBe(false);
    });

    it('should default undefined/null role to member permission level', () => {
      expect(hasPermission(null, 'messaging')).toBe(true);
      expect(hasPermission(undefined, 'viewPatients')).toBe(false);
    });
  });

  describe('getPermissionsForRole helper', () => {
    it('should return the full permission map', () => {
      const adminMap = getPermissionsForRole('admin');
      expect(adminMap.adminPanel).toBe(true);

      const memberMap = getPermissionsForRole('member');
      expect(memberMap.adminPanel).toBe(false);
      expect(memberMap.messaging).toBe(true);
    });
  });
});
