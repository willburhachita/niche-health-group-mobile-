import React, { useMemo, useState, useCallback } from 'react';
import {
  View, ScrollView, Pressable, StyleSheet,
  Modal, TextInput, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, TAB_BAR_HEIGHT } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { AppText } from '../../components/common/AppText';
import { Card } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { SectionHeader } from '../../components/common/SectionHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { Badge } from '../../components/common/Badge';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';
import { formatTime } from '../../utils/dateHelpers';

export default function TelehealthScreen({ navigation }) {
  const { currentUserId } = useAuth();
  const now = useMemo(() => Date.now(), []);

  // ── Instant session state ──────────────────────────────────────────────
  const [showInstantModal, setShowInstantModal] = useState(false);
  const [step, setStep] = useState('patient'); // 'patient' | 'invitees'
  const [patientSearch, setPatientSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedInvitees, setSelectedInvitees] = useState([]);
  const [isStarting, setIsStarting] = useState(false);

  const startInstantSession = useMutation(api.telehealth.startSession);

  // ── Convex queries ────────────────────────────────────────────────────
  const queryRange = useMemo(() => ({
    startFrom: now - 30 * 86400000,
    startTo: now + 30 * 86400000,
  }), [now]);
  const allApts = useQuery(api.appointments.listByDateRange, queryRange) ?? [];
  const patients = useQuery(api.patients.list, {}) ?? [];
  const staffList = useQuery(api.auth.getAllUsers, {}) ?? [];

  const activeSession = useQuery(
    api.telehealth.getActiveForProvider,
    currentUserId ? { providerId: currentUserId } : 'skip'
  );
  const completedSessions = useQuery(api.telehealth.listCompleted, { limit: 30 }) ?? [];

  const patientMap = useMemo(() => {
    const m = {};
    patients.forEach(p => { m[p._id] = p; });
    return m;
  }, [patients]);

  const telehealthApts = allApts.filter(a => a.type === 'Telehealth' || a.location === 'Virtual');
  const upcoming = telehealthApts.filter(a => a.startTime > now && a.status !== 'cancelled' && a.status !== 'completed');
  const upcomingSorted = useMemo(() => [...upcoming].sort((a, b) => a.startTime - b.startTime), [upcoming]);

  // ── Modal filtered lists ──────────────────────────────────────────────
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 25);
    const q = patientSearch.toLowerCase();
    return patients.filter(p =>
      p.displayName?.toLowerCase().includes(q) ||
      p.patientCode?.toLowerCase().includes(q)
    ).slice(0, 25);
  }, [patients, patientSearch]);

  const filteredStaff = useMemo(() => {
    const others = staffList.filter(s => s.externalId !== currentUserId);
    if (!staffSearch.trim()) return others.slice(0, 25);
    const q = staffSearch.toLowerCase();
    return others.filter(s =>
      s.displayName?.toLowerCase().includes(q) ||
      s.staffRole?.toLowerCase().includes(q)
    ).slice(0, 25);
  }, [staffList, staffSearch, currentUserId]);

  // ── Helpers ───────────────────────────────────────────────────────────
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const formatDateShort = (ts) => {
    const d = new Date(ts);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  const toggleInvitee = useCallback((userId) => {
    setSelectedInvitees(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  }, []);

  const resetModal = () => {
    setShowInstantModal(false);
    setStep('patient');
    setSelectedPatient(null);
    setSelectedInvitees([]);
    setPatientSearch('');
    setStaffSearch('');
    setIsStarting(false);
  };

  const handleStartInstantSession = async () => {
    if (!selectedPatient || !currentUserId || isStarting) return;
    setIsStarting(true);
    try {
      const result = await startInstantSession({
        patientId: selectedPatient._id,
        providerId: currentUserId,
        invitees: selectedInvitees,
        createdBy: currentUserId,
      });
      resetModal();
      navigation.navigate('TelehealthCall', {
        sessionId: result.sessionId,
        patientId: selectedPatient._id,
      });
    } catch (e) {
      console.error('Failed to start session', e);
      setIsStarting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>Telehealth</AppText>
        <Pressable style={styles.newBtn} onPress={() => setShowInstantModal(true)} hitSlop={4}>
          <Feather name="video" size={13} color={colors.white} />
          <AppText variant="small" color={colors.white} style={{ marginLeft: 4, fontWeight: '700' }}>New</AppText>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT }}>

        {/* Active Session Banner */}
        {activeSession && (
          <View style={{ paddingHorizontal: spacing.base, marginBottom: spacing.base }}>
            <Card>
              <View style={styles.activeBanner}>
                <View style={styles.activeRow}>
                  <View style={styles.liveDot} />
                  <AppText variant="bodyBold" style={{ flex: 1 }}>Call In Progress</AppText>
                  <AppText variant="caption" color={colors.darkGrey}>
                    {activeSession.startedAt ? formatDuration(Math.round((now - activeSession.startedAt) / 1000)) : '--:--'}
                  </AppText>
                </View>
                <View style={styles.activePatientRow}>
                  {patientMap[activeSession.patientId] && (
                    <Avatar name={patientMap[activeSession.patientId].displayName} size={36} />
                  )}
                  <AppText variant="body" style={{ marginLeft: spacing.sm, flex: 1 }}>
                    {patientMap[activeSession.patientId]?.displayName || 'Patient'}
                  </AppText>
                </View>
                <Button
                  label="Rejoin Call"
                  onPress={() => navigation.navigate('TelehealthCall', {
                    appointmentId: activeSession.appointmentId,
                    sessionId: activeSession._id,
                    patientId: activeSession.patientId,
                  })}
                  style={{ marginTop: spacing.md }}
                />
              </View>
            </Card>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Feather name="video" size={20} color={colors.navyBlue} />
            <AppText variant="h2" style={{ marginTop: spacing.xs }}>{upcomingSorted.length}</AppText>
            <AppText variant="small" color={colors.mediumGrey}>Upcoming</AppText>
          </View>
          <View style={styles.statBox}>
            <Feather name="check-circle" size={20} color={colors.success} />
            <AppText variant="h2" style={{ marginTop: spacing.xs }}>{completedSessions.length}</AppText>
            <AppText variant="small" color={colors.mediumGrey}>Completed</AppText>
          </View>
          <View style={styles.statBox}>
            <Feather name="clock" size={20} color={colors.peach} />
            <AppText variant="h2" style={{ marginTop: spacing.xs }}>
              {completedSessions.reduce((a, s) => a + (s.duration || 0), 0) > 0
                ? `${Math.round(completedSessions.reduce((a, s) => a + (s.duration || 0), 0) / 60)}m`
                : '0m'}
            </AppText>
            <AppText variant="small" color={colors.mediumGrey}>Call Time</AppText>
          </View>
        </View>

        {/* Upcoming Sessions */}
        <SectionHeader title="Upcoming Sessions" />
        {upcomingSorted.length === 0 ? (
          <EmptyState icon="video" title="No telehealth sessions" message="No upcoming virtual appointments scheduled" />
        ) : (
          upcomingSorted.map(apt => {
            const patient = apt.patientId ? patientMap[apt.patientId] : null;
            const minutesUntil = Math.round((apt.startTime - now) / 60000);
            const isActive = activeSession?.appointmentId === apt._id;
            const platform = apt.notes?.toLowerCase().includes('zoom') || apt.location?.toLowerCase().includes('zoom') ? 'Zoom'
              : apt.notes?.toLowerCase().includes('meet') || apt.location?.toLowerCase().includes('meet') ? 'Google Meet'
              : 'Jitsi';

            return (
              <Pressable
                key={apt._id}
                style={({ pressed }) => [styles.sessionCard, pressed && styles.pressed, isActive && styles.sessionCardActive]}
                onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: apt._id })}
              >
                <View style={styles.sessionLeft}>
                  {patient && <Avatar name={patient.displayName} size={44} />}
                  <View style={styles.sessionInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', marginBottom: 2 }}>
                      <AppText variant="bodyBold">{patient?.displayName || 'Unknown Patient'}</AppText>
                      <Badge 
                        label={platform} 
                        variant={platform === 'Zoom' ? 'role' : platform === 'Google Meet' ? 'department' : 'success'} 
                      />
                    </View>
                    <AppText variant="caption" color={colors.darkGrey}>
                      {formatTime(apt.startTime)} · {apt.duration}min
                    </AppText>
                    {minutesUntil > 0 && minutesUntil <= 60 && (
                      <AppText variant="small" color={minutesUntil < 5 ? colors.success : colors.peach}>
                        {minutesUntil < 5 ? 'Ready to start' : `Starts in ${minutesUntil}min`}
                      </AppText>
                    )}
                    {apt.notes && (
                      <AppText variant="small" color={colors.mediumGrey} numberOfLines={1}>{apt.notes}</AppText>
                    )}
                  </View>
                </View>
                {/* Start is always allowed — no 5-min gate */}
                <Pressable
                  style={styles.startBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    navigation.navigate('TelehealthCall', {
                      appointmentId: apt._id,
                      patientId: apt.patientId,
                    });
                  }}
                >
                  <Feather name="video" size={16} color={colors.white} />
                  <AppText variant="small" color={colors.white} style={{ marginLeft: spacing.xs }}>
                    {isActive ? 'Rejoin' : 'Start'}
                  </AppText>
                </Pressable>
              </Pressable>
            );
          })
        )}

        {/* Completed Sessions */}
        {completedSessions.length > 0 && (
          <>
            <SectionHeader title="Completed Sessions" />
            {completedSessions.map(session => {
              const patient = patientMap[session.patientId];
              return (
                <Pressable
                  key={session._id}
                  style={({ pressed }) => [styles.pastCard, pressed && styles.pressed]}
                  onPress={() => navigation.navigate('TelehealthCallSummary', {
                    sessionId: session._id,
                    appointmentId: session.appointmentId,
                  })}
                >
                  {patient && <Avatar name={patient.displayName} size={36} />}
                  <View style={styles.pastInfo}>
                    <AppText variant="body">{patient?.displayName || 'Unknown'}</AppText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <AppText variant="small" color={colors.mediumGrey}>
                        {session.startedAt ? formatDateShort(session.startedAt) : '--'} · {formatDuration(session.duration)}
                      </AppText>
                      {session.treatmentNoteId && <Badge label="Notes" variant="success" />}
                      {session.transcription && <Badge label="Transcribed" variant="role" />}
                    </View>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.lightGrey} />
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* ── Instant Session Modal ──────────────────────────────────────── */}
      <Modal visible={showInstantModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Pressable
                onPress={step === 'invitees' ? () => setStep('patient') : resetModal}
                hitSlop={8}
              >
                <Feather name={step === 'invitees' ? 'arrow-left' : 'x'} size={22} color={colors.black} />
              </Pressable>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <AppText variant="h3">
                  {step === 'patient' ? 'Select Patient' : 'Invite Participants'}
                </AppText>
                <AppText variant="small" color={colors.mediumGrey}>
                  {step === 'patient'
                    ? 'Choose who this session is for'
                    : `${selectedInvitees.length} invited · tap to toggle`}
                </AppText>
              </View>
              <View style={styles.stepRow}>
                <View style={[styles.stepDot, step === 'patient' && styles.stepDotActive]} />
                <View style={[styles.stepDot, step === 'invitees' && styles.stepDotActive]} />
              </View>
            </View>

            {step === 'patient' ? (
              <>
                <View style={styles.searchBar}>
                  <Feather name="search" size={16} color={colors.mediumGrey} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search patients..."
                    placeholderTextColor={colors.mediumGrey}
                    value={patientSearch}
                    onChangeText={setPatientSearch}
                    autoFocus
                  />
                  {patientSearch.length > 0 && (
                    <Pressable onPress={() => setPatientSearch('')} hitSlop={8}>
                      <Feather name="x-circle" size={16} color={colors.mediumGrey} />
                    </Pressable>
                  )}
                </View>
                <FlatList
                  data={filteredPatients}
                  keyExtractor={item => item._id}
                  style={{ flex: 1 }}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <Pressable
                      style={[styles.pickRow, selectedPatient?._id === item._id && styles.pickRowSelected]}
                      onPress={() => setSelectedPatient(item)}
                    >
                      <Avatar name={item.displayName} size={40} />
                      <View style={styles.pickInfo}>
                        <AppText variant="body">{item.displayName}</AppText>
                        <AppText variant="small" color={colors.mediumGrey}>
                          {item.patientCode || ''}
                        </AppText>
                      </View>
                      {selectedPatient?._id === item._id && (
                        <View style={styles.checkmark}>
                          <Feather name="check" size={13} color={colors.white} />
                        </View>
                      )}
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyPick}>
                      <Feather name="user" size={24} color={colors.lightGrey} />
                      <AppText variant="body" color={colors.mediumGrey} style={{ marginTop: spacing.sm }}>No patients found</AppText>
                    </View>
                  }
                />
                <View style={styles.modalFooter}>
                  <Button
                    label="Next — Invite Participants"
                    onPress={() => setStep('invitees')}
                    disabled={!selectedPatient}
                  />
                </View>
              </>
            ) : (
              <>
                {/* Selected patient chip */}
                <View style={styles.selectedChip}>
                  <Avatar name={selectedPatient?.displayName} size={28} />
                  <AppText variant="body" style={{ marginLeft: spacing.sm, flex: 1 }}>
                    {selectedPatient?.displayName}
                  </AppText>
                  <Badge label="Patient" variant="role" />
                </View>

                <View style={styles.searchBar}>
                  <Feather name="search" size={16} color={colors.mediumGrey} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search staff to invite..."
                    placeholderTextColor={colors.mediumGrey}
                    value={staffSearch}
                    onChangeText={setStaffSearch}
                  />
                  {staffSearch.length > 0 && (
                    <Pressable onPress={() => setStaffSearch('')} hitSlop={8}>
                      <Feather name="x-circle" size={16} color={colors.mediumGrey} />
                    </Pressable>
                  )}
                </View>
                <AppText variant="small" color={colors.mediumGrey} style={{ paddingHorizontal: spacing.base, marginBottom: spacing.xs }}>
                  Optional — invited staff will receive a notification to join
                </AppText>

                <FlatList
                  data={filteredStaff}
                  keyExtractor={item => item._id}
                  style={{ flex: 1 }}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => {
                    const isSelected = selectedInvitees.includes(item.externalId);
                    return (
                      <Pressable
                        style={[styles.pickRow, isSelected && styles.pickRowSelected]}
                        onPress={() => toggleInvitee(item.externalId)}
                      >
                        <Avatar name={item.displayName} size={40} />
                        <View style={styles.pickInfo}>
                          <AppText variant="body">{item.displayName}</AppText>
                          <AppText variant="small" color={colors.mediumGrey}>
                            {item.staffRole || 'Staff'}{item.department ? ` · ${item.department}` : ''}
                          </AppText>
                        </View>
                        <View style={[styles.checkmark, !isSelected && styles.checkmarkEmpty]}>
                          {isSelected && <Feather name="check" size={13} color={colors.white} />}
                        </View>
                      </Pressable>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.emptyPick}>
                      <Feather name="users" size={24} color={colors.lightGrey} />
                      <AppText variant="body" color={colors.mediumGrey} style={{ marginTop: spacing.sm }}>No staff found</AppText>
                    </View>
                  }
                />
                <View style={styles.modalFooter}>
                  <Button
                    label={isStarting ? 'Starting Session…' : `Start Session${selectedInvitees.length > 0 ? ` · ${selectedInvitees.length} invited` : ''}`}
                    onPress={handleStartInstantSession}
                    disabled={isStarting}
                  />
                  <Pressable style={{ alignItems: 'center', paddingTop: spacing.md }} onPress={handleStartInstantSession}>
                    <AppText variant="small" color={colors.mediumGrey}>{'Skip invites & start now'}</AppText>
                  </Pressable>
                </View>
              </>
            )}
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
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navyBlue,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  activeBanner: {},
  activeRow: { flexDirection: 'row', alignItems: 'center' },
  activePatientRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  liveDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.error,
    marginRight: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  statBox: {
    flex: 1, alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.lightGrey,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    padding: spacing.base,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.lightGrey,
    ...shadows.subtle,
  },
  sessionCardActive: { borderColor: colors.navyBlue, backgroundColor: colors.navyLight },
  pressed: { backgroundColor: colors.offWhite },
  sessionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  sessionInfo: { flex: 1, marginLeft: spacing.md },
  startBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.navyBlue,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, marginLeft: spacing.sm,
  },
  pastCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.base,
  },
  pastInfo: { flex: 1, marginLeft: spacing.md },

  // ── Modal ──────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
    minHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  stepRow: { flexDirection: 'row', gap: spacing.xs },
  stepDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.lightGrey,
  },
  stepDotActive: { backgroundColor: colors.navyBlue },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.base, marginVertical: spacing.md,
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.lightGrey,
  },
  searchInput: {
    flex: 1, marginLeft: spacing.sm,
    fontSize: 15, color: colors.black,
  },
  pickRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.offWhite,
  },
  pickRowSelected: { backgroundColor: colors.navyLight },
  pickInfo: { flex: 1, marginLeft: spacing.md },
  checkmark: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.navyBlue,
    alignItems: 'center', justifyContent: 'center',
  },
  checkmarkEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 2, borderColor: colors.lightGrey,
  },
  emptyPick: { alignItems: 'center', paddingVertical: spacing.xxxl },
  selectedChip: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.base, marginVertical: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.navyLight,
    borderRadius: radius.md,
  },
  modalFooter: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1, borderTopColor: colors.lightGrey,
  },
});
