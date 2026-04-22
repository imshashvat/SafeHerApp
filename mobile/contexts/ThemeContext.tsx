/**
 * ThemeContext — App-wide light/dark mode.
 *
 * Provides dynamically resolved colors to all screens.
 * The theme preference is persisted in the settings store (SQLite).
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import {
  darkColors,
  lightColors,
  spacing,
  radius,
  fontSize,
  type ThemeColors,
} from '../constants/theme';

type AppTheme = 'light' | 'dark';

interface ThemeContextValue {
  appTheme: AppTheme;
  colors: ThemeColors;
  toggleAppTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  appTheme: 'dark',
  colors: darkColors,
  toggleAppTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const appTheme = useSettingsStore((s) => s.appTheme);
  const update = useSettingsStore((s) => s.update);

  const colors = useMemo(
    () => (appTheme === 'light' ? lightColors : darkColors),
    [appTheme]
  );

  const toggleAppTheme = () => {
    update({ appTheme: appTheme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <ThemeContext.Provider value={{ appTheme, colors, toggleAppTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
