import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useReportStore, ReportPeriod } from '../../stores/reportStore';

const PERIODS: ReportPeriod[] = ['today', 'yesterday', 'week', 'month', 'custom'];

export const PeriodSelector = () => {
  const { t } = useTranslation();
  const { period, setPeriod, customStartDate, customEndDate, setCustomDates } = useReportStore();

  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const getLabel = (p: ReportPeriod) => {
    switch (p) {
      case 'today': return t('reports.today');
      case 'yesterday': return t('reports.yesterday');
      case 'week': return t('reports.thisWeek');
      case 'month': return t('reports.thisMonth');
      case 'custom': return t('reports.custom');
    }
  };

  const handleStartChange = (_: any, date?: Date) => {
    setShowStart(Platform.OS === 'ios');
    if (date) {
      setCustomDates(date.toISOString().split('T')[0], customEndDate);
    }
  };

  const handleEndChange = (_: any, date?: Date) => {
    setShowEnd(Platform.OS === 'ios');
    if (date) {
      setCustomDates(customStartDate, date.toISOString().split('T')[0]);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {PERIODS.map((p) => {
          const isActive = period === p;
          return (
            <TouchableOpacity
              key={p}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{getLabel(p)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {period === 'custom' && (
        <View style={styles.customDateRow}>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStart(true)}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.dateText}>{customStartDate || t('reports.startDate')}</Text>
          </TouchableOpacity>
          <Text style={styles.separator}>—</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEnd(true)}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.dateText}>{customEndDate || t('reports.endDate')}</Text>
          </TouchableOpacity>

          {showStart && (
            <DateTimePicker
              value={customStartDate ? new Date(customStartDate) : new Date()}
              mode="date"
              display="default"
              onChange={handleStartChange}
            />
          )}
          {showEnd && (
            <DateTimePicker
              value={customEndDate ? new Date(customEndDate) : new Date()}
              mode="date"
              display="default"
              onChange={handleEndChange}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#1a5fa8',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  customDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 8,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  separator: {
    marginHorizontal: 12,
    color: '#888',
  },
});
