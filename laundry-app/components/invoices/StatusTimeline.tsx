import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StatusHistory } from '../../hooks/useInvoices';

interface StatusTimelineProps {
  history: StatusHistory[];
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ history }) => {
  const { t, i18n } = useTranslation();

  if (!history || history.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('invoice.statusHistory')}</Text>
      
      {history.map((entry, index) => {
        const isLast = index === history.length - 1;
        const formattedDate = new Date(entry.changedAt).toLocaleString(i18n.language, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        return (
          <View key={index} style={styles.row}>
            <View style={styles.timelineColumn}>
              <View style={[styles.dot, isLast ? styles.dotActive : null]} />
              {!isLast && <View style={styles.line} />}
            </View>
            <View style={styles.contentColumn}>
              <Text style={styles.statusText}>{t(`invoice.status.${entry.status}`)}</Text>
              <Text style={styles.dateText}>{formattedDate}</Text>
              {entry.notes ? (
                <Text style={styles.notesText}>{entry.notes}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginTop: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'left',
  },
  row: {
    flexDirection: 'row',
  },
  timelineColumn: {
    alignItems: 'center',
    width: 30,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ccc',
    zIndex: 1,
  },
  dotActive: {
    backgroundColor: '#1a5fa8',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#eee',
    marginVertical: -2, // to connect dots seamlessly
  },
  contentColumn: {
    flex: 1,
    paddingBottom: 24,
    paddingLeft: 8,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    textAlign: 'left',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    textAlign: 'left',
  },
  notesText: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
    fontStyle: 'italic',
    textAlign: 'left',
  },
});
