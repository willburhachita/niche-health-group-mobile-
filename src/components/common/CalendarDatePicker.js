import React, { useState, useMemo } from 'react';
import { View, ScrollView, Pressable, Modal, FlatList, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from './AppText';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

export function CalendarDatePicker({ visible, selectedDate, onSelect, onClose, minYear = 1920, maxYear }) {
  const today = new Date();
  const effectiveMaxYear = maxYear || today.getFullYear() + 10;

  // Parse initial year/month from selectedDate or today
  const initial = useMemo(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      return { year: parseInt(parts[0]), month: parseInt(parts[1]) - 1 };
    }
    return { year: today.getFullYear(), month: today.getMonth() };
  }, []);

  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const days = useMemo(() => {
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [year, month]);

  const years = useMemo(() => {
    const arr = [];
    for (let y = effectiveMaxYear; y >= minYear; y--) arr.push(y);
    return arr;
  }, [minYear, effectiveMaxYear]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const handleDaySelect = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onSelect(dateStr);
  };

  // Year picker sub-modal
  if (showYearPicker) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowYearPicker(false)}>
          <Pressable style={styles.pickerSheet} onPress={e => e.stopPropagation()}>
            <View style={styles.pickerHeader}>
              <AppText variant="h3">Select Year</AppText>
              <Pressable onPress={() => setShowYearPicker(false)} hitSlop={8}>
                <Feather name="x" size={20} color={colors.black} />
              </Pressable>
            </View>
            <FlatList
              data={years}
              keyExtractor={item => String(item)}
              initialScrollIndex={Math.max(0, years.indexOf(year))}
              getItemLayout={(_, index) => ({ length: 48, offset: 48 * index, index })}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.pickerItem, item === year && styles.pickerItemActive]}
                  onPress={() => { setYear(item); setShowYearPicker(false); }}
                >
                  <AppText
                    variant={item === year ? 'bodyBold' : 'body'}
                    color={item === year ? colors.white : item === today.getFullYear() ? colors.navyBlue : colors.black}
                  >
                    {item}
                  </AppText>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  // Month picker sub-modal
  if (showMonthPicker) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowMonthPicker(false)}>
          <Pressable style={styles.pickerSheet} onPress={e => e.stopPropagation()}>
            <View style={styles.pickerHeader}>
              <AppText variant="h3">Select Month</AppText>
              <Pressable onPress={() => setShowMonthPicker(false)} hitSlop={8}>
                <Feather name="x" size={20} color={colors.black} />
              </Pressable>
            </View>
            <View style={styles.monthGrid}>
              {MONTH_NAMES.map((m, i) => (
                <Pressable
                  key={m}
                  style={[styles.monthCell, i === month && styles.monthCellActive]}
                  onPress={() => { setMonth(i); setShowMonthPicker(false); }}
                >
                  <AppText
                    variant={i === month ? 'bodyBold' : 'body'}
                    color={i === month ? colors.white : colors.black}
                  >
                    {MONTH_SHORT[i]}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  // Main calendar
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          {/* Navigation: Year + Month tappable */}
          <View style={styles.navRow}>
            <Pressable onPress={prevMonth} hitSlop={10}>
              <Feather name="chevron-left" size={22} color={colors.navyBlue} />
            </Pressable>
            <View style={styles.navCenter}>
              <Pressable style={styles.navBtn} onPress={() => setShowMonthPicker(true)}>
                <AppText variant="bodyBold" color={colors.navyBlue}>{MONTH_NAMES[month]}</AppText>
                <Feather name="chevron-down" size={14} color={colors.navyBlue} style={{ marginLeft: 2 }} />
              </Pressable>
              <Pressable style={styles.navBtn} onPress={() => setShowYearPicker(true)}>
                <AppText variant="bodyBold" color={colors.navyBlue}>{year}</AppText>
                <Feather name="chevron-down" size={14} color={colors.navyBlue} style={{ marginLeft: 2 }} />
              </Pressable>
            </View>
            <Pressable onPress={nextMonth} hitSlop={10}>
              <Feather name="chevron-right" size={22} color={colors.navyBlue} />
            </Pressable>
          </View>

          {/* Day headers */}
          <View style={styles.row}>
            {DAY_LABELS.map(d => (
              <View key={d} style={styles.cell}>
                <AppText variant="small" color={colors.mediumGrey}>{d}</AppText>
              </View>
            ))}
          </View>

          {/* Day grid */}
          <View style={styles.grid}>
            {days.map((day, i) => {
              if (day === null) return <View key={`e${i}`} style={styles.cell} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === todayStr;
              return (
                <Pressable key={i} style={styles.cell} onPress={() => handleDaySelect(day)}>
                  <View style={[styles.dayCircle, isSelected && styles.daySelected, isToday && !isSelected && styles.dayToday]}>
                    <AppText variant="body" color={isSelected ? colors.white : isToday ? colors.navyBlue : colors.black}>{day}</AppText>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable onPress={onClose}>
              <AppText variant="body" color={colors.mediumGrey}>Cancel</AppText>
            </Pressable>
            <Pressable onPress={() => onSelect(todayStr)}>
              <AppText variant="bodyBold" color={colors.navyBlue}>Today</AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  sheet: { width: '100%', backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.base, maxWidth: 360 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  navCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  navBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.md, backgroundColor: colors.navyLight },
  row: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xs },
  dayCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: colors.navyBlue },
  dayToday: { borderWidth: 1.5, borderColor: colors.navyBlue },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.offWhite },

  // Year / Month picker sheets
  pickerSheet: { width: '100%', backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.base, maxWidth: 320 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.offWhite },
  pickerItem: { height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: radius.md },
  pickerItemActive: { backgroundColor: colors.navyBlue, borderRadius: radius.md },

  // Month grid
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  monthCell: { width: '30%', height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: radius.md, backgroundColor: colors.offWhite },
  monthCellActive: { backgroundColor: colors.navyBlue },
});
