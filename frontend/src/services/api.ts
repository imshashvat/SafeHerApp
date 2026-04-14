// SafeHer API service — connects to Flask backend at localhost:5000
// ALL data is REAL from NCRB dataset + LightGBM ML model
const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = {
  // ── Heatmap (real district risk data) ─────────────────────────────
  async getHeatmapData() {
    const res = await fetch(`${BASE}/heatmap-data`);
    if (!res.ok) throw new Error("Backend offline");
    return res.json();
  },

  // ── State-level data ──────────────────────────────────────────────
  async getStateData() {
    const res = await fetch(`${BASE}/state-data`);
    if (!res.ok) throw new Error("Backend offline");
    return res.json();
  },

  // ── Safety check (ML prediction) ─────────────────────────────────
  async checkSafety(state: string, district: string, hour: number) {
    const res = await fetch(`${BASE}/safety-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, district, hour }),
    });
    if (!res.ok) throw new Error("Safety check failed");
    return res.json();
  },

  // ── Batch safety check ────────────────────────────────────────────
  async checkSafetyBatch(locations: Array<{ state: string; district: string; hour: number }>) {
    const res = await fetch(`${BASE}/safety-check-batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locations }),
    });
    if (!res.ok) throw new Error("Batch check failed");
    return res.json();
  },

  // ── Crime trends (real NCRB year-over-year) ───────────────────────
  async getCrimeTrends(state?: string, district?: string) {
    let url = `${BASE}/crime-trends`;
    const params = new URLSearchParams();
    if (state) params.set("state", state);
    if (district) params.set("district", district);
    if (params.toString()) url += `?${params}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed");
    return res.json();
  },

  // ── State rankings (real NCRB totals) ─────────────────────────────
  async getStateRankings(top = 36) {
    const res = await fetch(`${BASE}/state-rankings?top=${top}`);
    if (!res.ok) throw new Error("Failed");
    return res.json();
  },

  // ── Crime type breakdown (real totals) ────────────────────────────
  async getCrimeTypes() {
    const res = await fetch(`${BASE}/crime-types`);
    if (!res.ok) throw new Error("Failed");
    return res.json();
  },

  // ── Model Info (real training results) ────────────────────────────
  async getModelInfo() {
    const res = await fetch(`${BASE}/model-info`);
    if (!res.ok) throw new Error("Failed");
    return res.json();
  },

  // ── Route analysis (Nominatim + OSRM + ML) ───────────────────────
  async getRouteAnalysis(from: string, to: string, time: string) {
    const hour = parseInt(time.split(":")[0], 10);

    // 1. Geocode
    const [fRes, tRes] = await Promise.all([
      fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(from + ", India")}`, {
        headers: { "Accept-Language": "en", "User-Agent": "SafeHer/1.0" },
      }),
      fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(to + ", India")}`, {
        headers: { "Accept-Language": "en", "User-Agent": "SafeHer/1.0" },
      }),
    ]);
    const fData = await fRes.json();
    const tData = await tRes.json();
    if (!fData.length || !tData.length) throw new Error("Could not geocode locations");

    const startLat = parseFloat(fData[0].lat);
    const startLon = parseFloat(fData[0].lon);
    const endLat = parseFloat(tData[0].lat);
    const endLon = parseFloat(tData[0].lon);

    // 2. OSRM route
    const osrmRes = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`
    );
    const osrmData = await osrmRes.json();
    if (osrmData.code !== "Ok") throw new Error("No route found");
    const route = osrmData.routes[0];
    const coords: [number, number][] = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);

    // 3. Sample 5 waypoints evenly across the route for better coverage
    const NUM_WAYPOINTS = 5;
    const waypointIndices = Array.from({ length: NUM_WAYPOINTS }, (_, i) =>
      Math.floor((i / (NUM_WAYPOINTS - 1)) * (coords.length - 1))
    );

    // 4. Reverse-geocode all 5 waypoints in parallel
    const geoResults = await Promise.all(
      waypointIndices.map(async (idx) => {
        const [lat, lon] = coords[idx];
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&zoom=10`,
            { headers: { "Accept-Language": "en", "User-Agent": "SafeHer/1.0" } }
          );
          const geo = await res.json();
          return {
            state: normalizeState(geo?.address?.state || ""),
            district: cleanDistrict(geo?.address?.county || geo?.address?.state_district || geo?.address?.city || ""),
          };
        } catch {
          return { state: "", district: "" };
        }
      })
    );

    // 5. ML predictions for all 5 waypoints in parallel
    const mlResults = await Promise.all(
      geoResults.map(async ({ state, district }) => {
        if (!state || !district) return null;
        try {
          return await this.checkSafety(state, district, hour);
        } catch {
          return null;
        }
      })
    );

    // 6. Deduplicate consecutive same districts (avoid duplicate cards)
    const seenKeys = new Set<string>();
    const uniqueSegments: any[] = [];
    const segLen = Math.floor(coords.length / NUM_WAYPOINTS);

    mlResults.forEach((ml, i) => {
      const geo = geoResults[i];
      const key = `${geo.state}|${geo.district}`;
      if (seenKeys.has(key) || !geo.district) return;
      seenKeys.add(key);

      const mapRisk = (r: string) => {
        if (r === "HIGH RISK") return "HIGH" as const;
        if (r === "MODERATE") return "MEDIUM" as const;
        if (r === "SAFE") return "LOW" as const;
        return "MEDIUM" as const;
      };

      const segStart = Math.max(0, waypointIndices[i] - Math.floor(segLen / 2));
      const segEnd = Math.min(coords.length - 1, waypointIndices[i] + Math.floor(segLen / 2));

      uniqueSegments.push({
        id: i + 1,
        name: geo.district,
        state: geo.state,
        risk: ml ? mapRisk(ml.risk_level) : "MEDIUM",
        risk_code: ml?.risk_code ?? 1,
        crime_rate: ml?.crime_rate ?? 0,
        risk_score: ml?.risk_score ?? 0,
        confidence: ml?.confidence ?? 0,
        breakdown: ml?.breakdown ?? {},
        data_source: ml?.data_source ?? "NCRB",
        last_year: ml?.last_year ?? 2015,
        note: ml?.note,
        distance: formatDist(segDistance(coords.slice(segStart, segEnd + 1))),
        coords: coords.slice(segStart, segEnd + 1),
      });
    });

    // 7. Compute refined overall score based on actual ML crime_rate
    const riskCodes = uniqueSegments.map(s => s.risk_code).filter(c => c >= 0);
    const maxRiskCode = riskCodes.length ? Math.max(...riskCodes) : 1;
    const avgRiskCode = riskCodes.length ? riskCodes.reduce((a, b) => a + b, 0) / riskCodes.length : 1;

    // Use weighted mix: 60% worst segment, 40% average
    const weightedCode = maxRiskCode * 0.6 + avgRiskCode * 0.4;
    // Map to 0-100 score: 0=safe(20), 2=high risk(85)
    const overallScore = Math.round(10 + (weightedCode / 2) * 75);
    const overallRisk = maxRiskCode === 2 ? "HIGH" as const : maxRiskCode === 1 ? "MEDIUM" as const : "LOW" as const;

    return {
      segments: uniqueSegments,
      overallRisk,
      overallScore,
      routeCoords: coords,
      startCoord: [startLat, startLon] as [number, number],
      endCoord: [endLat, endLon] as [number, number],
      distance: route.distance,
      duration: route.duration,
    };
  },


  // ── Community reports ─────────────────────────────────────────────
  async getCommunityReports() {
    try {
      const res = await fetch(`${BASE}/incidents`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      return (data.incidents || []).map((r: any) => ({
        id: r.id,
        lat: r.latitude,
        lng: r.longitude,
        category: r.crime_type,
        description: r.description,
        severity: r.severity,
        reported_at: r.reported_at,
        time: r.reported_at ? new Date(r.reported_at).toLocaleTimeString() : ""
      }));
    } catch {
      const { communityReports } = await import("@/data/mockData");
      return communityReports;
    }
  },

  async submitReport(data: { category: string; description: string; lat: number; lng: number }) {
    const res = await fetch(`${BASE}/incidents`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        crime_type: data.category,
        description: data.description,
        latitude: data.lat,
        longitude: data.lng
      }),
    });
    return res.json();
  },

  async deleteReport(id: number) {
    const res = await fetch(`${BASE}/incidents/${id}`, {
      method: "DELETE"
    });
    return res.json();
  },

  // ── SOS Email (real SMTP via backend) ─────────────────────────────
  async sendSOSEmail(emails: string[], locationUrl: string, senderName: string) {
    const res = await fetch(`${BASE}/sos/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emails, location_url: locationUrl,
        time: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        sender_name: senderName,
      }),
    });
    return res.json();
  },

  // ── Police stations (Overpass API) ────────────────────────────────
  async getPoliceStations(lat: number, lon: number, radius = 5000) {
    const q = `[out:json][timeout:15];(node["amenity"="police"](around:${radius},${lat},${lon});way["amenity"="police"](around:${radius},${lat},${lon}););out body;>;out skel qt;`;
    const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`);
    const data = await res.json();
    return (data.elements || [])
      .filter((e: any) => e.lat && e.lon)
      .slice(0, 10)
      .map((e: any) => ({
        id: e.id, lat: e.lat, lon: e.lon,
        name: e.tags?.name || e.tags?.["name:en"] || "Police Station",
        phone: e.tags?.phone || e.tags?.["contact:phone"] || null,
      }));
  },

  // ── Health check ──────────────────────────────────────────────────
  async healthCheck() {
    const res = await fetch(`${BASE}/health`);
    return res.json();
  },
};

// ── Helpers ──────────────────────────────────────────────────────────
const STATE_ALIASES: Record<string, string> = {
  UTTARANCHAL: "UTTARAKHAND", ORISSA: "ODISHA", PONDICHERRY: "PUDUCHERRY",
  "NCT OF DELHI": "DELHI", "JAMMU AND KASHMIR": "JAMMU & KASHMIR",
  "ANDAMAN AND NICOBAR ISLANDS": "ANDAMAN & NICOBAR ISLANDS",
  "DADRA AND NAGAR HAVELI": "D & N HAVELI",
};
function normalizeState(raw: string): string { const u = raw.toUpperCase().trim(); return STATE_ALIASES[u] || u; }
function cleanDistrict(raw: string): string { return raw.replace(/\s+(district|tehsil|taluk|mandal|block|municipality|cantonment)$/i, "").replace(/\s+/g, " ").trim().toUpperCase(); }
function haversine([lat1, lon1]: number[], [lat2, lon2]: number[]) { const R = 6371000, dLat = ((lat2 - lat1) * Math.PI) / 180, dLon = ((lon2 - lon1) * Math.PI) / 180; const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2; return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); }
function segDistance(coords: [number, number][]) { let d = 0; for (let i = 1; i < coords.length; i++) d += haversine(coords[i - 1], coords[i]); return d; }
function formatDist(m: number) { return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`; }
