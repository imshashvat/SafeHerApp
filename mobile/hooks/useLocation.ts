import * as Location from 'expo-location';
import { useSOSStore } from '../store/sosStore';
import { useCallback, useRef } from 'react';

export function useLocation() {
  const { setLocation } = useSOSStore();
  const watchSubRef = useRef<Location.LocationSubscription | null>(null);

  const requestPermission = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  }, []);

  const getCurrentLocation = useCallback(async () => {
    try {
      const granted = await requestPermission();
      if (!granted) return null;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy ?? undefined,
      };

      setLocation(coords);
      return coords;
    } catch {
      return null;
    }
  }, [setLocation, requestPermission]);

  /**
   * Start a background location watch so sosStore.location is always fresh.
   * Call once on login; stops automatically on unmount via returned cleanup fn.
   */
  const startBackgroundWatch = useCallback(async () => {
    if (watchSubRef.current) return; // Already watching

    const granted = await requestPermission();
    if (!granted) return;

    try {
      // Get initial location immediately
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy ?? undefined,
      });

      // Then watch for updates every 30s or 50m movement
      watchSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000,
          distanceInterval: 50,
        },
        (newLoc) => {
          setLocation({
            latitude: newLoc.coords.latitude,
            longitude: newLoc.coords.longitude,
            accuracy: newLoc.coords.accuracy ?? undefined,
          });
        }
      );
    } catch {
      // Silently fail — location still available on-demand
    }
  }, [setLocation, requestPermission]);

  const stopBackgroundWatch = useCallback(() => {
    if (watchSubRef.current) {
      watchSubRef.current.remove();
      watchSubRef.current = null;
    }
  }, []);

  const getMapLink = (lat: number, lng: number) =>
    `https://maps.google.com/?q=${lat},${lng}`;

  const getOSMLink = (lat: number, lng: number) =>
    `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`;

  return {
    getCurrentLocation,
    requestPermission,
    startBackgroundWatch,
    stopBackgroundWatch,
    getMapLink,
    getOSMLink,
  };
}
