export const COLORS = {
  primary: '#2563EB',      // Deep Blue (Premium & Trust)
  secondary: '#10B981',    // Emerald Green (Success, Freshness)
  accent: '#F59E0B',       // Amber (Warnings, Action)
  
  background: '#F8FAFC',   // Light gray/blue tint for modern feel
  surface: '#FFFFFF',      // White cards
  
  text: '#0F172A',         // Dark Slate
  textLight: '#64748B',    // Slate Gray
  
  border: '#E2E8F0',
  error: '#EF4444',
};

export const SIZES = {
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 20,
  extraLarge: 24,
  xxl: 32,
  radius: 16,     // Smooth, rounded corners for premium feel
  padding: 24,
};

export const SHADOWS = {
  light: {
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 4,
  },
};
