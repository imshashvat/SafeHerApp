import { useEffect, useRef, useCallback } from 'react';
import { useSOSStore } from '../store/sosStore';
import { dispatchSOS } from '../services/alertService';
import { useLocation } from './useLocation';
import { useAlertHistoryStore } from '../store/alertHistoryStore';

export function useSOSDispatch() {
  const { status, trigger, location, tickCountdown, reset, cancelSOS } = useSOSStore();
  const { getCurrentLocation } = useLocation();
  const { addAlert } = useAlertHistoryStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasDispatched = useRef(false);
  const hasCancelledLogged = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  // When countdown starts, grab location & begin ticking
  useEffect(() => {
    if (status === 'countdown') {
      hasDispatched.current = false;
      hasCancelledLogged.current = false;
      clearResetTimer();
      getCurrentLocation();

      timerRef.current = setInterval(() => {
        tickCountdown();
      }, 1000);
    }

    if (status === 'cancelled') {
      clearTimer();

      // Log cancelled alert to history (only once)
      if (!hasCancelledLogged.current) {
        hasCancelledLogged.current = true;
        const loc = useSOSStore.getState().location;
        const trig = useSOSStore.getState().trigger;
        const TRIGGER_MAP: Record<string, any> = {
          button: 'SOS Button', shake: 'Shake Detected',
          fall: 'Fall Detected', voice: 'Voice Keyword',
        };
        addAlert({
          trigger: TRIGGER_MAP[trig ?? 'button'] ?? 'SOS Button',
          timestamp: Date.now(),
          latitude: loc?.latitude ?? null,
          longitude: loc?.longitude ?? null,
          location: loc ? `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}` : 'Unknown',
          status: 'cancelled',
          sentTo: 0,
          guardianNames: [],
        });
      }

      // Auto-reset after 2s so detection re-enables immediately
      resetTimerRef.current = setTimeout(() => {
        reset();
      }, 2000);
    }

    if (status === 'idle') {
      clearTimer();
    }

    return clearTimer;
  }, [status]);

  // When countdown completes → dispatch SOS
  useEffect(() => {
    if (status === 'active' && !hasDispatched.current) {
      hasDispatched.current = true;
      dispatchSOS().then((result) => {
        // Store result for CountdownTimer to display
        useSOSStore.getState().setDispatchResult({
          emailedTo: result.emailedTo ?? [],
          smsTo: result.smsTo ?? [],
          callMade: result.callMade ?? false,
          errors: result.errors ?? [],
          noGuardians: result.noGuardians ?? false,
        });
        // Reset 8 seconds after alert is sent so user can send AGAIN
        clearResetTimer();
        resetTimerRef.current = setTimeout(() => {
          reset();
        }, 8000);
      }).catch(() => {
        // Even on error, reset so user can try again
        clearResetTimer();
        resetTimerRef.current = setTimeout(() => {
          reset();
        }, 5000);
      });
    }
  }, [status]);

  const handleCancelSOS = useCallback(() => {
    clearTimer();
    cancelSOS();
    // reset happens inside the status === 'cancelled' effect above
  }, [clearTimer, cancelSOS]);

  return { cancelSOS: handleCancelSOS };
}
