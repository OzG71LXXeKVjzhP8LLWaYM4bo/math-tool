import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/settings-store';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);
  const themePreference = useSettingsStore((s) => s.themePreference);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const systemScheme = useRNColorScheme();

  if (!hasHydrated) {
    return 'light';
  }

  if (themePreference === 'system') {
    return systemScheme ?? 'light';
  }
  return themePreference;
}
