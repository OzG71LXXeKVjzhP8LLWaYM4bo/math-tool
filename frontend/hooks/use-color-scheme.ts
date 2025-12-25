import { useColorScheme as useRNColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/settings-store';

export function useColorScheme(): 'light' | 'dark' {
  const systemScheme = useRNColorScheme();
  const themePreference = useSettingsStore((s) => s.themePreference);

  if (themePreference === 'system') {
    return systemScheme ?? 'light';
  }
  return themePreference;
}
