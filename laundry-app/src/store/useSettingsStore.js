import { create } from 'zustand';

const useSettingsStore = create((set) => ({
  language: 'AR',  // 'AR' | 'EN'
  isDark: false,

  toggleLanguage: () => set((s) => ({ language: s.language === 'AR' ? 'EN' : 'AR' })),
  toggleTheme: () => set((s) => ({ isDark: !s.isDark })),
  setLanguage: (lang) => set({ language: lang }),
}));

export default useSettingsStore;
