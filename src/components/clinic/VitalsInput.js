import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { typography } from '../../constants/typography';
import { AppText } from '../common/AppText';

const VITALS_CONFIG = [
  { key: 'bp', label: 'Blood Pressure', unit: 'mmHg', icon: 'heart', placeholder: '120/80' },
  { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', icon: 'activity', placeholder: '72' },
  { key: 'temperature', label: 'Temperature', unit: 'C', icon: 'thermometer', placeholder: '36.5' },
  { key: 'weight', label: 'Weight', unit: 'kg', icon: 'trending-up', placeholder: '70.0' },
  { key: 'o2Sat', label: 'O2 Saturation', unit: '%', icon: 'wind', placeholder: '98' },
];

export const VitalsInput = ({ vitals = {}, onChange, readOnly = false }) => {
  return (
    <View style={styles.container}>
      <AppText variant="bodyBold" style={styles.title}>Vitals</AppText>
      <View style={styles.grid}>
        {VITALS_CONFIG.map(v => (
          <View key={v.key} style={styles.item}>
            <View style={styles.labelRow}>
              <Feather name={v.icon} size={14} color={colors.navyBlue} />
              <AppText variant="small" color={colors.darkGrey} style={styles.label}>{v.label}</AppText>
            </View>
            {readOnly ? (
              <AppText variant="body" style={styles.value}>
                {vitals[v.key] != null ? `${vitals[v.key]} ${v.unit}` : '--'}
              </AppText>
            ) : (
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={vitals[v.key] != null ? String(vitals[v.key]) : ''}
                  onChangeText={text => onChange && onChange({ ...vitals, [v.key]: text })}
                  placeholder={v.placeholder}
                  placeholderTextColor={colors.lightGrey}
                  keyboardType={v.key === 'bp' ? 'default' : 'numeric'}
                />
                <AppText variant="small" color={colors.mediumGrey}>{v.unit}</AppText>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.base,
  },
  title: {
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  item: {
    width: '48%',
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    marginLeft: spacing.xs,
  },
  value: {
    marginTop: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.black,
    padding: 0,
    marginRight: spacing.xs,
  },
});
