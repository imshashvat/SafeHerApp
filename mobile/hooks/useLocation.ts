import * as Location from 'expo-location';
import { useSOSStore } from '../store/sosStore';
import { useCallback } from 'react';

export function useLocation() {
  const { setLocation } = useSOSStore();

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

  const getMapLink = (lat: number, lng: number) =>
    `https://maps.google.com/?q=${lat},${lng}`;

  const getOSMLink = (lat: number, lng: number) =>
    `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`;

  return { getCurrentLocation, requestPermission, getMapLink, getOSMLink };
}
