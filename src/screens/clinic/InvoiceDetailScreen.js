import React, { useState } from 'react';
import { View, ScrollView, Pressable, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, TAB_BAR_HEIGHT } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { useAlert } from '../../components/common/CustomAlert';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { Divider } from '../../components/common/Divider';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, formatTimestamp } from '../../utils/dateHelpers';
import { Input } from '../../components/common/Input';
import { buildInvoiceHTML, downloadInvoicePDF } from '../../utils/documentHelpers';

function formatCurrency(amount) {
  return `K ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const PAYMENT_METHODS = [
  { key: 'cash', label: 'Cash', icon: 'dollar-sign' },
  { key: 'mobile_money', label: 'Mobile Money', icon: 'smartphone' },
  { key: 'card', label: 'Card', icon: 'credit-card' },
  { key: 'nhima', label: 'NHIMA Insurance', icon: 'shield' },
  { key: 'bank_transfer', label: 'Bank Transfer', icon: 'briefcase' },
  { key: 'cheque', label: 'Cheque', icon: 'file-text' },
];

const statusStyles = {
  paid: { color: colors.success, bg: colors.success + '14', label: 'Paid' },
  unpaid: { color: colors.warning, bg: colors.warning + '14', label: 'Unpaid' },
  overdue: { color: colors.error, bg: colors.error + '14', label: 'Overdue' },
};

export default function InvoiceDetailScreen({ route, navigation }) {
  const { invoiceId } = route.params;
  const alert = useAlert();
  const { currentAccount } = useAuth();
  const invoice = useQuery(api.invoices.get, { id: invoiceId });
  const patient = useQuery(api.patients.get, invoice?.patientId ? { id: invoice.patientId } : 'skip');
  const appointment = useQuery(api.appointments.get, invoice?.appointmentId ? { id: invoice.appointmentId } : 'skip');
  const creator = useQuery(api.auth.getStaffByUserId, invoice?.createdBy ? { userId: invoice.createdBy } : 'skip');
  const recordPayment = useMutation(api.paymentsClinic.create);
  const markAsPaid = useMutation(api.invoices.markAsPaid);
  const sendEmail = useAction(api.notifications.sendInvoiceEmail);
  const status = statusStyles[invoice?.status] || statusStyles.unpaid;
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState(null);
  const [payRef, setPayRef] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showPaidConfirm, setShowPaidConfirm] = useState(false);

  const creatorName = creator
    ? (creator.title ? `${creator.title} ` : '') + (creator.displayName || creator.fullName || creator.email)
    : invoice?.createdBy || 'Staff';

  const handleRecordPayment = async () => {
    if (!payAmount || !payMethod) {
      alert({ type: 'warning', title: 'Required', message: 'Enter amount and select payment method.' });
      return;
    }
    try {
      await recordPayment({
        invoiceId,
        patientId: invoice.patientId,
        amount: parseFloat(payAmount),
        method: payMethod,
        referenceNumber: payRef || undefined,
        recordedBy: currentAccount?.userId || 'unknown',
      });
      const methodLabel = PAYMENT_METHODS.find(m => m.key === payMethod)?.label || payMethod;
      alert({ type: 'success', title: 'Payment Recorded', message: `${formatCurrency(parseFloat(payAmount))} via ${methodLabel}`, buttons: [{ label: 'OK', onPress: () => { setShowPayModal(false); setPayAmount(''); setPayMethod(null); setPayRef(''); } }] });
    } catch (e) {
      alert({ type: 'warning', title: 'Error', message: e.message || 'Failed to record payment.' });
    }
  };

  const handleMarkAsPaid = async () => {
    setShowPaidConfirm(false);
    try {
      await markAsPaid({ id: invoiceId, markedBy: currentAccount?.userId || 'unknown' });
      alert({ type: 'success', title: 'Invoice Paid', message: `${invoice.invoiceNumber} has been marked as paid. This cannot be undone.` });
    } catch (e) {
      alert({ type: 'warning', title: 'Error', message: e.message || 'Failed to mark as paid.' });
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    setPdfLoading(true);
    try {
      const html = buildInvoiceHTML({
        invoice,
        patient,
        lineItems: invoice.lineItems,
        payments: invoice.payments,
        appointment,
        creatorName,
      });
      const result = await downloadInvoicePDF(html, invoice.invoiceNumber);
      if (!result.success) {
        alert({ type: 'warning', title: 'PDF Error', message: result.error || 'Could not generate PDF.' });
      }
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!patient?.email) {
      alert({ type: 'warning', title: 'No Email', message: 'This patient does not have an email address on file.' });
      return;
    }
    setEmailLoading(true);
    try {
      const summary = (invoice.lineItems ?? []).map(i => i.description).join(', ');
      const result = await sendEmail({
        toEmail: patient.email,
        toName: patient.displayName,
        invoiceNumber: invoice.invoiceNumber,
        patientName: patient.displayName,
        total: invoice.total,
        dueDate: invoice.dueDate,
        lineItemsSummary: summary,
        notes: invoice.notes || undefined,
      });
      if (result.success) {
        alert({ type: 'success', title: 'Email Sent', message: `Invoice sent to ${patient.email}` });
      } else {
        alert({ type: 'warning', title: 'Email Failed', message: result.error || 'Could not send email.' });
      }
    } catch (e) {
      alert({ type: 'warning', title: 'Error', message: e.message || 'Failed to send email.' });
    } finally {
      setEmailLoading(false);
    }
  };

  if (!invoice) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Feather name="chevron-left" size={24} color={colors.black} />
          </Pressable>
          <AppText variant="h2" style={styles.headerTitle}>Invoice</AppText>
          <View style={{ width: 24 }} />
        </View>
        <AppText variant="body" color={colors.mediumGrey} style={{ padding: spacing.xl }}>Invoice not found</AppText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>{invoice.invoiceNumber}</AppText>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT }}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: status.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <AppText variant="bodyBold" color={status.color}>{status.label}</AppText>
        </View>

        {/* Patient Info */}
        {patient && (
          <Pressable
            style={styles.patientCard}
            onPress={() => navigation.navigate('PatientProfile', { patientId: patient._id })}
          >
            <Avatar name={patient.displayName} size={40} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <AppText variant="bodyBold">{patient.displayName}</AppText>
              <AppText variant="caption" color={colors.darkGrey}>{patient.patientCode} · {patient.phone}</AppText>
            </View>
            <Feather name="chevron-right" size={16} color={colors.lightGrey} />
          </Pressable>
        )}

        {/* Linked Appointment */}
        {appointment && (
          <View style={styles.appointmentCard}>
            <View style={styles.aptBadge}>
              <Feather name="calendar" size={14} color={colors.navyBlue} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <AppText variant="bodyBold">{appointment.type || 'Appointment'}</AppText>
              <AppText variant="small" color={colors.mediumGrey}>
                {formatDate(appointment.startTime)} · {appointment.status}
              </AppText>
            </View>
          </View>
        )}

        {/* Line Items */}
        <View style={styles.section}>
          <AppText variant="bodyBold" style={styles.sectionTitle}>Line Items</AppText>
          <View style={styles.tableHeader}>
            <AppText variant="small" color={colors.mediumGrey} style={styles.colDesc}>Description</AppText>
            <AppText variant="small" color={colors.mediumGrey} style={styles.colQty}>Qty</AppText>
            <AppText variant="small" color={colors.mediumGrey} style={styles.colPrice}>Price</AppText>
            <AppText variant="small" color={colors.mediumGrey} style={styles.colTotal}>Total</AppText>
          </View>
          <Divider type="full" />
          {invoice.lineItems.map((item, i) => (
            <View key={i}>
              <View style={styles.tableRow}>
                <View style={styles.colDesc}>
                  <AppText variant="body" numberOfLines={2}>{item.description}</AppText>
                  {item.stockItemId && (
                    <View style={styles.stockTag}>
                      <Feather name="package" size={10} color={colors.success} />
                      <AppText variant="small" color={colors.success} style={{ marginLeft: 2 }}>Stock deducted</AppText>
                    </View>
                  )}
                </View>
                <AppText variant="body" style={styles.colQty}>{item.quantity}</AppText>
                <AppText variant="body" style={styles.colPrice}>{formatCurrency(item.unitPrice)}</AppText>
                <AppText variant="bodyBold" style={styles.colTotal}>{formatCurrency(item.total)}</AppText>
              </View>
              {i < invoice.lineItems.length - 1 && <Divider type="full" />}
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <AppText variant="body" color={colors.darkGrey}>Subtotal</AppText>
            <AppText variant="body">{formatCurrency(invoice.subtotal)}</AppText>
          </View>
          <View style={styles.totalRow}>
            <AppText variant="body" color={colors.darkGrey}>Tax</AppText>
            <AppText variant="body">{formatCurrency(invoice.tax)}</AppText>
          </View>
          <Divider type="full" />
          <View style={styles.totalRow}>
            <AppText variant="h3">Total</AppText>
            <AppText variant="h2" color={colors.navyBlue}>{formatCurrency(invoice.total)}</AppText>
          </View>
        </View>

        {/* Payment History */}
        {invoice.payments.length > 0 && (
          <View style={styles.section}>
            <AppText variant="bodyBold" style={styles.sectionTitle}>Payment History</AppText>
            {invoice.payments.map((p, i) => (
              <View key={i} style={styles.paymentRow}>
                <View style={styles.paymentIcon}>
                  <Feather name="check-circle" size={16} color={colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="body">{formatCurrency(p.amount)} via {p.method}</AppText>
                  <AppText variant="small" color={colors.mediumGrey}>{formatTimestamp(p.date)}</AppText>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.section}>
            <AppText variant="bodyBold" style={styles.sectionTitle}>Notes</AppText>
            <AppText variant="body" color={colors.darkGrey}>{invoice.notes}</AppText>
          </View>
        )}

        {/* Created By */}
        <View style={styles.section}>
          <AppText variant="small" color={colors.mediumGrey}>
            Created by {creatorName} · {formatTimestamp(invoice.createdAt)}
          </AppText>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {(invoice.status === 'unpaid' || invoice.status === 'overdue') && (
            <Button label="Record Payment" onPress={() => setShowPayModal(true)} />
          )}
          {(invoice.status === 'unpaid' || invoice.status === 'overdue') && (
            <Pressable style={styles.markPaidBtn} onPress={() => setShowPaidConfirm(true)}>
              <Feather name="check-circle" size={16} color={colors.success} />
              <AppText variant="bodyBold" color={colors.success} style={{ marginLeft: spacing.sm }}>Mark as Paid</AppText>
            </Pressable>
          )}
          <Pressable style={styles.actionRow} onPress={handleSendEmail} disabled={emailLoading}>
            <Feather name="mail" size={16} color={colors.navyBlue} />
            {emailLoading
              ? <ActivityIndicator size="small" color={colors.navyBlue} style={{ marginLeft: spacing.sm }} />
              : <AppText variant="bodyBold" color={colors.navyBlue} style={{ marginLeft: spacing.sm }}>Send to Patient</AppText>}
            {patient?.email && <AppText variant="small" color={colors.mediumGrey} style={{ marginLeft: 'auto' }}>{patient.email}</AppText>}
          </Pressable>
          <Pressable style={styles.actionRow} onPress={handleDownloadPDF} disabled={pdfLoading}>
            <Feather name="download" size={16} color={colors.darkGrey} />
            {pdfLoading
              ? <ActivityIndicator size="small" color={colors.darkGrey} style={{ marginLeft: spacing.sm }} />
              : <AppText variant="bodyBold" color={colors.darkGrey} style={{ marginLeft: spacing.sm }}>Download PDF</AppText>}
          </Pressable>
        </View>

        {/* Paid Confirmation Modal */}
        <Modal visible={showPaidConfirm} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { borderRadius: radius.xl }]}>
              <View style={styles.paidConfirmIcon}>
                <Feather name="alert-triangle" size={32} color={colors.warning} />
              </View>
              <AppText variant="h2" style={{ textAlign: 'center', marginTop: spacing.md }}>Mark as Paid?</AppText>
              <AppText variant="body" color={colors.darkGrey} style={{ textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl }}>
                This will permanently mark {invoice.invoiceNumber} as paid. This action cannot be undone.
              </AppText>
              <Button label="Confirm - Mark as Paid" onPress={handleMarkAsPaid} />
              <Pressable style={{ marginTop: spacing.md, alignItems: 'center' }} onPress={() => setShowPaidConfirm(false)}>
                <AppText variant="body" color={colors.mediumGrey}>Cancel</AppText>
              </Pressable>
            </View>
          </View>
        </Modal>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Record Payment Modal */}
      <Modal visible={showPayModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText variant="h2">Record Payment</AppText>
              <Pressable onPress={() => setShowPayModal(false)} hitSlop={8}>
                <Feather name="x" size={24} color={colors.black} />
              </Pressable>
            </View>
            <AppText variant="caption" color={colors.mediumGrey} style={{ marginBottom: spacing.sm }}>
              {invoice.invoiceNumber} · Outstanding: {formatCurrency(invoice.total - (invoice.payments?.reduce((s, p) => s + p.amount, 0) || 0))}
            </AppText>

            <Input label="Amount (K)" value={payAmount} onChangeText={setPayAmount} placeholder="0.00" keyboardType="numeric" />

            <AppText variant="caption" color={colors.mediumGrey} style={{ letterSpacing: 1, marginTop: spacing.md, marginBottom: spacing.sm }}>PAYMENT METHOD</AppText>
            <View style={styles.payMethodGrid}>
              {PAYMENT_METHODS.map(m => (
                <Pressable key={m.key} style={[styles.payMethodPill, payMethod === m.key && styles.payMethodActive]} onPress={() => setPayMethod(m.key)}>
                  <Feather name={m.icon} size={12} color={payMethod === m.key ? '#fff' : colors.darkGrey} />
                  <AppText variant="small" color={payMethod === m.key ? '#fff' : colors.darkGrey} style={{ marginLeft: 4 }}>{m.label}</AppText>
                </Pressable>
              ))}
            </View>

            {payMethod && payMethod !== 'cash' && (
              <Input label="Reference Number" value={payRef} onChangeText={setPayRef} placeholder="Transaction ref" />
            )}

            <View style={{ marginTop: spacing.xl }}>
              <Button label="Save Payment" onPress={handleRecordPayment} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  headerTitle: { flex: 1, textAlign: 'center' },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    marginHorizontal: spacing.base,
    borderRadius: radius.md,
    marginBottom: spacing.base,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.base,
    padding: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    marginBottom: spacing.base,
  },
  section: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 2, textAlign: 'right' },
  colTotal: { flex: 2, textAlign: 'right' },
  totalsSection: {
    marginHorizontal: spacing.base,
    padding: spacing.base,
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    marginBottom: spacing.base,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  paymentIcon: {
    marginRight: spacing.md,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.base,
    padding: spacing.md,
    backgroundColor: colors.navyLight,
    borderRadius: radius.md,
    marginBottom: spacing.base,
  },
  aptBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  actions: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  markPaidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.success,
    backgroundColor: colors.success + '10',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
  },
  paidConfirmIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.warning + '15',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  payMethodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  payMethodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
    backgroundColor: colors.offWhite,
  },
  payMethodActive: {
    backgroundColor: colors.navyBlue,
  },
});
