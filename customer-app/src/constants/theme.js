import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  primary: '#0066FF',      // Modern Vibrant Blue
  secondary: '#F8FAFC',    // Light background for cards
  background: '#F1F5F9',   // Very light blue/gray background
  surface: '#FFFFFF',      // Pure White
  
  text: '#1E293B',         // Dark Slate for headings
  textLight: '#64748B',    // Slate Gray for secondary text
  
  border: '#E2E8F0',       // Light border
  error: '#EF4444',        // Red for errors
  success: '#10B981',      // Emerald Green
  
  googleBtn: '#FFFFFF',
  googleText: '#334155',
};

export const SIZES = {
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 20,
  extraLarge: 28,
  xxl: 36,
  radius: 16,     // Rounded corners for cards and buttons
  inputRadius: 12,
  padding: 24,
  width,
  height,
};

export const SHADOWS = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  medium: {
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
  card: {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  }
};
