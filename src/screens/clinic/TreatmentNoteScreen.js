import React, { useState } from 'react';
import { View, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { typography } from '../../constants/typography';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { Divider } from '../../components/common/Divider';
import { VitalsInput } from '../../components/clinic/VitalsInput';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../components/common/CustomAlert';
import { formatDate, formatTime } from '../../utils/dateHelpers';

const TREATMENT_TEMPLATES = ['General Consultation', 'Follow-up', 'Emergency', 'Procedure', 'Mental Health', 'Paediatric'];

export default function TreatmentNoteScreen({ route, navigation }) {
  const { patientId, noteId } = route.params || {};
  const alert = useAlert();
  const { currentAccount } = useAuth();
  const existingNote = useQuery(api.treatmentNotes.get, noteId ? { id: noteId } : 'skip');
  const resolvedPatientId = patientId || existingNote?.patientId;
  const patient = useQuery(api.patients.get, resolvedPatientId ? { id: resolvedPatientId } : 'skip');
  const createNote = useMutation(api.treatmentNotes.create);
  const isReadOnly = !!existingNote;

  const [template, setTemplate] = useState(existingNote?.template || '');
  const [subjective, setSubjective] = useState(existingNote?.subjective || '');
  const [objective, setObjective] = useState(existingNote?.objective || '');
  const [assessment, setAssessment] = useState(existingNote?.assessment || '');
  const [plan, setPlan] = useState(existingNote?.plan || '');
  const [vitals, setVitals] = useState(existingNote?.vitals || {});
  const [showVitals, setShowVitals] = useState(!!existingNote?.vitals?.bp);

  const handleSave = async () => {
    if (!resolvedPatientId) {
      alert({ type: 'warning', title: 'Error', message: 'No patient selected.' });
      return;
    }
    try {
      await createNote({
        patientId: resolvedPatientId,
        providerId: currentAccount?.userId || 'unknown',
        template: template || 'General Consultation',
        subjective: subjective || undefined,
        objective: objective || undefined,
        assessment: assessment || undefined,
        plan: plan || undefined,
        vitals: showVitals ? vitals : undefined,
        isPrivate: false,
      });
      alert({
        type: 'success',
        title: 'Note Saved',
        message: 'Treatment note has been saved.',
        buttons: [{ label: 'OK', onPress: () => navigation.goBack() }],
      });
    } catch (e) {
      alert({ type: 'warning', title: 'Error', message: e.message || 'Failed to save note.' });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name={isReadOnly ? 'chevron-left' : 'x'} size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>Treatment Note</AppText>
        {!isReadOnly ? (
          <Pressable onPress={handleSave} hitSlop={8}>
            <AppText variant="bodyBold" color={colors.navyBlue}>Save</AppText>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Patient Banner */}
        {patient && (
          <View style={styles.patientBanner}>
            <Avatar name={patient.displayName} size={36} />
            <View style={{ marginLeft: spacing.sm, flex: 1 }}>
              <AppText variant="bodyBold">{patient.displayName}</AppText>
              <AppText variant="small" color={colors.mediumGrey}>{patient.patientCode}</AppText>
            </View>
            {existingNote && (
              <AppText variant="small" color={colors.mediumGrey}>
                {formatDate(existingNote.date)}
              </AppText>
            )}
          </View>
        )}

        {/* Template Picker */}
        {!isReadOnly && (
          <>
            <AppText variant="bodyBold" style={styles.label}>Template</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateRow}>
              {TREATMENT_TEMPLATES.map(t => (
                <Pressable
                  key={t}
                  style={[styles.templatePill, template === t && styles.templatePillActive]}
                  onPress={() => setTemplate(t)}
                >
                  <AppText variant="caption" color={template === t ? colors.white : colors.navyBlue}>{t}</AppText>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}
        {isReadOnly && existingNote && (
          <View style={styles.templateBadge}>
            <AppText variant="caption" color={colors.navyBlue}>{existingNote.template}</AppText>
          </View>
        )}

        <Divider type="section" />

        {/* SOAP Notes */}
        <SOAPField
          label="Subjective"
          sublabel="Patient's complaint"
          value={subjective}
          onChange={setSubjective}
          readOnly={isReadOnly}
        />
        <SOAPField
          label="Objective"
          sublabel="Examination findings"
          value={objective}
          onChange={setObjective}
          readOnly={isReadOnly}
        />
        <SOAPField
          label="Assessment"
          sublabel="Diagnosis"
          value={assessment}
          onChange={setAssessment}
          readOnly={isReadOnly}
        />
        <SOAPField
          label="Plan"
          sublabel="Treatment plan"
          value={plan}
          onChange={setPlan}
          readOnly={isReadOnly}
        />

        {/* Vitals */}
        {!isReadOnly && !showVitals && (
          <Pressable style={styles.expandBtn} onPress={() => setShowVitals(true)}>
            <Feather name="plus" size={16} color={colors.navyBlue} />
            <AppText variant="bodyBold" color={colors.navyBlue} style={{ marginLeft: spacing.sm }}>Add Vitals</AppText>
          </Pressable>
        )}
        {(showVitals || isReadOnly) && (
          <VitalsInput vitals={vitals} onChange={setVitals} readOnly={isReadOnly} />
        )}

        {/* Attach Files */}
        {!isReadOnly && (
          <>
            <Divider type="section" />
            <Pressable style={styles.attachBtn}>
              <Feather name="paperclip" size={16} color={colors.navyBlue} />
              <AppText variant="body" color={colors.navyBlue} style={{ marginLeft: spacing.sm }}>Attach Files</AppText>
            </Pressable>
          </>
        )}

        {!isReadOnly && (
          <>
            <View style={{ height: spacing.xxl }} />
            <Button label="Save Treatment Note" onPress={handleSave} />
          </>
        )}
        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SOAPField({ label, sublabel, value, onChange, readOnly }) {
  return (
    <View style={styles.soapField}>
      <View style={styles.soapLabel}>
        <AppText variant="bodyBold">{label}</AppText>
        <AppText variant="small" color={colors.mediumGrey}>{sublabel}</AppText>
      </View>
      {readOnly ? (
        <AppText variant="body" style={styles.soapReadOnly}>{value || '--'}</AppText>
      ) : (
        <TextInput
          style={styles.soapInput}
          value={value}
          onChangeText={onChange}
          placeholder={`Enter ${label.toLowerCase()}...`}
          placeholderTextColor={colors.lightGrey}
          multiline
          textAlignVertical="top"
        />
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
  scrollContent: { paddingHorizontal: spacing.base },
  patientBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    marginBottom: spacing.base,
  },
  label: { marginBottom: spacing.sm },
  templateRow: { gap: spacing.sm, paddingBottom: spacing.sm },
  templatePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.navyLight,
  },
  templatePillActive: {
    backgroundColor: colors.navyBlue,
  },
  templateBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.navyLight,
    marginBottom: spacing.base,
  },
  soapField: {
    marginBottom: spacing.base,
  },
  soapLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  soapInput: {
    ...typography.body,
    color: colors.black,
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  soapReadOnly: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  expandBtn: {
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
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
});
