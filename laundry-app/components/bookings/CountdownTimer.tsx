import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

interface CountdownTimerProps {
  createdAt: string;
  onExpire?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ createdAt, onExpire }) => {
  const { t } = useTranslation();
  const deadline = new Date(createdAt).getTime() + 2 * 60 * 60 * 1000; // +2 hours

  const [remaining, setRemaining] = useState(() => {
    const diff = deadline - Date.now();
    return diff > 0 ? diff : 0;
  });

  useEffect(() => {
    if (remaining === 0) {
      onExpire?.();
      return;
    }

    const interval = setInterval(() => {
      const diff = deadline - Date.now();
      if (diff <= 0) {
        setRemaining(0);
        clearInterval(interval);
        onExpire?.();
      } else {
        setRemaining(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline, remaining]);

  if (remaining === 0) {
    return (
      <View style={styles.expiredContainer}>
        <Text style={styles.expiredText}>⏱ {t('bookings.expired')}</Text>
      </View>
    );
  }

  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  const pad = (n: number) => String(n).padStart(2, '0');
  const isUrgent = remaining < 30 * 60 * 1000; // last 30 minutes

  return (
    <View style={[styles.container, isUrgent && styles.containerUrgent]}>
      <Text style={[styles.label, isUrgent && styles.labelUrgent]}>
        ⏱ {t('bookings.countdown')}:
      </Text>
      <Text style={[styles.timer, isUrgent && styles.timerUrgent]}>
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </Text>
    </View>
  );
};

export const useIsExpired = (createdAt: string): boolean => {
  const deadline = new Date(createdAt).getTime() + 2 * 60 * 60 * 1000;
  return Date.now() > deadline;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  containerUrgent: {
    backgroundColor: '#fdecea',
  },
  label: {
    fontSize: 13,
    color: '#f57c00',
    marginRight: 6,
  },
  labelUrgent: {
    color: '#e74c3c',
  },
  timer: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f57c00',
    fontVariant: ['tabular-nums'],
  },
  timerUrgent: {
    color: '#e74c3c',
  },
  expiredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdecea',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  expiredText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
});
