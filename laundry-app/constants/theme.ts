export interface ThemeColors {
  primary: string;
  background: string;
  surface: string;
  surface2: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  error: string;
  success: string;
  warning: string;
}

export const lightColors: ThemeColors = {
  primary: '#1a5fa8',
  background: '#f8f9fa',
  surface: '#ffffff',
  surface2: '#f0f2f5',
  text: '#333333',
  textSecondary: '#666666',
  textMuted: '#999999',
  border: '#eeeeee',
  error: '#e74c3c',
  success: '#2ecc71',
  warning: '#f39c12',
};

export const darkColors: ThemeColors = {
  primary: '#4a90e2', // Lighter primary for better contrast on dark background
  background: '#121212',
  surface: '#1e1e1e',
  surface2: '#2c2c2c',
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  textMuted: '#666666',
  border: '#333333',
  error: '#ff6b6b', // Softer red for dark mode
  success: '#2ecc71',
  warning: '#f1c40f',
};
