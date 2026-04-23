import React, { useState } from 'react';
import { View, ScrollView, Pressable, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, TAB_BAR_HEIGHT } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Divider } from '../../components/common/Divider';
import { EmptyState } from '../../components/common/EmptyState';
import { AppointmentCard } from '../../components/clinic/AppointmentCard';
import { InvoiceItem } from '../../components/clinic/InvoiceItem';
import { getPatientById } from '../../data/mockPatients';
import { getAppointmentsForPatient } from '../../data/mockAppointments';
import { getInvoicesByPatient, formatCurrency } from '../../data/mockInvoices';
import { getTreatmentNotesForPatient } from '../../data/mockTreatmentNotes';
import { getUserById } from '../../data/mockUsers';
import { formatTimestamp, formatDate } from '../../utils/dateHelpers';
import { getLettersForPatient, getCasesForPatient, getRecallsForPatient, getCommsForPatient, getConsentForPatient } from '../../data/mockPatientExtras';
import { getPaymentsForPatient, getMethodLabel, getMethodIcon } from '../../data/mockPayments';

const TABS = ['Overview', 'Notes', 'Billing', 'Appointments', 'Letters', 'Cases', 'Statement', 'Recalls', 'Comms'];

const statusBadgeMap = {
  active: { label: 'Active', variant: 'success' },
  discharged: { label: 'Discharged', variant: 'warning' },
  inactive: { label: 'Inactive', variant: 'role' },
};

export default function PatientProfileScreen({ route, navigation }) {
  const { patientId } = route.params;
  const patient = getPatientById(patientId);
  const [activeTab, setActiveTab] = useState('Overview');

  if (!patient) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Feather name="chevron-left" size={24} color={colors.black} />
          </Pressable>
          <AppText variant="h2" style={styles.headerTitle}>Patient</AppText>
          <View style={{ width: 24 }} />
        </View>
        <AppText variant="body" color={colors.mediumGrey} style={{ padding: spacing.xl }}>Patient not found</AppText>
      </SafeAreaView>
    );
  }

  const statusInfo = statusBadgeMap[patient.status] || statusBadgeMap.active;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>Patient</AppText>
        <Pressable onPress={() => navigation.navigate('AddEditPatient', { patientId })} hitSlop={8}>
          <Feather name="edit-2" size={20} color={colors.navyBlue} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT }}>
        {/* Patient Header Card */}
        <View style={styles.profileCard}>
          <Avatar name={patient.displayName} size={72} />
          <AppText variant="h1" style={styles.patientName}>{patient.displayName}</AppText>
          <Badge label={patient.patientId} variant="role" style={{ marginBottom: spacing.sm }} />
          <View style={styles.infoRow}>
            <AppText variant="caption" color={colors.darkGrey}>
              {patient.age} yrs, {patient.gender}
            </AppText>
            <Badge label={statusInfo.label} variant={statusInfo.variant} />
          </View>
          <View style={styles.contactRow}>
            <AppText variant="caption" color={colors.mediumGrey}>{patient.phone}</AppText>
            <AppText variant="caption" color={colors.mediumGrey}> · </AppText>
            <AppText variant="caption" color={colors.mediumGrey}>{patient.email}</AppText>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable style={styles.actionBtn}>
              <Feather name="phone" size={18} color={colors.navyBlue} />
              <AppText variant="small" color={colors.navyBlue}>Call</AppText>
            </Pressable>
            <Pressable style={styles.actionBtn}>
              <Feather name="message-circle" size={18} color={colors.navyBlue} />
              <AppText variant="small" color={colors.navyBlue}>SMS</AppText>
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={() => navigation.navigate('BookAppointment')}>
              <Feather name="calendar" size={18} color={colors.navyBlue} />
              <AppText variant="small" color={colors.navyBlue}>Book Apt</AppText>
            </Pressable>
          </View>
        </View>

        {/* Tab Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {TABS.map(tab => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <AppText
                variant="caption"
                color={activeTab === tab ? colors.navyBlue : colors.mediumGrey}
                style={activeTab === tab ? styles.tabTextActive : null}
              >
                {tab}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>

        {/* Tab Content */}
        {activeTab === 'Overview' && <OverviewTab patient={patient} />}
        {activeTab === 'Notes' && <NotesTab patientId={patientId} navigation={navigation} />}
        {activeTab === 'Billing' && <BillingTab patientId={patientId} navigation={navigation} />}
        {activeTab === 'Appointments' && <AppointmentsTab patientId={patientId} navigation={navigation} />}
        {activeTab === 'Letters' && <LettersTab patientId={patientId} />}
        {activeTab === 'Cases' && <CasesTab patientId={patientId} />}
        {activeTab === 'Statement' && <StatementTab patientId={patientId} />}
        {activeTab === 'Recalls' && <RecallsTab patientId={patientId} />}
        {activeTab === 'Comms' && <CommsTab patientId={patientId} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function OverviewTab({ patient }) {
  return (
    <View style={styles.tabContent}>
      {/* Allergies */}
      {patient.allergies.length > 0 && (
        <Card variant="highlighted">
          <View style={styles.sectionTitleRow}>
            <Feather name="alert-triangle" size={16} color={colors.warning} />
            <AppText variant="bodyBold" style={{ marginLeft: spacing.sm }}>Allergies</AppText>
          </View>
          <View style={styles.tagRow}>
            {patient.allergies.map(a => (
              <View key={a} style={styles.allergyTag}>
                <AppText variant="caption" color={colors.error}>{a}</AppText>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Current Medications */}
      <Card>
        <AppText variant="bodyBold" style={{ marginBottom: spacing.sm }}>Current Medications</AppText>
        {patient.medications.map((med, i) => (
          <View key={i} style={styles.medRow}>
            <Feather name="check-circle" size={14} color={colors.success} />
            <AppText variant="body" style={{ marginLeft: spacing.sm }}>{med}</AppText>
          </View>
        ))}
      </Card>

      {/* Conditions */}
      <Card>
        <AppText variant="bodyBold" style={{ marginBottom: spacing.sm }}>Key Conditions</AppText>
        {patient.conditions.map((c, i) => (
          <View key={i} style={styles.medRow}>
            <Feather name="clipboard" size={14} color={colors.navyBlue} />
            <AppText variant="body" style={{ marginLeft: spacing.sm }}>{c}</AppText>
          </View>
        ))}
      </Card>

      {/* Emergency Contact */}
      <Card>
        <AppText variant="bodyBold" style={{ marginBottom: spacing.sm }}>Emergency Contact</AppText>
        <AppText variant="body">{patient.emergencyContact.name}</AppText>
        <AppText variant="caption" color={colors.darkGrey}>
          {patient.emergencyContact.relationship} · {patient.emergencyContact.phone}
        </AppText>
      </Card>

      {/* Insurance */}
      <Card>
        <AppText variant="bodyBold" style={{ marginBottom: spacing.sm }}>Insurance</AppText>
        <AppText variant="body">{patient.insuranceProvider || 'Self-pay'}</AppText>
        {patient.policyNumber && (
          <AppText variant="caption" color={colors.darkGrey}>Policy: {patient.policyNumber}</AppText>
        )}
      </Card>

      {/* Other Info */}
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <AppText variant="small" color={colors.mediumGrey}>Blood Type</AppText>
          <AppText variant="bodyBold">{patient.bloodType}</AppText>
        </View>
        <View style={styles.infoItem}>
          <AppText variant="small" color={colors.mediumGrey}>Department</AppText>
          <AppText variant="bodyBold">{patient.department}</AppText>
        </View>
        <View style={styles.infoItem}>
          <AppText variant="small" color={colors.mediumGrey}>DOB</AppText>
          <AppText variant="bodyBold">{patient.dateOfBirth}</AppText>
        </View>
        <View style={styles.infoItem}>
          <AppText variant="small" color={colors.mediumGrey}>Registered</AppText>
          <AppText variant="bodyBold">{formatTimestamp(patient.registeredAt)}</AppText>
        </View>
      </View>
    </View>
  );
}

function NotesTab({ patientId, navigation }) {
  const notes = getTreatmentNotesForPatient(patientId);

  return (
    <View style={styles.tabContent}>
      {notes.length === 0 ? (
        <EmptyState icon="file-text" title="No treatment notes" message="Add a note for this patient" />
      ) : (
        notes.map(note => {
          const provider = getUserById(note.providerId);
          return (
            <Card key={note.id} onPress={() => navigation.navigate('TreatmentNote', { noteId: note.id, patientId })}>
              <View style={styles.noteHeader}>
                <AppText variant="bodyBold">{note.template}</AppText>
                <AppText variant="small" color={colors.mediumGrey}>{formatTimestamp(note.date)}</AppText>
              </View>
              <AppText variant="caption" color={colors.darkGrey} numberOfLines={2} style={{ marginTop: spacing.xs }}>
                {note.assessment}
              </AppText>
              {provider && (
                <AppText variant="small" color={colors.mediumGrey} style={{ marginTop: spacing.xs }}>
                  by {provider.displayName}
                </AppText>
              )}
            </Card>
          );
        })
      )}
      <Pressable
        style={styles.addNoteBtn}
        onPress={() => navigation.navigate('TreatmentNote', { patientId })}
      >
        <Feather name="plus" size={16} color={colors.navyBlue} />
        <AppText variant="bodyBold" color={colors.navyBlue} style={{ marginLeft: spacing.sm }}>Add Treatment Note</AppText>
      </Pressable>
    </View>
  );
}

function LettersTab({ patientId }) {
  const letters = getLettersForPatient(patientId);
  const typeIcons = { referral: 'send', discharge_summary: 'file-text', medical_certificate: 'award', sick_note: 'thermometer', other: 'file' };
  return (
    <View style={styles.tabContent}>
      {letters.length === 0 ? (
        <EmptyState icon="mail" title="No letters" message="No referral or discharge letters" />
      ) : (
        letters.map(l => (
          <Card key={l.id}>
            <View style={styles.noteHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Feather name={typeIcons[l.type] || 'file'} size={14} color={colors.navyBlue} />
                <AppText variant="bodyBold" style={{ marginLeft: spacing.sm }} numberOfLines={1}>{l.title}</AppText>
              </View>
              <AppText variant="small" color={colors.mediumGrey}>{formatTimestamp(l.createdAt)}</AppText>
            </View>
            <AppText variant="caption" color={colors.darkGrey} numberOfLines={2} style={{ marginTop: spacing.xs }}>{l.content}</AppText>
            {l.recipientName && <AppText variant="small" color={colors.mediumGrey} style={{ marginTop: spacing.xs }}>To: {l.recipientName}</AppText>}
          </Card>
        ))
      )}
    </View>
  );
}

function CasesTab({ patientId }) {
  const cases = getCasesForPatient(patientId);
  return (
    <View style={styles.tabContent}>
      {cases.length === 0 ? (
        <EmptyState icon="briefcase" title="No cases" message="No clinical cases for this patient" />
      ) : (
        cases.map(c => (
          <Card key={c.id}>
            <View style={styles.noteHeader}>
              <AppText variant="bodyBold" style={{ flex: 1 }} numberOfLines={1}>{c.name}</AppText>
              <Badge label={c.status === 'open' ? 'Open' : 'Closed'} variant={c.status === 'open' ? 'success' : 'role'} />
            </View>
            {c.description && <AppText variant="caption" color={colors.darkGrey} numberOfLines={2} style={{ marginTop: spacing.xs }}>{c.description}</AppText>}
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
              <AppText variant="small" color={colors.mediumGrey}>{c.linkedAppointmentIds.length} appts</AppText>
              <AppText variant="small" color={colors.mediumGrey}>{c.linkedNoteIds.length} notes</AppText>
              <AppText variant="small" color={colors.mediumGrey}>{c.linkedInvoiceIds.length} invoices</AppText>
            </View>
          </Card>
        ))
      )}
    </View>
  );
}

function StatementTab({ patientId }) {
  const invoices = getInvoicesByPatient(patientId);
  const payments = getPaymentsForPatient(patientId);
  const totalCharged = invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const balance = totalCharged - totalPaid;

  const timeline = [
    ...invoices.map(i => ({ type: 'charge', amount: i.total, label: i.invoiceNumber, date: i.createdAt })),
    ...payments.filter(p => p.status === 'completed').map(p => ({ type: 'payment', amount: p.amount, label: getMethodLabel(p.method), date: p.paymentDate })),
  ].sort((a, b) => b.date - a.date);

  return (
    <View style={styles.tabContent}>
      <Card variant="highlighted">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View><AppText variant="small" color={colors.mediumGrey}>Charged</AppText><AppText variant="bodyBold">{formatCurrency(totalCharged)}</AppText></View>
          <View><AppText variant="small" color={colors.mediumGrey}>Paid</AppText><AppText variant="bodyBold" color={colors.success}>{formatCurrency(totalPaid)}</AppText></View>
          <View><AppText variant="small" color={colors.mediumGrey}>Balance</AppText><AppText variant="bodyBold" color={balance > 0 ? colors.error : colors.success}>{formatCurrency(balance)}</AppText></View>
        </View>
      </Card>
      {timeline.length === 0 ? (
        <EmptyState icon="file-text" title="No transactions" message="No charges or payments" />
      ) : (
        timeline.map((t, i) => (
          <View key={i} style={{ flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.offWhite }}>
            <Feather name={t.type === 'charge' ? 'arrow-up-right' : 'arrow-down-left'} size={16} color={t.type === 'charge' ? colors.error : colors.success} style={{ marginRight: spacing.sm, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <AppText variant="body">{t.label}</AppText>
              <AppText variant="small" color={colors.mediumGrey}>{formatTimestamp(t.date)}</AppText>
            </View>
            <AppText variant="bodyBold" color={t.type === 'charge' ? colors.error : colors.success}>{t.type === 'charge' ? '-' : '+'}{formatCurrency(t.amount)}</AppText>
          </View>
        ))
      )}
    </View>
  );
}

function RecallsTab({ patientId }) {
  const recalls = getRecallsForPatient(patientId);
  const statusColors = { pending: colors.warning, completed: colors.success, overdue: colors.error, cancelled: colors.mediumGrey };
  return (
    <View style={styles.tabContent}>
      {recalls.length === 0 ? (
        <EmptyState icon="bell" title="No recalls" message="No follow-up reminders for this patient" />
      ) : (
        recalls.map(r => (
          <Card key={r.id}>
            <View style={styles.noteHeader}>
              <AppText variant="bodyBold" style={{ flex: 1 }}>{r.reason}</AppText>
              <Badge label={r.status.charAt(0).toUpperCase() + r.status.slice(1)} variant={r.status === 'overdue' ? 'error' : r.status === 'completed' ? 'success' : 'warning'} />
            </View>
            <AppText variant="caption" color={colors.darkGrey} style={{ marginTop: spacing.xs }}>Due: {formatDate(r.dueDate)}</AppText>
            <AppText variant="small" color={colors.mediumGrey} style={{ marginTop: 2 }}>Notify via {r.notificationMethod.toUpperCase()}{r.notificationSent ? ' (sent)' : ''}</AppText>
            {r.notes && <AppText variant="small" color={colors.mediumGrey} style={{ marginTop: 2 }}>{r.notes}</AppText>}
          </Card>
        ))
      )}
    </View>
  );
}

function CommsTab({ patientId }) {
  const comms = getCommsForPatient(patientId);
  const typeIcons = { sms: 'message-circle', email: 'mail', phone_call: 'phone', in_app: 'smartphone' };
  const dirColors = { inbound: colors.success, outbound: colors.navyBlue };
  return (
    <View style={styles.tabContent}>
      {comms.length === 0 ? (
        <EmptyState icon="message-circle" title="No communications" message="No communication history" />
      ) : (
        comms.map(c => {
          const loggedByUser = getUserById(c.loggedBy);
          return (
            <View key={c.id} style={{ flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.offWhite }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: dirColors[c.direction] + '14', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md }}>
                <Feather name={typeIcons[c.type] || 'message-circle'} size={14} color={dirColors[c.direction]} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText variant="bodyBold">{c.type.replace(/_/g, ' ').replace(/^\w/, ch => ch.toUpperCase())}</AppText>
                  <Feather name={c.direction === 'inbound' ? 'arrow-down-left' : 'arrow-up-right'} size={12} color={dirColors[c.direction]} />
                </View>
                {c.content && <AppText variant="caption" color={colors.darkGrey} numberOfLines={2}>{c.content}</AppText>}
                {c.duration && <AppText variant="small" color={colors.mediumGrey}>Duration: {Math.floor(c.duration / 60)}m {c.duration % 60}s</AppText>}
                <AppText variant="small" color={colors.mediumGrey}>{loggedByUser?.displayName} · {formatTimestamp(c.createdAt)}</AppText>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

function BillingTab({ patientId, navigation }) {
  const invoices = getInvoicesByPatient(patientId);
  const outstanding = invoices
    .filter(i => i.status === 'unpaid' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.total, 0);

  return (
    <View style={styles.tabContent}>
      {outstanding > 0 && (
        <Card variant="highlighted">
          <AppText variant="small" color={colors.mediumGrey}>Outstanding Balance</AppText>
          <AppText variant="h1" color={colors.peach}>{formatCurrency(outstanding)}</AppText>
        </Card>
      )}
      {invoices.length === 0 ? (
        <EmptyState icon="credit-card" title="No invoices" message="No billing records for this patient" />
      ) : (
        invoices.map(inv => (
          <React.Fragment key={inv.id}>
            <InvoiceItem invoice={inv} onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: inv.id })} />
            <Divider type="inset" />
          </React.Fragment>
        ))
      )}
    </View>
  );
}

function AppointmentsTab({ patientId, navigation }) {
  const appointments = getAppointmentsForPatient(patientId);

  return (
    <View style={styles.tabContent}>
      {appointments.length === 0 ? (
        <EmptyState icon="calendar" title="No appointments" message="Book an appointment for this patient" />
      ) : (
        appointments.map(apt => (
          <AppointmentCard
            key={apt.id}
            appointment={apt}
            compact
            onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: apt.id })}
          />
        ))
      )}
    </View>
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
  profileCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.base,
  },
  patientName: { marginTop: spacing.md, marginBottom: spacing.sm },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  actionBtn: {
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  tabRow: {
    paddingHorizontal: spacing.base,
    gap: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  tab: {
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.transparent,
  },
  tabActive: {
    borderBottomColor: colors.navyBlue,
  },
  tabTextActive: {
    fontWeight: '600',
  },
  tabContent: {
    padding: spacing.base,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  allergyTag: {
    backgroundColor: colors.error + '14',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.navyBlue,
    borderStyle: 'dashed',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  infoItem: {
    width: '48%',
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
