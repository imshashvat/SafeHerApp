import { useState, useRef, useCallback } from 'react';
import { useSettingsStore } from '../store/settingsStore';

export function useFakeCall() {
  const [isActive, setIsActive] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { profileName } = useSettingsStore();

  const callerNames = [
    'Mom', 'Sister', 'Priya Sharma', 'Ananya', 'Neha Gupta',
    profileName || 'Unknown Contact',
  ];

  const [callerName] = useState(
    callerNames[Math.floor(Math.random() * callerNames.length)]
  );

  const triggerFakeCall = useCallback((delayMs = 3000) => {
    timeoutRef.current = setTimeout(() => {
      setIsActive(true);
    }, delayMs);
  }, []);

  const dismissFakeCall = useCallback(() => {
    setIsActive(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return { isActive, triggerFakeCall, dismissFakeCall, callerName };
}
