import { useState, useEffect, useCallback, useRef } from 'react';
import { checkSafety } from '../utils/api';
import { reverseGeocode } from '../utils/nominatim';

export function useSafetyCheck(position, interval = 30000) {
  const [safetyData, setSafetyData] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const intervalRef = useRef(null);

  const performCheck = useCallback(async (pos) => {
    if (!pos) return;

    setLoading(true);
    setError(null);

    try {
      // Step 1: Reverse geocode GPS to district
      const geo = await reverseGeocode(pos.lat, pos.lng);
      if (!geo) {
        setError('Could not determine your location');
        setLoading(false);
        return;
      }

      setLocationInfo(geo);

      // Step 2: Check safety from backend
      const hour = new Date().getHours();
      const result = await checkSafety(geo.state, geo.district, hour);
      setSafetyData(result);
      setLastChecked(new Date());

      // Step 3: Vibration alert for HIGH RISK
      if (result.risk_level === 'HIGH RISK' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }
    } catch (err) {
      setError(err.message || 'Safety check failed');
      console.error('Safety check error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-check when position changes
  useEffect(() => {
    if (position) {
      performCheck(position);
    }
  }, [position?.lat, position?.lng]);

  // Set up interval for periodic checks
  const startPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (position) performCheck(position);
    }, interval);
  }, [position, interval, performCheck]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    safetyData,
    locationInfo,
    loading,
    error,
    lastChecked,
    performCheck,
    startPolling,
    stopPolling
  };
}

export default useSafetyCheck;
