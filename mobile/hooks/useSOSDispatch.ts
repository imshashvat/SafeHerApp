import { useEffect, useRef, useCallback } from 'react';
import { useSOSStore } from '../store/sosStore';
import { dispatchSOS } from '../services/alertService';
import { useLocation } from './useLocation';

export function useSOSDispatch() {
  const { status, tickCountdown, reset } = useSOSStore();
  const { getCurrentLocation } = useLocation();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasDispatched = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // When countdown starts, grab location immediately
  useEffect(() => {
    if (status === 'countdown') {
      hasDispatched.current = false;
      getCurrentLocation();

      timerRef.current = setInterval(() => {
        tickCountdown();
      }, 1000);
    }

    if (status === 'cancelled' || status === 'idle') {
      clearTimer();
    }

    return clearTimer;
  }, [status]);

  // When status becomes 'active', dispatch
  useEffect(() => {
    if (status === 'active' && !hasDispatched.current) {
      hasDispatched.current = true;
      dispatchSOS();
    }
  }, [status]);

  const cancelSOS = useCallback(() => {
    clearTimer();
    useSOSStore.getState().cancelSOS();
    setTimeout(() => reset(), 2000);
  }, [clearTimer, reset]);

  return { cancelSOS };
}
