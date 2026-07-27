import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { WorkingHour } from '../../stores/laundryStore';
import { useThemeStore } from '../../stores/themeStore';

interface WorkingHourRowProps {
  item: WorkingHour;
  onChange: (item: WorkingHour) => void;
}

export const WorkingHourRow: React.FC<WorkingHourRowProps> = ({ item, onChange }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useThemeStore();
  const [showOpenPicker, setShowOpenPicker] = useState(false);
  const [showClosePicker, setShowClosePicker] = useState(false);

  // Helper to convert "HH:mm" to Date object
  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Helper to format Date to "HH:mm"
  const formatTime = (date: Date) => {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  // Format time for display (e.g. 10:00 م)
  const formatDisplayTime = (timeStr: string) => {
    const date = parseTime(timeStr);
    return new Intl.DateTimeFormat(i18n.language, {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  };

  const handleOpenChange = (event: any, selectedDate?: Date) => {
    setShowOpenPicker(Platform.OS === 'ios'); // keep open on iOS, close on android
    if (selectedDate) {
      onChange({ ...item, openTime: formatTime(selectedDate) });
    }
  };

  const handleCloseChange = (event: any, selectedDate?: Date) => {
    setShowClosePicker(Platform.OS === 'ios');
    if (selectedDate) {
      onChange({ ...item, closeTime: formatTime(selectedDate) });
    }
  };

  const toggleSwitch = (val: boolean) => {
    onChange({ ...item, isOpen: val });
  };

  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayText}>{t(`profile.days.${item.day}`)}</Text>
        <Switch
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={item.isOpen ? colors.surface : colors.textMuted}
          onValueChange={toggleSwitch}
          value={item.isOpen}
        />
      </View>

      {item.isOpen ? (
        <View style={styles.timesContainer}>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>{t('profile.openTime')}</Text>
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={parseTime(item.openTime)}
                mode="time"
                display="default"
                onChange={handleOpenChange}
              />
            ) : (
              <View>
                <Text style={styles.timeValue} onPress={() => setShowOpenPicker(true)}>
                  {formatDisplayTime(item.openTime)}
                </Text>
                {showOpenPicker && (
                  <DateTimePicker
                    value={parseTime(item.openTime)}
                    mode="time"
                    display="default"
                    onChange={(e, d) => {
                      setShowOpenPicker(false);
                      if (d) handleOpenChange(e, d);
                    }}
                  />
                )}
              </View>
            )}
          </View>
          
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>{t('profile.closeTime')}</Text>
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={parseTime(item.closeTime)}
                mode="time"
                display="default"
                onChange={handleCloseChange}
              />
            ) : (
              <View>
                <Text style={styles.timeValue} onPress={() => setShowClosePicker(true)}>
                  {formatDisplayTime(item.closeTime)}
                </Text>
                {showClosePicker && (
                  <DateTimePicker
                    value={parseTime(item.closeTime)}
                    mode="time"
                    display="default"
                    onChange={(e, d) => {
                      setShowClosePicker(false);
                      if (d) handleCloseChange(e, d);
                    }}
                  />
                )}
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.closedContainer}>
          <Text style={styles.closedText}>{t('profile.closed')}</Text>
        </View>
      )}
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: 16,
    marginVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  timesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  timeBlock: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  timeValue: {
    fontSize: 16,
    color: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.surface2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  closedContainer: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: colors.surface2,
    borderRadius: 6,
  },
  closedText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

