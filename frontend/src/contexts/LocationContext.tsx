import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getDistrictForLocation, getRiskLevel, type NCRBDistrict, type RiskLevel } from "@/data/mockData";

interface LocationState {
  lat: number | null;
  lng: number | null;
  district: NCRBDistrict | null;
  riskLevel: RiskLevel;
  locationName: string;
  stateName: string;
  lastUpdated: Date | null;
  loading: boolean;
  error: string | null;
  travelMode: boolean;
  travelHistory: { time: Date; district: string; risk: RiskLevel }[];
}

interface LocationContextType extends LocationState {
  refreshLocation: () => void;
  startTravelMode: () => void;
  stopTravelMode: () => void;
}

const LocationContext = createContext<LocationContextType | null>(null);

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within LocationProvider");
  return ctx;
};

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<LocationState>({
    lat: null, lng: null, district: null,
    riskLevel: "LOW", locationName: "Detecting...", stateName: "",
    lastUpdated: null, loading: true, error: null,
    travelMode: false, travelHistory: [],
  });

  const fetchLocation = useCallback(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      // Fallback to Delhi
      const fallback = getDistrictForLocation(28.6139, 77.2090);
      setState(prev => ({
        ...prev, lat: 28.6139, lng: 77.2090,
        district: fallback,
        riskLevel: fallback ? getRiskLevel(fallback.riskScore) : "MEDIUM",
        locationName: fallback?.district || "New Delhi",
        stateName: fallback?.state || "Delhi",
        lastUpdated: new Date(), loading: false,
        error: "Geolocation not available, showing default location",
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const district = getDistrictForLocation(latitude, longitude);

        // Try reverse geocoding
        let locationName = district?.district || "Unknown";
        let stateName = district?.state || "Unknown";

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`
          );
          const data = await res.json();
          if (data.address) {
            locationName = data.address.city || data.address.town || data.address.county || locationName;
            stateName = data.address.state || stateName;
          }
        } catch {
          // Use NCRB district data as fallback
        }

        const riskLevel = district ? getRiskLevel(district.riskScore) : "MEDIUM";

        setState(prev => {
          const newHistory = prev.travelMode
            ? [...prev.travelHistory, { time: new Date(), district: locationName, risk: riskLevel }]
            : prev.travelHistory;

          return {
            ...prev, lat: latitude, lng: longitude, district,
            riskLevel, locationName, stateName,
            lastUpdated: new Date(), loading: false, error: null,
            travelHistory: newHistory,
          };
        });
      },
      () => {
        // Fallback
        const fallback = getDistrictForLocation(28.6139, 77.2090);
        setState(prev => ({
          ...prev, lat: 28.6139, lng: 77.2090,
          district: fallback,
          riskLevel: fallback ? getRiskLevel(fallback.riskScore) : "MEDIUM",
          locationName: fallback?.district || "New Delhi",
          stateName: fallback?.state || "Delhi",
          lastUpdated: new Date(), loading: false,
          error: "Location access denied. Showing default.",
        }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  // Travel mode: refresh every 30s
  useEffect(() => {
    if (!state.travelMode) return;
    const interval = setInterval(fetchLocation, 30000);
    return () => clearInterval(interval);
  }, [state.travelMode, fetchLocation]);

  const startTravelMode = () => setState(prev => ({ ...prev, travelMode: true, travelHistory: [] }));
  const stopTravelMode = () => setState(prev => ({ ...prev, travelMode: false }));

  return (
    <LocationContext.Provider value={{ ...state, refreshLocation: fetchLocation, startTravelMode, stopTravelMode }}>
      {children}
    </LocationContext.Provider>
  );
};
