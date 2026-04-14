import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, Shield, Clock, AlertTriangle, X, MapPin } from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";
import { getRiskColor, getRiskLevel } from "@/data/mockData";
import "leaflet/dist/leaflet.css";

const TravelMode = () => {
  const loc = useLocation();
  const [countdown, setCountdown] = useState(30);
  const [alertVisible, setAlertVisible] = useState(false);
  const [prevRisk, setPrevRisk] = useState(loc.riskLevel);

  useEffect(() => {
    if (!loc.travelMode) {
      loc.startTravelMode();
    }
    return () => { /* don't auto-stop */ };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!loc.travelMode) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return 30;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loc.travelMode]);

  // Risk escalation detection
  useEffect(() => {
    const riskOrder = { LOW: 0, MEDIUM: 1, HIGH: 2 };
    if (riskOrder[loc.riskLevel] > riskOrder[prevRisk]) {
      setAlertVisible(true);
      if ("vibrate" in navigator) navigator.vibrate([200, 100, 200, 100, 200]);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("⚠️ SafeHer Alert", {
          body: `Risk level increased to ${loc.riskLevel} in ${loc.locationName}!`,
        });
      }
      setTimeout(() => setAlertVisible(false), 5000);
    }
    setPrevRisk(loc.riskLevel);
  }, [loc.riskLevel]);

  const riskColor = getRiskColor(loc.riskLevel);

  return (
    <div className="h-screen w-full relative pt-16">
      {/* Top banner */}
      <div className="absolute top-16 left-0 right-0 z-[1000] glass-panel px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="font-heading text-sm font-semibold text-foreground">Travel Mode Active</span>
          </div>
          <span className="text-xs text-muted-foreground">|</span>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm text-foreground">{loc.locationName}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Next check: <span className="text-foreground font-semibold">{countdown}s</span></span>
          </div>
          <div className="px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: `${riskColor}20`, color: riskColor }}>
            {loc.riskLevel}
          </div>
          <button
            onClick={() => { loc.stopTravelMode(); window.history.back(); }}
            className="px-3 py-1 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Stop
          </button>
        </div>
      </div>

      {/* Risk escalation alert */}
      <AnimatePresence>
        {alertVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-32 left-1/2 -translate-x-1/2 z-[1100] glass-panel rounded-xl p-4 flex items-center gap-3 border-l-4 border-l-primary"
          >
            <AlertTriangle className="w-6 h-6 text-primary animate-pulse" />
            <div>
              <p className="text-sm font-heading font-bold text-foreground">Risk Level Increased!</p>
              <p className="text-xs text-muted-foreground">You've entered a {loc.riskLevel} risk zone in {loc.locationName}</p>
            </div>
            <button onClick={() => setAlertVisible(false)} className="text-muted-foreground hover:text-foreground ml-2">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <MapContainer
        center={[loc.lat || 28.6139, loc.lng || 77.2090]}
        zoom={14}
        className="h-full w-full z-0"
        zoomControl={false}
        style={{ background: "#0a0a0f" }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        {loc.lat && loc.lng && (
          <CircleMarker
            center={[loc.lat, loc.lng]}
            radius={12}
            pathOptions={{ color: riskColor, fillColor: riskColor, fillOpacity: 0.4, weight: 3 }}
          >
            <Popup>
              <span className="text-xs">You are here — {loc.riskLevel} Risk</span>
            </Popup>
          </CircleMarker>
        )}
      </MapContainer>

      {/* Travel history sidebar */}
      <div className="absolute bottom-6 left-4 z-[1000] glass-panel rounded-xl p-4 w-72 max-h-64 overflow-y-auto">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Risk Timeline</h3>
        {loc.travelHistory.length === 0 ? (
          <p className="text-xs text-muted-foreground">Tracking will appear here...</p>
        ) : (
          <div className="space-y-2">
            {loc.travelHistory.slice().reverse().map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getRiskColor(entry.risk) }} />
                <span className="text-muted-foreground">
                  {entry.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-foreground">{entry.district}</span>
                <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: `${getRiskColor(entry.risk)}20`, color: getRiskColor(entry.risk) }}>
                  {entry.risk}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Risk score card */}
      <div className="absolute bottom-6 right-4 z-[1000] glass-panel rounded-xl p-4 w-48 text-center">
        <div className="font-heading text-3xl font-bold" style={{ color: riskColor }}>
          {loc.district?.riskScore || 50}
        </div>
        <div className="text-xs text-muted-foreground mt-1">Current Risk Score</div>
        <div className="text-xs mt-2" style={{ color: riskColor }}>
          Confidence: {loc.district?.confidence || 85}%
        </div>
      </div>
    </div>
  );
};

export default TravelMode;
