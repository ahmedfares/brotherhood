export const THEME_STORAGE_KEY = 'BudgetBuddyTheme';
const LEGACY_THEME_STORAGE_KEY = 'BrotherhoodTheme';

export const getStoredTheme = () => {
  return localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(LEGACY_THEME_STORAGE_KEY) || 'dark';
};

export const applyTheme = (theme) => {
  const nextTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', nextTheme);
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  return nextTheme;
};
