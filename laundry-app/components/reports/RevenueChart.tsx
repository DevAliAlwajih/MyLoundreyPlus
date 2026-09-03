import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useThemeStore } from '../../stores/themeStore';

interface RevenueChartProps {
  dailyBreakdown: {
    date: string;
    totalRevenue: number;
    invoiceCount: number;
  }[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ dailyBreakdown }) => {
  const { colors, themeMode } = useThemeStore();

  if (!dailyBreakdown || dailyBreakdown.length === 0) {
    return null;
  }

  // Formatting dates for X-axis (e.g., "Jan 15" or "15/01")
  const labels = dailyBreakdown.map(d => {
    const parts = d.date.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`; // DD/MM format
    }
    return d.date;
  });

  const dataValues = dailyBreakdown.map(d => d.totalRevenue);

  const data = {
    labels: labels.slice(-7), // Show max 7 labels to avoid crowding
    datasets: [
      {
        data: dataValues.slice(-7),
      }
    ]
  };

  return (
    <View style={styles.container}>
      <BarChart
        data={data}
        width={Dimensions.get('window').width - 40} // Full width minus padding
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: colors.surface,
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => colors.primary,
          labelColor: (opacity = 1) => colors.textSecondary,
          style: {
            borderRadius: 16,
          },
          propsForBackgroundLines: {
            strokeDasharray: '', // solid background lines
            stroke: colors.border,
          }
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
        showValuesOnTopOfBars={true}
        fromZero={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 10,
    borderRadius: 12,
  },
});
