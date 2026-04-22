/**
 * SafeHer Crime Data Service
 * Offline ML prediction engine using bundled NCRB risk_lookup.json
 * Mirrors the backend predict.py — no API calls needed.
 *
 * Real stats from the model:
 *  - 1032 total entries (including state-level ZZ TOTAL rows)
 *  - ~1032 district entries across 36 states/UTs
 *  - SAFE: 372 | MODERATE: 317 | HIGH RISK: 343 real districts
 *  - LightGBM accuracy: 99.43%
 */

import riskLookupRaw from '../assets/data/risk_lookup.json';
import trainingResultsRaw from '../assets/data/training_results.json';

// ─── Types ───────────────────────────────────────────────────────────────────
export type RiskLevel = 'SAFE' | 'MODERATE' | 'HIGH RISK' | 'UNKNOWN';
export type RiskCode = 0 | 1 | 2 | -1;

export interface CrimeBreakdown {
  rape: number;
  kidnapping: number;
  dowry: number;
  assault: number;
  insult: number;
  cruelty: number;
}

export interface DistrictRisk {
  state: string;
  district: string;
  risk_level: RiskLevel;
  risk_code: RiskCode;
  risk_label: string;
  confidence: number;
  prob_safe: number;
  prob_moderate: number;
  prob_high: number;
  total_crimes: number;
  risk_score: number;
  color: string;
  breakdown: Partial<CrimeBreakdown>;
  last_year: number;
  data_source: string;
  note?: string;
  matched_as?: string;
  time_adjusted?: boolean;
  hour?: number;
}

export interface StateRanking {
  state: string;
  risk_level: RiskLevel;
  risk_code: RiskCode;
  avg_crime_rate: number;
  total_crimes: number;
  avg_risk_score: number;
  color: string;
  num_districts: number;
  breakdown: Partial<CrimeBreakdown>;
  rank?: number;
}

export interface ModelResult {
  model: string;
  cv_mean: number;
  cv_std: number;
  test_accuracy: number;
  isBest: boolean;
  feature_importance?: Record<string, number>;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const RISK_COLORS: Record<number, string> = {
  0: '#00D4AA',  // SAFE — teal
  1: '#FFB800',  // MODERATE — amber
  2: '#FF3366',  // HIGH RISK — red
};
const RISK_LABELS: Record<number, RiskLevel> = {
  0: 'SAFE', 1: 'MODERATE', 2: 'HIGH RISK',
};

// State center coordinates for map markers
export const STATE_COORDS: Record<string, [number, number]> = {
  'ANDHRA PRADESH': [15.9129, 79.7400],
  'ARUNACHAL PRADESH': [28.2180, 94.7278],
  'ASSAM': [26.2006, 92.9376],
  'BIHAR': [25.0961, 85.3131],
  'CHHATTISGARH': [21.2787, 81.8661],
  'GOA': [15.2993, 74.1240],
  'GUJARAT': [22.2587, 71.1924],
  'HARYANA': [29.0588, 76.0856],
  'HIMACHAL PRADESH': [31.1048, 77.1734],
  'JHARKHAND': [23.6102, 85.2799],
  'KARNATAKA': [15.3173, 75.7139],
  'KERALA': [10.8505, 76.2711],
  'MADHYA PRADESH': [22.9734, 78.6569],
  'MAHARASHTRA': [19.7515, 75.7139],
  'MANIPUR': [24.6637, 93.9063],
  'MEGHALAYA': [25.4670, 91.3662],
  'MIZORAM': [23.1645, 92.9376],
  'NAGALAND': [26.1584, 94.5624],
  'ODISHA': [20.9517, 85.0985],
  'PUNJAB': [31.1471, 75.3412],
  'RAJASTHAN': [27.0238, 74.2179],
  'SIKKIM': [27.5330, 88.5122],
  'TAMIL NADU': [11.1271, 78.6569],
  'TELANGANA': [18.1124, 79.0193],
  'TRIPURA': [23.9408, 91.9882],
  'UTTAR PRADESH': [26.8467, 80.9462],
  'UTTARAKHAND': [30.0668, 79.0193],
  'WEST BENGAL': [22.9868, 87.8550],
  'DELHI': [28.7041, 77.1025],
  'CHANDIGARH': [30.7333, 76.7794],
  'PUDUCHERRY': [11.9416, 79.8083],
  'JAMMU & KASHMIR': [33.7782, 76.5762],
  'ANDAMAN & NICOBAR ISLANDS': [11.7401, 92.6586],
  'D & N HAVELI': [20.1809, 73.0169],
  'DAMAN & DIU': [20.3974, 72.8328],
  'LAKSHADWEEP': [10.5667, 72.6417],
};

const STATE_ALIASES: Record<string, string> = {
  'UTTARANCHAL': 'UTTARAKHAND',
  'ORISSA': 'ODISHA',
  'PONDICHERRY': 'PUDUCHERRY',
  'NCT OF DELHI': 'DELHI',
  'JAMMU AND KASHMIR': 'JAMMU & KASHMIR',
  'ANDAMAN AND NICOBAR ISLANDS': 'ANDAMAN & NICOBAR ISLANDS',
  'DADRA AND NAGAR HAVELI': 'D & N HAVELI',
};

// ─── Service ──────────────────────────────────────────────────────────────────
class CrimeDataService {
  private cache: Map<string, DistrictRisk> = new Map();
  private stateAverages: Map<string, StateRanking> = new Map();
  private _allDistricts: DistrictRisk[] = []; // pre-filtered, no ZZ entries
  public loaded = false;
  public districtCount = 0;
  public stateCount = 0;

  /** Call this once at app startup in _layout.tsx */
  load(): boolean {
    if (this.loaded) return true;
    try {
      const raw = riskLookupRaw as Record<string, any>;
      let realDistricts = 0;

      for (const [key, entry] of Object.entries(raw)) {
        // Skip state-level total rows (e.g. "UTTAR PRADESH|ZZ TOTAL")
        if (entry.district?.startsWith('ZZ')) continue;

        const code = Number(entry.risk_level ?? 1) as RiskCode;
        const district: DistrictRisk = {
          state: entry.state ?? '',
          district: entry.district ?? '',
          risk_level: RISK_LABELS[code] ?? 'MODERATE',
          risk_code: code,
          risk_label: entry.risk_label ?? RISK_LABELS[code] ?? 'MODERATE',
          confidence: Number(entry.confidence ?? 0.85),
          prob_safe: Number(entry.prob_safe ?? 0),
          prob_moderate: Number(entry.prob_moderate ?? 0),
          prob_high: Number(entry.prob_high ?? 0),
          total_crimes: Number(entry.total_crimes ?? 0),
          risk_score: Number(entry.risk_score ?? 0),
          color: RISK_COLORS[code] ?? '#FFB800',
          breakdown: {
            rape: Number(entry.breakdown?.rape ?? 0),
            kidnapping: Number(entry.breakdown?.kidnapping ?? 0),
            dowry: Number(entry.breakdown?.dowry ?? 0),
            assault: Number(entry.breakdown?.assault ?? 0),
            insult: Number(entry.breakdown?.insult ?? 0),
            cruelty: Number(entry.breakdown?.cruelty ?? 0),
          },
          last_year: Number(entry.last_year ?? 2015),
          data_source: 'NCRB (2001–2015)',
        };
        this.cache.set(key, district);
        realDistricts++;
      }

      this.districtCount = realDistricts;
      this._allDistricts = Array.from(this.cache.values());
      this._computeStateAverages();
      this.loaded = true;
      return true;
    } catch (err) {
      console.error('[SafeHer] CrimeDataService load failed:', err);
      return false;
    }
  }

  private _computeStateAverages() {
    const groups = new Map<string, DistrictRisk[]>();
    for (const d of this._allDistricts) {
      const stateKey = d.state.toUpperCase();
      if (!groups.has(stateKey)) groups.set(stateKey, []);
      groups.get(stateKey)!.push(d);
    }

    for (const [state, districts] of groups) {
      const totalCrimes = districts.reduce((s, d) => s + d.total_crimes, 0);
      const avgCode = districts.reduce((s, d) => s + d.risk_code, 0) / districts.length;
      const avgScore = districts.reduce((s, d) => s + d.risk_score, 0) / districts.length;
      const riskCode = Math.min(2, Math.max(0, Math.round(avgCode))) as RiskCode;
      const breakdown: CrimeBreakdown = { rape: 0, kidnapping: 0, dowry: 0, assault: 0, insult: 0, cruelty: 0 };
      for (const d of districts) {
        breakdown.rape += d.breakdown.rape ?? 0;
        breakdown.kidnapping += d.breakdown.kidnapping ?? 0;
        breakdown.dowry += d.breakdown.dowry ?? 0;
        breakdown.assault += d.breakdown.assault ?? 0;
        breakdown.insult += d.breakdown.insult ?? 0;
        breakdown.cruelty += d.breakdown.cruelty ?? 0;
      }
      this.stateAverages.set(state, {
        state, risk_level: RISK_LABELS[riskCode] ?? 'MODERATE', risk_code: riskCode,
        avg_crime_rate: Math.round(totalCrimes / districts.length),
        total_crimes: totalCrimes,
        avg_risk_score: Math.round(avgScore * 10) / 10,
        color: RISK_COLORS[riskCode] ?? '#FFB800',
        num_districts: districts.length,
        breakdown,
      });
    }
    this.stateCount = this.stateAverages.size;
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /** All real districts (no ZZ totals) */
  getAllDistricts(): DistrictRisk[] {
    return this._allDistricts;
  }

  /** All districts with approximate lat/lng for map rendering */
  getAllDistrictsWithCoords(): (DistrictRisk & { lat: number; lng: number })[] {
    return this._allDistricts.map(d => {
      const base = STATE_COORDS[d.state.toUpperCase()] ?? [22.5, 78.5];
      // Deterministic jitter based on district name hash
      const hash = d.district.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const angle = (hash % 360) * (Math.PI / 180);
      const radius = 0.4 + (hash % 300) / 200;
      return {
        ...d,
        lat: base[0] + radius * Math.sin(angle),
        lng: base[1] + radius * Math.cos(angle),
      };
    });
  }

  /** Get risk for a specific district (with fuzzy match + time adjustment) */
  getDistrictRisk(stateName: string, districtName: string, hour?: number): DistrictRisk {
    const state = this._normalizeState(stateName);
    const district = this._clean(districtName);
    const key = `${state}|${district}`;

    let result = this.cache.get(key);

    // Fuzzy match within state
    if (!result) {
      let best = '';
      let bestScore = 0;
      for (const [k] of this.cache) {
        if (!k.startsWith(`${state}|`)) continue;
        const dName = k.split('|')[1];
        const score = this._dice(district, dName);
        if (score > bestScore && score > 0.55) { bestScore = score; best = k; }
      }
      if (best) result = { ...this.cache.get(best)!, matched_as: best.split('|')[1] };
    }

    // State average fallback
    if (!result) {
      const avg = this.stateAverages.get(state);
      if (avg) {
        result = {
          state: stateName, district: districtName,
          risk_level: avg.risk_level, risk_code: avg.risk_code,
          risk_label: avg.risk_level,
          confidence: 0.55, prob_safe: 0, prob_moderate: 0, prob_high: 0,
          total_crimes: avg.avg_crime_rate,
          risk_score: avg.avg_risk_score,
          color: avg.color, breakdown: avg.breakdown,
          last_year: 2015, data_source: 'NCRB (2001–2015)',
          note: 'State average (district not in NCRB dataset)',
        };
      }
    }

    if (!result) {
      return {
        state: stateName, district: districtName,
        risk_level: 'UNKNOWN', risk_code: -1, risk_label: 'UNKNOWN',
        confidence: 0, prob_safe: 0, prob_moderate: 0, prob_high: 0,
        total_crimes: 0, risk_score: 0, color: '#888888',
        breakdown: {}, last_year: 2015, data_source: 'NCRB (2001–2015)',
        note: 'Not found in NCRB database',
      };
    }

    // Time-of-day risk adjustment (same as backend)
    if (hour !== undefined && result.risk_code >= 0) {
      result = { ...result };
      let base = result.risk_code / 2;
      if (hour >= 22 || hour <= 5) base = Math.min(base * 1.4, 1);
      else if (hour >= 18) base = Math.min(base * 1.15, 1);
      const adjustedCode = Math.min(2, Math.round(base * 2)) as RiskCode;
      if (adjustedCode !== result.risk_code) {
        result.risk_code = adjustedCode;
        result.risk_level = RISK_LABELS[adjustedCode];
        result.risk_label = RISK_LABELS[adjustedCode];
        result.color = RISK_COLORS[adjustedCode];
        result.time_adjusted = true;
        result.hour = hour;
      }
    }
    return result;
  }

  /** States ranked from most to least dangerous */
  getStateRankings(): StateRanking[] {
    const rankings = Array.from(this.stateAverages.values())
      .sort((a, b) => b.total_crimes - a.total_crimes);
    rankings.forEach((r, i) => (r.rank = i + 1));
    return rankings;
  }

  getStateNames(): string[] {
    return Array.from(this.stateAverages.keys()).sort();
  }

  getRiskDistribution(): { safe: number; moderate: number; high_risk: number } {
    return {
      safe: this._allDistricts.filter(d => d.risk_code === 0).length,
      moderate: this._allDistricts.filter(d => d.risk_code === 1).length,
      high_risk: this._allDistricts.filter(d => d.risk_code === 2).length,
    };
  }

  getTopDangerousDistricts(n = 20): DistrictRisk[] {
    return [...this._allDistricts]
      .sort((a, b) => b.total_crimes - a.total_crimes)
      .slice(0, n);
  }

  /** Aggregate crime type totals from all real districts */
  getCrimeTypeBreakdown(): Record<keyof CrimeBreakdown, number> {
    const totals = { rape: 0, kidnapping: 0, dowry: 0, assault: 0, insult: 0, cruelty: 0 };
    for (const d of this._allDistricts) {
      totals.rape += d.breakdown.rape ?? 0;
      totals.kidnapping += d.breakdown.kidnapping ?? 0;
      totals.dowry += d.breakdown.dowry ?? 0;
      totals.assault += d.breakdown.assault ?? 0;
      totals.insult += d.breakdown.insult ?? 0;
      totals.cruelty += d.breakdown.cruelty ?? 0;
    }
    return totals;
  }

  /** Training results and model comparison */
  getModelInfo() {
    const raw = trainingResultsRaw as any;
    return {
      best_model: raw.best_model as string,
      best_accuracy: raw.best_accuracy as number,
      districts_cached: this.districtCount,
      states_cached: this.stateCount,
      models: raw.models as Record<string, any>,
    };
  }

  searchDistricts(query: string, limit = 20): DistrictRisk[] {
    const q = query.toUpperCase().trim();
    if (!q) return [];
    return this._allDistricts
      .filter(d => d.district.includes(q) || d.state.includes(q))
      .slice(0, limit);
  }

  // ─── Utilities ─────────────────────────────────────────────────────────────
  private _normalizeState(raw: string): string {
    const u = raw.toUpperCase().trim();
    return STATE_ALIASES[u] ?? u;
  }

  private _clean(raw: string): string {
    return raw
      .replace(/\s+(district|tehsil|taluk|mandal|block|municipality|cantonment)$/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  /** Dice coefficient string similarity */
  private _dice(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) return 0;
    const bigrams = new Map<string, number>();
    for (let i = 0; i < a.length - 1; i++) {
      const bg = a.slice(i, i + 2);
      bigrams.set(bg, (bigrams.get(bg) ?? 0) + 1);
    }
    let match = 0;
    for (let i = 0; i < b.length - 1; i++) {
      const bg = b.slice(i, i + 2);
      const cnt = bigrams.get(bg) ?? 0;
      if (cnt > 0) { bigrams.set(bg, cnt - 1); match++; }
    }
    return (2 * match) / (a.length + b.length - 2);
  }
}

export const crimeDataService = new CrimeDataService();
