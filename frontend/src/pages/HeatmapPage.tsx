import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { X, Filter, Loader2 } from "lucide-react";
import { getRiskColor, getRiskLevel, getRiskAction } from "@/data/mockData";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { api } from "@/services/api";
import "leaflet/dist/leaflet.css";

// Known coordinates for Indian state capitals/major cities (for districts without coords)
const STATE_COORDS: Record<string, [number, number]> = {
  "ANDHRA PRADESH": [15.9129, 79.7400], "ARUNACHAL PRADESH": [28.2180, 94.7278],
  "ASSAM": [26.2006, 92.9376], "BIHAR": [25.0961, 85.3131],
  "CHHATTISGARH": [21.2787, 81.8661], "GOA": [15.2993, 74.1240],
  "GUJARAT": [22.2587, 71.1924], "HARYANA": [29.0588, 76.0856],
  "HIMACHAL PRADESH": [31.1048, 77.1734], "JHARKHAND": [23.6102, 85.2799],
  "KARNATAKA": [15.3173, 75.7139], "KERALA": [10.8505, 76.2711],
  "MADHYA PRADESH": [22.9734, 78.6569], "MAHARASHTRA": [19.7515, 75.7139],
  "MANIPUR": [24.6637, 93.9063], "MEGHALAYA": [25.4670, 91.3662],
  "MIZORAM": [23.1645, 92.9376], "NAGALAND": [26.1584, 94.5624],
  "ODISHA": [20.9517, 85.0985], "PUNJAB": [31.1471, 75.3412],
  "RAJASTHAN": [27.0238, 74.2179], "SIKKIM": [27.5330, 88.5122],
  "TAMIL NADU": [11.1271, 78.6569], "TELANGANA": [18.1124, 79.0193],
  "TRIPURA": [23.9408, 91.9882], "UTTAR PRADESH": [26.8467, 80.9462],
  "UTTARAKHAND": [30.0668, 79.0193], "WEST BENGAL": [22.9868, 87.8550],
  "DELHI": [28.7041, 77.1025], "CHANDIGARH": [30.7333, 76.7794],
  "PUDUCHERRY": [11.9416, 79.8083], "JAMMU & KASHMIR": [33.7782, 76.5762],
  "ANDAMAN & NICOBAR ISLANDS": [11.7401, 92.6586], "D & N HAVELI": [20.1809, 73.0169],
  "DAMAN & DIU": [20.3974, 72.8328], "LAKSHADWEEP": [10.5667, 72.6417],
};

interface DistrictData {
  district: string;
  state: string;
  risk_level: string;
  risk_code: number;
  crime_rate: number;
  risk_score: number;
  color: string;
  confidence: number;
  breakdown: Record<string, number>;
  lat: number;
  lng: number;
}

const MapUpdater = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
  return null;
};

const HeatmapPage = () => {
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState("All");
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [heatmapRes, stateRes] = await Promise.all([
        api.getHeatmapData(),
        api.getStateData(),
      ]);

      const allDistricts: DistrictData[] = [];
      const stateSet = new Set<string>();

      if (heatmapRes?.districts) {
        // Assign coordinates: jitter around state center per district
        const stateDistrictCount: Record<string, number> = {};
        for (const d of heatmapRes.districts) {
          const state = d.state?.toUpperCase();
          stateSet.add(state);
          if (!stateDistrictCount[state]) stateDistrictCount[state] = 0;
          stateDistrictCount[state]++;

          const baseCoords = STATE_COORDS[state] || [22.5, 78.5];
          // Deterministic jitter based on district name hash
          const hash = d.district?.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0) || 0;
          const angle = (hash % 360) * (Math.PI / 180);
          const radius = 0.5 + (hash % 200) / 100;

          allDistricts.push({
            district: d.district,
            state: d.state,
            risk_level: d.risk_level,
            risk_code: d.risk_code,
            crime_rate: d.crime_rate,
            risk_score: d.risk_score || 0,
            color: d.color,
            confidence: d.confidence || 0.85,
            breakdown: d.breakdown || {},
            lat: baseCoords[0] + radius * Math.cos(angle),
            lng: baseCoords[1] + radius * Math.sin(angle),
          });
        }
      }

      setDistricts(allDistricts);
      setStates(Array.from(stateSet).sort());
    } catch (err) {
      console.error("Failed to load heatmap data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load trend when a district is selected
  const loadDistrictTrend = async (d: DistrictData) => {
    setSelectedDistrict(d);
    try {
      const res = await api.getCrimeTrends(d.state, d.district);
      setTrendData(res?.trends || []);
    } catch {
      setTrendData([]);
    }
  };

  const filteredDistricts = selectedState === "All"
    ? districts
    : districts.filter(d => d.state?.toUpperCase() === selectedState);

  const mapCenter: [number, number] = selectedState === "All"
    ? [22.5, 78.5]
    : STATE_COORDS[selectedState] || [22.5, 78.5];

  const mapZoom = selectedState === "All" ? 5 : 7;

  const getRiskFromCode = (code: number) => code === 2 ? "HIGH" : code === 1 ? "MEDIUM" : "LOW";

  // Donut data
  const getDistrictDonut = (d: DistrictData) => {
    const b = d.breakdown || {};
    return [
      { name: "Rape", value: b.rape || 0, color: "hsl(355, 82%, 56%)" },
      { name: "Kidnapping", value: b.kidnapping || 0, color: "hsl(280, 70%, 55%)" },
      { name: "Dowry", value: b.dowry || 0, color: "hsl(44, 100%, 70%)" },
      { name: "Assault", value: b.assault || 0, color: "hsl(168, 100%, 48%)" },
      { name: "Cruelty", value: b.cruelty || 0, color: "hsl(210, 80%, 60%)" },
      { name: "Insult", value: b.insult || 0, color: "hsl(240, 15%, 60%)" },
    ].filter(c => c.value > 0);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-3 text-muted-foreground">Loading {districts.length} districts from backend…</span>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative pt-16">
      {/* Top bar */}
      <div className="absolute top-16 left-0 right-0 z-[1000] glass-panel px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-heading text-foreground">Safety Heatmap — India</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-xs text-secondary">Real NCRB Data · {filteredDistricts.length} districts</span>
          </span>
        </div>
      </div>

      {/* Map */}
      <MapContainer center={mapCenter} zoom={mapZoom} className="h-full w-full z-0" zoomControl={false} style={{ background: "#0a0a0f" }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <MapUpdater center={mapCenter} zoom={mapZoom} />

        {filteredDistricts.map((d, i) => {
          const risk = getRiskFromCode(d.risk_code);
          const color = d.color || getRiskColor(risk);
          const radius = Math.max(4, Math.min(12, d.crime_rate / 200));
          return (
            <CircleMarker
              key={`${d.district}-${d.state}-${i}`}
              center={[d.lat, d.lng]}
              radius={radius}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.5, weight: 1.5 }}
              eventHandlers={{ click: () => loadDistrictTrend(d) }}
            >
              <Popup className="dark-popup">
                <span className="text-xs font-semibold">{d.district}</span><br />
                <span className="text-xs">{d.state} — {d.risk_level}</span><br />
                <span className="text-xs">Crimes: {d.crime_rate?.toLocaleString()}</span>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Filters panel */}
      <div className="absolute top-28 left-4 z-[1000] glass-panel rounded-xl p-4 w-64 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">State</label>
          <select
            value={selectedState}
            onChange={(e) => { setSelectedState(e.target.value); setSelectedDistrict(null); }}
            className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground"
          >
            <option value="All">All States & UTs ({districts.length} districts)</option>
            {states.map(s => {
              const count = districts.filter(d => d.state?.toUpperCase() === s).length;
              return <option key={s} value={s}>{s} ({count})</option>;
            })}
          </select>
        </div>
        <div className="text-[10px] text-muted-foreground">
          Data source: NCRB 2001-2015<br />
          Districts: {districts.length} · States & UTs: {states.length}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-4 z-[1000] glass-panel rounded-xl p-3 space-y-2">
        {([["HIGH RISK", "#FF3366"], ["MODERATE", "#FFB800"], ["SAFE", "#00D4AA"]] as const).map(([label, color]) => (
          <div key={label} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* District detail panel */}
      <AnimatePresence>
        {selectedDistrict && (
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="absolute top-28 right-4 z-[1000] glass-panel rounded-xl p-5 w-80"
          >
            <button onClick={() => setSelectedDistrict(null)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-heading font-bold text-foreground mb-1">{selectedDistrict.district}</h3>
            <p className="text-xs text-muted-foreground mb-4">{selectedDistrict.state}</p>

            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl font-heading font-bold" style={{ color: selectedDistrict.color }}>
                {selectedDistrict.crime_rate?.toLocaleString()}
              </div>
              <div className="px-2 py-0.5 rounded text-xs font-bold" style={{
                backgroundColor: `${selectedDistrict.color}20`,
                color: selectedDistrict.color
              }}>
                {selectedDistrict.risk_level}
              </div>
            </div>

            {/* Crime breakdown donut */}
            {getDistrictDonut(selectedDistrict).length > 0 && (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={getDistrictDonut(selectedDistrict)} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" stroke="none">
                      {getDistrictDonut(selectedDistrict).map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#12121a", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 11 }}
                      formatter={(v: any) => [Number(v).toLocaleString(), "Cases"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Crime breakdown list */}
            <div className="space-y-1 mt-2">
              {getDistrictDonut(selectedDistrict).map(c => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-muted-foreground">{c.name}</span>
                  </span>
                  <span className="text-foreground font-medium">{c.value.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Trend sparkline */}
            {trendData.length > 0 && (
              <div className="h-20 mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <XAxis dataKey="year" tick={{ fontSize: 8, fill: "hsl(240,15%,60%)" }} />
                    <YAxis hide />
                    <Line type="monotone" dataKey="total_crimes" stroke="#e63946" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-3">
              Confidence: {(selectedDistrict.confidence * 100).toFixed(0)}% · Data: NCRB 2001-2015
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeatmapPage;
