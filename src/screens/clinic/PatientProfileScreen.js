import React, { useState, useMemo } from 'react';
import { View, ScrollView, Pressable, FlatList, StyleSheet, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
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
import { formatTimestamp, formatDate } from '../../utils/dateHelpers';

function formatCurrency(amount) {
  return `K ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const TABS = ['Overview', 'Notes', 'Billing', 'Appointments', 'Forms', 'Letters', 'Cases', 'Recalls', 'Communications'];

const statusBadgeMap = {
  active: { label: 'Active', variant: 'success' },
  discharged: { label: 'Discharged', variant: 'warning' },
  inactive: { label: 'Inactive', variant: 'role' },
};

export default function PatientProfileScreen({ route, navigation }) {
  const { patientId } = route.params;
  const patient = useQuery(api.patients.get, { id: patientId });
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

  const statusInfo = statusBadgeMap[patient?.status] || statusBadgeMap.active;

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
          <Badge label={patient.patientCode} variant="role" style={{ marginBottom: spacing.sm }} />
          <View style={styles.infoRow}>
            <AppText variant="caption" color={colors.darkGrey}>
              {patient.dateOfBirth}, {patient.gender}
            </AppText>
            <Badge label={statusInfo.label} variant={statusInfo.variant} />
          </View>
          <View style={styles.contactRow}>
            <AppText variant="caption" color={colors.mediumGrey}>{patient.phone}</AppText>
            <AppText variant="caption" color={colors.mediumGrey}> · </AppText>
            <AppText variant="caption" color={colors.mediumGrey}>{patient.email}</AppText>
          </View>

          {/* Medical Alerts HUD */}
          {patient.medicalAlerts && patient.medicalAlerts.length > 0 && (
            <View style={styles.medicalAlertsContainer}>
              <View style={styles.medicalAlertHeader}>
                <Feather name="alert-triangle" size={14} color={colors.error} />
                <AppText variant="captionBold" color={colors.error} style={{ marginLeft: spacing.xs }}>
                  MEDICAL ALERTS
                </AppText>
              </View>
              <View style={styles.medicalAlertsList}>
                {patient.medicalAlerts.map((alert, index) => (
                  <View key={index} style={styles.medicalAlertBadge}>
                    <AppText variant="caption" color={colors.error} style={{ fontWeight: '600' }}>
                      {alert}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable
              style={styles.actionBtn}
              onPress={() => {
                if (!patient.phone) {
                  Alert.alert('No Phone', 'This patient has no phone number on record.');
                  return;
                }
                Linking.openURL(`tel:${patient.phone}`);
              }}
            >
              <Feather name="phone" size={18} color={colors.navyBlue} />
              <AppText variant="small" color={colors.navyBlue}>Call</AppText>
            </Pressable>
            <Pressable
              style={styles.actionBtn}
              onPress={() => {
                if (!patient.phone) {
                  Alert.alert('No Phone', 'This patient has no phone number on record.');
                  return;
                }
                Linking.openURL(`sms:${patient.phone}`);
              }}
            >
              <Feather name="message-circle" size={18} color={colors.navyBlue} />
              <AppText variant="small" color={colors.navyBlue}>SMS</AppText>
            </Pressable>
            <Pressable
              style={styles.actionBtn}
              onPress={() => navigation.navigate('BookAppointment', { patientId: patient._id })}
            >
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
        {activeTab === 'Forms' && <FormsTab patientId={patientId} />}
        {activeTab === 'Letters' && <LettersTab patientId={patientId} />}
        {activeTab === 'Cases' && <CasesTab patientId={patientId} />}
        {activeTab === 'Recalls' && <RecallsTab patientId={patientId} />}
        {activeTab === 'Communications' && <CommunicationsTab patientId={patientId} />}
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
        <AppText variant="body">{patient.emergencyContactName || 'Not set'}</AppText>
        <AppText variant="caption" color={colors.darkGrey}>
          {patient.emergencyContactRelationship || ''} · {patient.emergencyContactPhone || ''}
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
          <AppText variant="bodyBold">{patient.bloodType || 'N/A'}</AppText>
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
          <AppText variant="bodyBold">{formatTimestamp(patient.createdAt)}</AppText>
        </View>
      </View>
    </View>
  );
}

function NotesTab({ patientId, navigation }) {
  const notes = useQuery(api.treatmentNotes.listByPatient, { patientId }) ?? [];

  return (
    <View style={styles.tabContent}>
      {notes.length === 0 ? (
        <EmptyState icon="file-text" title="No treatment notes" message="Add a note for this patient" />
      ) : (
        notes.map(note => (
          <Card key={note._id} onPress={() => navigation.navigate('TreatmentNote', { noteId: note._id, patientId })}>
            <View style={styles.noteHeader}>
              <AppText variant="bodyBold">{note.template}</AppText>
              <AppText variant="small" color={colors.mediumGrey}>{formatTimestamp(note.createdAt)}</AppText>
            </View>
            <AppText variant="caption" color={colors.darkGrey} numberOfLines={2} style={{ marginTop: spacing.xs }}>
              {note.assessment}
            </AppText>
          </Card>
        ))
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

function BillingTab({ patientId, navigation }) {
  const invoices = useQuery(api.invoices.listByPatient, { patientId }) ?? [];
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
          <React.Fragment key={inv._id}>
            <InvoiceItem invoice={inv} onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: inv._id })} />
            <Divider type="inset" />
          </React.Fragment>
        ))
      )}
    </View>
  );
}

function AppointmentsTab({ patientId, navigation }) {
  const appointments = useQuery(api.appointments.listByPatient, { patientId }) ?? [];
  const patients = useQuery(api.patients.list, {}) ?? [];
  const patientMap = useMemo(() => {
    const map = {};
    patients.forEach(p => { map[p._id] = p; });
    return map;
  }, [patients]);

  return (
    <View style={styles.tabContent}>
      {appointments.length === 0 ? (
        <EmptyState icon="calendar" title="No appointments" message="Book an appointment for this patient" />
      ) : (
        appointments.map(apt => (
          <AppointmentCard
            key={apt._id}
            appointment={apt}
            patient={apt.patientId ? patientMap[apt.patientId] : null}
            compact
            onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: apt._id })}
          />
        ))
      )}
    </View>
  );
}

function FormsTab({ patientId }) {
  const forms = useQuery(api.patientForms.listByPatient, { patientId }) ?? [];
  return (
    <View style={styles.tabContent}>
      {forms.length === 0 ? (
        <EmptyState icon="file" title="No Forms" message="No custom forms filed for this patient" />
      ) : (
        forms.map(form => (
          <Card key={form._id} style={{ marginBottom: spacing.sm }}>
            <View style={styles.noteHeader}>
              <AppText variant="bodyBold">{form.title}</AppText>
              <Badge label={form.status} variant={form.status === 'submitted' ? 'success' : 'warning'} />
            </View>
            <AppText variant="caption" color={colors.darkGrey} style={{ marginTop: spacing.xs }}>
              Filed by {form.submittedBy} on {formatDate(form.submittedAt)}
            </AppText>
          </Card>
        ))
      )}
    </View>
  );
}

function LettersTab({ patientId }) {
  const letters = useQuery(api.patientLetters.listByPatient, { patientId }) ?? [];
  return (
    <View style={styles.tabContent}>
      {letters.length === 0 ? (
        <EmptyState icon="mail" title="No Letters" message="No referral or clinical letters sent" />
      ) : (
        letters.map(letter => (
          <Card key={letter._id} style={{ marginBottom: spacing.sm }}>
            <View style={styles.noteHeader}>
              <AppText variant="bodyBold">{letter.subject}</AppText>
              <Badge label={letter.status} variant={letter.status === 'sent' ? 'success' : 'warning'} />
            </View>
            <AppText variant="caption" color={colors.mediumGrey} style={{ marginTop: spacing.xs }}>
              To: {letter.recipient}
            </AppText>
            <AppText variant="caption" color={colors.darkGrey} numberOfLines={2} style={{ marginTop: spacing.xs }}>
              {letter.body}
            </AppText>
            <AppText variant="caption" color={colors.mediumGrey} style={{ marginTop: spacing.xs }}>
              Author: {letter.sentBy} · {formatDate(letter.sentAt)}
            </AppText>
          </Card>
        ))
      )}
    </View>
  );
}

function CasesTab({ patientId }) {
  const cases = useQuery(api.patientCases.listByPatient, { patientId }) ?? [];
  return (
    <View style={styles.tabContent}>
      {cases.length === 0 ? (
        <EmptyState icon="folder" title="No Cases" message="No open medical cases/episodes" />
      ) : (
        cases.map(item => (
          <Card key={item._id} style={{ marginBottom: spacing.sm }}>
            <View style={styles.noteHeader}>
              <AppText variant="bodyBold">{item.title}</AppText>
              <Badge label={item.status} variant={item.status === 'open' ? 'success' : 'role'} />
            </View>
            {item.description && (
              <AppText variant="caption" color={colors.darkGrey} style={{ marginTop: spacing.xs }}>
                {item.description}
              </AppText>
            )}
            <AppText variant="caption" color={colors.mediumGrey} style={{ marginTop: spacing.xs }}>
              Opened: {formatDate(item.openedAt)} by {item.openedBy}
              {item.closedAt && ` · Closed: ${formatDate(item.closedAt)}`}
            </AppText>
          </Card>
        ))
      )}
    </View>
  );
}

function RecallsTab({ patientId }) {
  const recalls = useQuery(api.patientRecalls.listByPatient, { patientId }) ?? [];
  return (
    <View style={styles.tabContent}>
      {recalls.length === 0 ? (
        <EmptyState icon="clock" title="No Recalls" message="No upcoming clinical recalls" />
      ) : (
        recalls.map(recall => {
          const isOverdue = recall.status === 'pending' && recall.dueDate < Date.now();
          return (
            <Card key={recall._id} style={{ marginBottom: spacing.sm }}>
              <View style={styles.noteHeader}>
                <AppText variant="bodyBold">{recall.recallType}</AppText>
                <Badge 
                  label={recall.status} 
                  variant={recall.status === 'completed' ? 'success' : isOverdue ? 'danger' : 'warning'} 
                />
              </View>
              <AppText variant="caption" color={isOverdue ? colors.error : colors.darkGrey} style={{ marginTop: spacing.xs }}>
                Due Date: {formatDate(recall.dueDate)} {isOverdue && '(Overdue)'}
              </AppText>
              {recall.notes && (
                <AppText variant="caption" color={colors.mediumGrey} style={{ marginTop: spacing.xs, fontStyle: 'italic' }}>
                  "{recall.notes}"
                </AppText>
              )}
              <AppText variant="caption" color={colors.mediumGrey} style={{ marginTop: spacing.xs }}>
                Scheduled by {recall.scheduledBy}
              </AppText>
            </Card>
          );
        })
      )}
    </View>
  );
}

function CommunicationsTab({ patientId }) {
  const comms = useQuery(api.patientCommunications.listByPatient, { patientId }) ?? [];
  return (
    <View style={styles.tabContent}>
      {comms.length === 0 ? (
        <EmptyState icon="message-square" title="No Communications" message="No contact history logs" />
      ) : (
        comms.map(comm => {
          const isOutbound = comm.direction === 'outbound';
          return (
            <Card key={comm._id} style={{ marginBottom: spacing.sm }}>
              <View style={styles.noteHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <Feather 
                    name={isOutbound ? "arrow-up-right" : "arrow-down-left"} 
                    size={14} 
                    color={isOutbound ? colors.navyBlue : colors.success} 
                  />
                  <AppText variant="bodyBold">{comm.type}</AppText>
                </View>
                <Badge 
                  label={comm.status} 
                  variant={comm.status === 'sent' || comm.status === 'delivered' ? 'success' : comm.status === 'failed' ? 'danger' : 'role'} 
                />
              </View>
              {comm.subject && (
                <AppText variant="captionBold" color={colors.darkGrey} style={{ marginTop: spacing.xs }}>
                  Subject: {comm.subject}
                </AppText>
              )}
              <AppText variant="caption" color={colors.darkGrey} style={{ marginTop: spacing.xs }}>
                {comm.message}
              </AppText>
              <AppText variant="caption" color={colors.mediumGrey} style={{ marginTop: spacing.xs }}>
                {isOutbound ? `Sent by ${comm.sentBy}` : 'Inbound call/SMS'} · {formatDate(comm.sentAt)}
              </AppText>
            </Card>
          );
        })
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
  medicalAlertsContainer: {
    width: '100%',
    backgroundColor: colors.error + '0A',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error + '25',
    marginVertical: spacing.sm,
  },
  medicalAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  medicalAlertsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  medicalAlertBadge: {
    backgroundColor: colors.error + '14',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
});
