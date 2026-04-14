import React, { useState } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Flag, Clock, Loader2, Route, ChevronDown, ChevronUp, BarChart2 } from "lucide-react";
import { getRiskColor, getRiskLevel } from "@/data/mockData";
import { api } from "@/services/api";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet markers
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const policeIcon = L.divIcon({
  html: `<div style="width:24px;height:24px;border-radius:6px;background:#1e3a8a;border:2px solid #60a5fa;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,0.5)">👮</div>`,
  iconSize: [24, 24], iconAnchor: [12, 12], className: ""
});

import { useEffect } from "react";
function MapUpdater({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => { if (coords?.length > 1) map.fitBounds(coords as L.LatLngBoundsExpression, { padding: [50, 50] }); }, [coords, map]);
  return null;
}

const CRIME_LABELS: Record<string, string> = {
  rape: "Rape",
  kidnapping: "Kidnapping & Abduction",
  dowry: "Dowry Deaths",
  assault: "Assault on Women",
  insult: "Insult to Modesty",
  cruelty: "Cruelty by Husband",
};

const SegmentCard = ({ seg }: { seg: any }) => {
  const [expanded, setExpanded] = useState(false);
  const color = getRiskColor(seg.risk);
  const hasBreakdown = seg.breakdown && Object.keys(seg.breakdown).length > 0;

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: `${color}40` }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer"
        style={{ background: `${color}10` }}
        onClick={() => hasBreakdown && setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">{seg.name}</span>
            {seg.note && <span className="text-[9px] text-muted-foreground italic">(estimated)</span>}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {seg.state} · {seg.distance}
            {seg.crime_rate > 0 && ` · ${seg.crime_rate.toLocaleString()} total crimes`}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: `${color}20`, color }}>
            {seg.risk}
          </span>
          {hasBreakdown && (
            expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded NCRB breakdown */}
      <AnimatePresence>
        {expanded && hasBreakdown && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 border-t bg-card" style={{ borderColor: `${color}20` }}>
              <div className="flex items-center gap-1.5 mb-2">
                <BarChart2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  NCRB Crime Breakdown · {seg.data_source || "NCRB (2001-2015)"}
                </span>
              </div>
              <div className="space-y-2">
                {Object.entries(seg.breakdown).map(([type, count]: [string, any]) => {
                  const label = CRIME_LABELS[type] || type;
                  const total = Object.values(seg.breakdown).reduce((a: any, b: any) => a + b, 0) as number;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="text-foreground font-medium">{Number(count).toLocaleString()} <span className="text-muted-foreground">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {seg.confidence > 0 && (
                <div className="mt-2 text-[10px] text-muted-foreground">
                  ML Confidence: <span className="text-foreground font-medium">{(seg.confidence * 100).toFixed(0)}%</span>
                  {seg.last_year && ` · Data up to ${seg.last_year}`}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RouteAnalyzer = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [time, setTime] = useState(() => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState("");

  const [routeData, setRouteData] = useState<any>(null);
  const [policeStations, setPoliceStations] = useState<any[]>([]);

  const handleAnalyze = async () => {
    if (!from || !to) return;
    setAnalyzing(true);
    setResult(false);
    setError("");
    setPoliceStations([]);

    try {
      setStage("📍 Locating addresses…");
      const data = await api.getRouteAnalysis(from, to, time);
      setRouteData(data);

      setStage("👮 Finding police stations…");
      if (data.routeCoords?.length > 2) {
        const mid = data.routeCoords[Math.floor(data.routeCoords.length / 2)];
        const ps = await api.getPoliceStations(mid[0], mid[1], Math.min(data.distance / 2, 8000));
        setPoliceStations(ps);
      }

      setResult(true);
    } catch (err: any) {
      setError(err.message || "Error analyzing route. Check your inputs.");
    } finally {
      setAnalyzing(false);
      setStage("");
    }
  };

  // GPS auto-fill
  const handleGPSFill = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=16`,
            { headers: { "Accept-Language": "en", "User-Agent": "SafeHer/1.0" } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const name = addr.suburb || addr.neighbourhood || addr.city_district || addr.city || addr.town || data.display_name?.split(",")[0] || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setFrom(name);
        } catch {
          setFrom(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
      },
      () => alert("Location access denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const overallScore = routeData?.overallScore || 0;
  const riskLabel = routeData ? getRiskLevel(overallScore) : "LOW";
  const riskColor = getRiskColor(riskLabel);
  const gaugeAngle = (overallScore / 100) * 180 - 90;
  const activeSegments = routeData?.segments || [];
  const activeCoords: [number, number][] = routeData?.routeCoords || [];

  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };
  const formatDistance = (m: number) => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        {/* Left panel */}
        <div className="lg:w-[42%] p-6 border-r border-border overflow-y-auto">
          <div className="flex items-center gap-2 mb-6">
            <Route className="w-5 h-5 text-primary" />
            <h1 className="font-heading text-2xl font-bold text-foreground">Route Safety Analysis</h1>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">From</label>
              <div className="flex items-center gap-2 bg-muted border border-border rounded-md px-3 py-2">
                <MapPin className="w-4 h-4 text-primary" />
                <input
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="e.g. Noida Sector 18, UP"
                  className="bg-transparent text-sm text-foreground outline-none flex-1"
                />
                <button onClick={handleGPSFill} className="text-xs text-secondary hover:text-secondary/80 transition-colors font-semibold">GPS</button>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">To</label>
              <div className="flex items-center gap-2 bg-muted border border-border rounded-md px-3 py-2">
                <Flag className="w-4 h-4 text-secondary" />
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="e.g. Lucknow, UP"
                  className="bg-transparent text-sm text-foreground outline-none flex-1"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Departure Time</label>
              <div className="flex items-center gap-2 bg-muted border border-border rounded-md px-3 py-2">
                <Clock className="w-4 h-4 text-accent" />
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="bg-transparent text-sm text-foreground outline-none flex-1" />
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm text-destructive">
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={analyzing || !from || !to}
            className="w-full py-3 rounded-md bg-primary text-primary-foreground font-heading font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {analyzing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs">{stage || "Analyzing…"}</span>
              </span>
            ) : "Analyze Route Safety"}
          </button>

          {result && routeData && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-6">
              {/* Route distance/duration */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card border border-border rounded-lg p-3 text-center">
                  <div className="font-heading text-lg font-bold text-secondary">{formatDistance(routeData.distance)}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Distance</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-3 text-center">
                  <div className="font-heading text-lg font-bold text-secondary">{formatDuration(routeData.duration)}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Duration</div>
                </div>
              </div>

              {/* Gauge */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 200 120" className="w-48">
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(240,20%,15%)" strokeWidth="12" strokeLinecap="round" />
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={riskColor} strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={`${(overallScore / 100) * 251.2} 251.2`} />
                  <line x1="100" y1="100" x2={100 + 60 * Math.cos((gaugeAngle * Math.PI) / 180)} y2={100 - 60 * Math.sin((gaugeAngle * Math.PI) / 180)}
                    stroke={riskColor} strokeWidth="3" strokeLinecap="round" />
                  <circle cx="100" cy="100" r="4" fill={riskColor} />
                </svg>
                <div className="text-center mt-2">
                  <div className="font-heading text-3xl font-bold" style={{ color: riskColor }}>{overallScore}</div>
                  <div className="text-sm text-muted-foreground">{riskLabel} RISK</div>
                </div>
              </div>

              {/* District crime records */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-sm font-semibold text-foreground">Districts on Route</h3>
                  <span className="text-[10px] text-muted-foreground">Tap a district to see NCRB records ↓</span>
                </div>
                {activeSegments.map((seg: any) => (
                  <SegmentCard key={seg.id} seg={seg} />
                ))}
              </div>

              {/* Police Stations */}
              {policeStations.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                    👮 Nearby Police Stations
                    <span className="text-xs bg-secondary/20 text-secondary px-1.5 py-0.5 rounded-full">{policeStations.length}</span>
                  </h3>
                  {policeStations.map((ps: any) => (
                    <div key={ps.id} className="flex items-center justify-between bg-card border border-border rounded-md px-4 py-2">
                      <div>
                        <div className="text-sm text-foreground">{ps.name}</div>
                        {ps.phone && <div className="text-xs text-muted-foreground">📞 {ps.phone}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Safety tips */}
              <div className="p-4 rounded-lg border border-secondary/20 bg-secondary/5">
                <h4 className="text-xs font-heading font-semibold text-secondary uppercase mb-2">🛡️ Safety Tips</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Share live location with trusted contacts</li>
                  <li>• Keep 112 (Police) / 1091 (Women Helpline) ready</li>
                  <li>• Avoid isolated stretches after dark</li>
                  <li>• Use SafeHer SOS button if you feel unsafe</li>
                </ul>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right map */}
        <div className="lg:w-[58%] h-full">
          <MapContainer center={[22.5, 78.5]} zoom={5} className="h-full w-full" zoomControl={false} style={{ background: "#0a0a0f" }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            {result && activeCoords.length > 1 && <MapUpdater coords={activeCoords} />}
            {result && routeData && (() => {
              // Build a lookup: for every coord index, which segment/district does it belong to?
              // Each segment stores its waypoint index - assign each coord to nearest segment
              const totalCoords = activeCoords.length;
              
              // Map coord index → segment color
              const getColorForIndex = (idx: number): string => {
                if (!activeSegments.length) return "#888";
                // Find which segment's waypoint this index is closest to
                // Segments store their original waypointIdx from the 5-point sampling
                // We divide the route into N equal bands, one per unique segment
                const band = totalCoords / activeSegments.length;
                const segIdx = Math.min(Math.floor(idx / band), activeSegments.length - 1);
                return getRiskColor(activeSegments[segIdx].risk);
              };

              // Sample heatmap dots: one every ~15 coords (adjust density)
              const DOT_STEP = Math.max(1, Math.floor(totalCoords / 60));
              const heatDots: Array<{ pos: [number, number]; color: string; seg: any }> = [];
              for (let i = 0; i < totalCoords; i += DOT_STEP) {
                const band = totalCoords / activeSegments.length;
                const segIdx = Math.min(Math.floor(i / band), activeSegments.length - 1);
                const seg = activeSegments[segIdx];
                heatDots.push({ pos: activeCoords[i], color: getRiskColor(seg?.risk || "MEDIUM"), seg });
              }

              return (
                <>
                  {/* 1. Full connected route polyline — thin neutral base */}
                  <Polyline
                    positions={activeCoords}
                    pathOptions={{ color: "#334155", weight: 4, opacity: 0.6 }}
                  />

                  {/* 2. Heatmap dots along the route */}
                  {heatDots.map((dot, i) => (
                    <CircleMarker
                      key={i}
                      center={dot.pos}
                      radius={5}
                      pathOptions={{
                        color: dot.color,
                        fillColor: dot.color,
                        fillOpacity: 0.85,
                        weight: 0,
                      }}
                    >
                      {dot.seg && (
                        <Popup>
                          <div className="text-xs space-y-0.5">
                            <strong>{dot.seg.name}</strong> · {dot.seg.state}<br />
                            <span style={{ color: dot.color }}>● {dot.seg.risk} RISK</span><br />
                            {dot.seg.crime_rate > 0 && <span>Total crimes: {dot.seg.crime_rate.toLocaleString()}</span>}
                          </div>
                        </Popup>
                      )}
                    </CircleMarker>
                  ))}

                  {/* 3. Start/End markers */}
                  {routeData.startCoord && (
                    <CircleMarker center={routeData.startCoord} radius={11} pathOptions={{ color: "#00f5d4", fillColor: "#00f5d4", fillOpacity: 1, weight: 2 }}>
                      <Popup><b>📍 Start:</b> {from}</Popup>
                    </CircleMarker>
                  )}
                  {routeData.endCoord && (
                    <CircleMarker center={routeData.endCoord} radius={11} pathOptions={{ color: "#e63946", fillColor: "#e63946", fillOpacity: 1, weight: 2 }}>
                      <Popup><b>🏁 End:</b> {to}</Popup>
                    </CircleMarker>
                  )}

                  {/* 4. Police stations */}
                  {policeStations.map((ps: any) => (
                    <Marker key={ps.id} position={[ps.lat, ps.lon]} icon={policeIcon}>
                      <Popup><b>👮 {ps.name}</b>{ps.phone && <><br />📞 {ps.phone}</>}</Popup>
                    </Marker>
                  ))}

                  {/* 5. Legend overlay */}
                  <div style={{
                    position: "absolute", bottom: 24, right: 12, zIndex: 1000,
                    background: "rgba(10,10,15,0.85)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, padding: "8px 12px", fontSize: 11,
                    backdropFilter: "blur(8px)", color: "#ccc"
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 4, color: "#fff" }}>Route Risk</div>
                    {[["#00D4AA", "SAFE"], ["#FFB800", "MODERATE"], ["#FF3366", "HIGH RISK"]].map(([c, l]) => (
                      <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                        <span>{l}</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default RouteAnalyzer;
