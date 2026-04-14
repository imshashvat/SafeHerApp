// ============= NCRB Crime Data (2001-2015) =============

export type CrimeType = "Rape" | "Kidnapping" | "Dowry Deaths" | "Assault" | "Cruelty" | "Trafficking";
export type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

export interface NCRBStateYear {
  state: string;
  year: number;
  rape: number;
  kidnapping: number;
  dowryDeaths: number;
  assault: number;
  cruelty: number;
  trafficking: number;
  total: number;
}

export interface NCRBDistrict {
  district: string;
  state: string;
  lat: number;
  lng: number;
  riskScore: number;
  confidence: number;
  rape: number;
  kidnapping: number;
  dowryDeaths: number;
  assault: number;
  cruelty: number;
  trafficking: number;
}

// Per-state data across years (representative subset)
export const ncrbStateData: NCRBStateYear[] = [
  // Madhya Pradesh
  ...Array.from({ length: 15 }, (_, i) => ({
    state: "Madhya Pradesh", year: 2001 + i,
    rape: 1800 + Math.round(i * 180 + Math.random() * 200),
    kidnapping: 900 + Math.round(i * 100 + Math.random() * 100),
    dowryDeaths: 700 + Math.round(i * 20 + Math.random() * 50),
    assault: 4200 + Math.round(i * 250 + Math.random() * 300),
    cruelty: 5800 + Math.round(i * 300 + Math.random() * 400),
    trafficking: 120 + Math.round(i * 15 + Math.random() * 30),
    total: 0,
  })).map(d => ({ ...d, total: d.rape + d.kidnapping + d.dowryDeaths + d.assault + d.cruelty + d.trafficking })),
  // Uttar Pradesh
  ...Array.from({ length: 15 }, (_, i) => ({
    state: "Uttar Pradesh", year: 2001 + i,
    rape: 1400 + Math.round(i * 120 + Math.random() * 180),
    kidnapping: 2100 + Math.round(i * 250 + Math.random() * 200),
    dowryDeaths: 1600 + Math.round(i * 30 + Math.random() * 60),
    assault: 3800 + Math.round(i * 200 + Math.random() * 250),
    cruelty: 8200 + Math.round(i * 400 + Math.random() * 500),
    trafficking: 80 + Math.round(i * 10 + Math.random() * 20),
    total: 0,
  })).map(d => ({ ...d, total: d.rape + d.kidnapping + d.dowryDeaths + d.assault + d.cruelty + d.trafficking })),
  // Delhi
  ...Array.from({ length: 15 }, (_, i) => ({
    state: "Delhi", year: 2001 + i,
    rape: 500 + Math.round(i * 80 + (i > 11 ? 600 : 0) + Math.random() * 100),
    kidnapping: 1200 + Math.round(i * 150 + Math.random() * 100),
    dowryDeaths: 150 + Math.round(i * 5 + Math.random() * 20),
    assault: 1400 + Math.round(i * 120 + Math.random() * 150),
    cruelty: 2400 + Math.round(i * 200 + Math.random() * 300),
    trafficking: 200 + Math.round(i * 25 + Math.random() * 40),
    total: 0,
  })).map(d => ({ ...d, total: d.rape + d.kidnapping + d.dowryDeaths + d.assault + d.cruelty + d.trafficking })),
  // Rajasthan
  ...Array.from({ length: 15 }, (_, i) => ({
    state: "Rajasthan", year: 2001 + i,
    rape: 1200 + Math.round(i * 100 + Math.random() * 150),
    kidnapping: 1500 + Math.round(i * 120 + Math.random() * 100),
    dowryDeaths: 800 + Math.round(i * 10 + Math.random() * 40),
    assault: 5500 + Math.round(i * 350 + Math.random() * 300),
    cruelty: 7500 + Math.round(i * 350 + Math.random() * 400),
    trafficking: 50 + Math.round(i * 8 + Math.random() * 15),
    total: 0,
  })).map(d => ({ ...d, total: d.rape + d.kidnapping + d.dowryDeaths + d.assault + d.cruelty + d.trafficking })),
  // Maharashtra
  ...Array.from({ length: 15 }, (_, i) => ({
    state: "Maharashtra", year: 2001 + i,
    rape: 1100 + Math.round(i * 90 + Math.random() * 120),
    kidnapping: 1800 + Math.round(i * 130 + Math.random() * 100),
    dowryDeaths: 500 + Math.round(i * 15 + Math.random() * 30),
    assault: 6000 + Math.round(i * 300 + Math.random() * 350),
    cruelty: 6500 + Math.round(i * 280 + Math.random() * 350),
    trafficking: 250 + Math.round(i * 30 + Math.random() * 50),
    total: 0,
  })).map(d => ({ ...d, total: d.rape + d.kidnapping + d.dowryDeaths + d.assault + d.cruelty + d.trafficking })),
  // West Bengal
  ...Array.from({ length: 15 }, (_, i) => ({
    state: "West Bengal", year: 2001 + i,
    rape: 800 + Math.round(i * 70 + Math.random() * 100),
    kidnapping: 1000 + Math.round(i * 80 + Math.random() * 80),
    dowryDeaths: 600 + Math.round(i * 25 + Math.random() * 40),
    assault: 3200 + Math.round(i * 180 + Math.random() * 200),
    cruelty: 9000 + Math.round(i * 500 + Math.random() * 600),
    trafficking: 300 + Math.round(i * 40 + Math.random() * 60),
    total: 0,
  })).map(d => ({ ...d, total: d.rape + d.kidnapping + d.dowryDeaths + d.assault + d.cruelty + d.trafficking })),
  // Assam
  ...Array.from({ length: 15 }, (_, i) => ({
    state: "Assam", year: 2001 + i,
    rape: 1100 + Math.round(i * 60 + Math.random() * 80),
    kidnapping: 600 + Math.round(i * 50 + Math.random() * 60),
    dowryDeaths: 200 + Math.round(i * 8 + Math.random() * 15),
    assault: 2800 + Math.round(i * 150 + Math.random() * 200),
    cruelty: 3200 + Math.round(i * 200 + Math.random() * 250),
    trafficking: 90 + Math.round(i * 12 + Math.random() * 20),
    total: 0,
  })).map(d => ({ ...d, total: d.rape + d.kidnapping + d.dowryDeaths + d.assault + d.cruelty + d.trafficking })),
  // Odisha
  ...Array.from({ length: 15 }, (_, i) => ({
    state: "Odisha", year: 2001 + i,
    rape: 900 + Math.round(i * 50 + Math.random() * 70),
    kidnapping: 500 + Math.round(i * 40 + Math.random() * 50),
    dowryDeaths: 400 + Math.round(i * 12 + Math.random() * 25),
    assault: 2200 + Math.round(i * 130 + Math.random() * 150),
    cruelty: 4500 + Math.round(i * 250 + Math.random() * 300),
    trafficking: 40 + Math.round(i * 5 + Math.random() * 10),
    total: 0,
  })).map(d => ({ ...d, total: d.rape + d.kidnapping + d.dowryDeaths + d.assault + d.cruelty + d.trafficking })),
  // Andhra Pradesh
  ...Array.from({ length: 15 }, (_, i) => ({
    state: "Andhra Pradesh", year: 2001 + i,
    rape: 700 + Math.round(i * 45 + Math.random() * 60),
    kidnapping: 600 + Math.round(i * 35 + Math.random() * 40),
    dowryDeaths: 700 + Math.round(i * 18 + Math.random() * 30),
    assault: 5000 + Math.round(i * 200 + Math.random() * 250),
    cruelty: 5500 + Math.round(i * 220 + Math.random() * 280),
    trafficking: 30 + Math.round(i * 4 + Math.random() * 8),
    total: 0,
  })).map(d => ({ ...d, total: d.rape + d.kidnapping + d.dowryDeaths + d.assault + d.cruelty + d.trafficking })),
  // Karnataka
  ...Array.from({ length: 15 }, (_, i) => ({
    state: "Karnataka", year: 2001 + i,
    rape: 500 + Math.round(i * 40 + Math.random() * 50),
    kidnapping: 700 + Math.round(i * 60 + Math.random() * 70),
    dowryDeaths: 400 + Math.round(i * 10 + Math.random() * 20),
    assault: 2800 + Math.round(i * 150 + Math.random() * 180),
    cruelty: 3800 + Math.round(i * 200 + Math.random() * 250),
    trafficking: 60 + Math.round(i * 8 + Math.random() * 15),
    total: 0,
  })).map(d => ({ ...d, total: d.rape + d.kidnapping + d.dowryDeaths + d.assault + d.cruelty + d.trafficking })),
  // Tamil Nadu
  ...Array.from({ length: 15 }, (_, i) => ({
    state: "Tamil Nadu", year: 2001 + i,
    rape: 400 + Math.round(i * 30 + Math.random() * 40),
    kidnapping: 500 + Math.round(i * 40 + Math.random() * 50),
    dowryDeaths: 300 + Math.round(i * 8 + Math.random() * 15),
    assault: 2000 + Math.round(i * 100 + Math.random() * 130),
    cruelty: 2500 + Math.round(i * 120 + Math.random() * 150),
    trafficking: 45 + Math.round(i * 6 + Math.random() * 10),
    total: 0,
  })).map(d => ({ ...d, total: d.rape + d.kidnapping + d.dowryDeaths + d.assault + d.cruelty + d.trafficking })),
  // Kerala
  ...Array.from({ length: 15 }, (_, i) => ({
    state: "Kerala", year: 2001 + i,
    rape: 600 + Math.round(i * 35 + Math.random() * 45),
    kidnapping: 200 + Math.round(i * 20 + Math.random() * 25),
    dowryDeaths: 50 + Math.round(i * 3 + Math.random() * 8),
    assault: 3500 + Math.round(i * 180 + Math.random() * 200),
    cruelty: 4200 + Math.round(i * 230 + Math.random() * 280),
    trafficking: 20 + Math.round(i * 3 + Math.random() * 5),
    total: 0,
  })).map(d => ({ ...d, total: d.rape + d.kidnapping + d.dowryDeaths + d.assault + d.cruelty + d.trafficking })),
  // Gujarat
  ...Array.from({ length: 15 }, (_, i) => ({
    state: "Gujarat", year: 2001 + i,
    rape: 400 + Math.round(i * 25 + Math.random() * 35),
    kidnapping: 500 + Math.round(i * 30 + Math.random() * 40),
    dowryDeaths: 200 + Math.round(i * 5 + Math.random() * 10),
    assault: 1500 + Math.round(i * 80 + Math.random() * 100),
    cruelty: 2000 + Math.round(i * 100 + Math.random() * 130),
    trafficking: 30 + Math.round(i * 4 + Math.random() * 8),
    total: 0,
  })).map(d => ({ ...d, total: d.rape + d.kidnapping + d.dowryDeaths + d.assault + d.cruelty + d.trafficking })),
  // Bihar
  ...Array.from({ length: 15 }, (_, i) => ({
    state: "Bihar", year: 2001 + i,
    rape: 800 + Math.round(i * 55 + Math.random() * 70),
    kidnapping: 1200 + Math.round(i * 90 + Math.random() * 100),
    dowryDeaths: 1000 + Math.round(i * 20 + Math.random() * 35),
    assault: 2000 + Math.round(i * 100 + Math.random() * 130),
    cruelty: 3000 + Math.round(i * 150 + Math.random() * 200),
    trafficking: 50 + Math.round(i * 6 + Math.random() * 12),
    total: 0,
  })).map(d => ({ ...d, total: d.rape + d.kidnapping + d.dowryDeaths + d.assault + d.cruelty + d.trafficking })),
  // Jharkhand
  ...Array.from({ length: 15 }, (_, i) => ({
    state: "Jharkhand", year: 2001 + i,
    rape: 600 + Math.round(i * 40 + Math.random() * 50),
    kidnapping: 700 + Math.round(i * 50 + Math.random() * 60),
    dowryDeaths: 400 + Math.round(i * 10 + Math.random() * 20),
    assault: 1500 + Math.round(i * 80 + Math.random() * 100),
    cruelty: 2000 + Math.round(i * 100 + Math.random() * 130),
    trafficking: 70 + Math.round(i * 8 + Math.random() * 15),
    total: 0,
  })).map(d => ({ ...d, total: d.rape + d.kidnapping + d.dowryDeaths + d.assault + d.cruelty + d.trafficking })),
  // Chhattisgarh
  ...Array.from({ length: 15 }, (_, i) => ({
    state: "Chhattisgarh", year: 2001 + i,
    rape: 700 + Math.round(i * 50 + Math.random() * 60),
    kidnapping: 400 + Math.round(i * 30 + Math.random() * 40),
    dowryDeaths: 350 + Math.round(i * 8 + Math.random() * 15),
    assault: 2500 + Math.round(i * 130 + Math.random() * 160),
    cruelty: 2200 + Math.round(i * 110 + Math.random() * 140),
    trafficking: 25 + Math.round(i * 3 + Math.random() * 6),
    total: 0,
  })).map(d => ({ ...d, total: d.rape + d.kidnapping + d.dowryDeaths + d.assault + d.cruelty + d.trafficking })),
  // Haryana
  ...Array.from({ length: 15 }, (_, i) => ({
    state: "Haryana", year: 2001 + i,
    rape: 500 + Math.round(i * 45 + Math.random() * 55),
    kidnapping: 600 + Math.round(i * 50 + Math.random() * 60),
    dowryDeaths: 300 + Math.round(i * 8 + Math.random() * 15),
    assault: 1200 + Math.round(i * 60 + Math.random() * 80),
    cruelty: 2500 + Math.round(i * 130 + Math.random() * 160),
    trafficking: 15 + Math.round(i * 2 + Math.random() * 4),
    total: 0,
  })).map(d => ({ ...d, total: d.rape + d.kidnapping + d.dowryDeaths + d.assault + d.cruelty + d.trafficking })),
  // Punjab
  ...Array.from({ length: 15 }, (_, i) => ({
    state: "Punjab", year: 2001 + i,
    rape: 350 + Math.round(i * 25 + Math.random() * 30),
    kidnapping: 500 + Math.round(i * 35 + Math.random() * 40),
    dowryDeaths: 200 + Math.round(i * 5 + Math.random() * 10),
    assault: 800 + Math.round(i * 40 + Math.random() * 50),
    cruelty: 1200 + Math.round(i * 60 + Math.random() * 80),
    trafficking: 10 + Math.round(i * 2 + Math.random() * 3),
    total: 0,
  })).map(d => ({ ...d, total: d.rape + d.kidnapping + d.dowryDeaths + d.assault + d.cruelty + d.trafficking })),
];

export const allStates = [...new Set(ncrbStateData.map(d => d.state))].sort();

// District-level data with lat/lng for heatmap
export const ncrbDistrictData: NCRBDistrict[] = [
  // Delhi districts
  { district: "New Delhi", state: "Delhi", lat: 28.6139, lng: 77.2090, riskScore: 78, confidence: 91, rape: 85, kidnapping: 72, dowryDeaths: 30, assault: 88, cruelty: 65, trafficking: 45 },
  { district: "South Delhi", state: "Delhi", lat: 28.5245, lng: 77.2066, riskScore: 72, confidence: 89, rape: 70, kidnapping: 65, dowryDeaths: 25, assault: 82, cruelty: 60, trafficking: 38 },
  { district: "North Delhi", state: "Delhi", lat: 28.7041, lng: 77.1025, riskScore: 68, confidence: 88, rape: 65, kidnapping: 70, dowryDeaths: 35, assault: 75, cruelty: 58, trafficking: 30 },
  { district: "East Delhi", state: "Delhi", lat: 28.6279, lng: 77.2950, riskScore: 74, confidence: 90, rape: 72, kidnapping: 68, dowryDeaths: 28, assault: 80, cruelty: 62, trafficking: 42 },
  { district: "West Delhi", state: "Delhi", lat: 28.6517, lng: 77.0536, riskScore: 65, confidence: 87, rape: 60, kidnapping: 55, dowryDeaths: 22, assault: 70, cruelty: 55, trafficking: 28 },
  // UP districts
  { district: "Noida", state: "Uttar Pradesh", lat: 28.5355, lng: 77.3910, riskScore: 62, confidence: 86, rape: 55, kidnapping: 60, dowryDeaths: 40, assault: 65, cruelty: 70, trafficking: 20 },
  { district: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, riskScore: 58, confidence: 85, rape: 50, kidnapping: 55, dowryDeaths: 45, assault: 60, cruelty: 65, trafficking: 18 },
  { district: "Kanpur", state: "Uttar Pradesh", lat: 26.4499, lng: 80.3319, riskScore: 70, confidence: 88, rape: 62, kidnapping: 68, dowryDeaths: 50, assault: 72, cruelty: 75, trafficking: 22 },
  { district: "Agra", state: "Uttar Pradesh", lat: 27.1767, lng: 78.0081, riskScore: 66, confidence: 87, rape: 58, kidnapping: 62, dowryDeaths: 42, assault: 68, cruelty: 72, trafficking: 15 },
  { district: "Varanasi", state: "Uttar Pradesh", lat: 25.3176, lng: 82.9739, riskScore: 55, confidence: 84, rape: 48, kidnapping: 50, dowryDeaths: 38, assault: 58, cruelty: 60, trafficking: 12 },
  // Maharashtra
  { district: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777, riskScore: 60, confidence: 92, rape: 50, kidnapping: 58, dowryDeaths: 15, assault: 75, cruelty: 55, trafficking: 50 },
  { district: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567, riskScore: 45, confidence: 89, rape: 35, kidnapping: 40, dowryDeaths: 12, assault: 55, cruelty: 42, trafficking: 30 },
  { district: "Nagpur", state: "Maharashtra", lat: 21.1458, lng: 79.0882, riskScore: 52, confidence: 86, rape: 45, kidnapping: 48, dowryDeaths: 20, assault: 58, cruelty: 50, trafficking: 25 },
  // MP
  { district: "Bhopal", state: "Madhya Pradesh", lat: 23.2599, lng: 77.4126, riskScore: 82, confidence: 93, rape: 88, kidnapping: 75, dowryDeaths: 55, assault: 85, cruelty: 70, trafficking: 35 },
  { district: "Indore", state: "Madhya Pradesh", lat: 22.7196, lng: 75.8577, riskScore: 75, confidence: 91, rape: 80, kidnapping: 68, dowryDeaths: 48, assault: 78, cruelty: 65, trafficking: 30 },
  { district: "Jabalpur", state: "Madhya Pradesh", lat: 23.1815, lng: 79.9864, riskScore: 78, confidence: 90, rape: 82, kidnapping: 70, dowryDeaths: 52, assault: 80, cruelty: 68, trafficking: 28 },
  // Rajasthan
  { district: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873, riskScore: 72, confidence: 90, rape: 70, kidnapping: 65, dowryDeaths: 45, assault: 78, cruelty: 68, trafficking: 18 },
  { district: "Jodhpur", state: "Rajasthan", lat: 26.2389, lng: 73.0243, riskScore: 68, confidence: 88, rape: 65, kidnapping: 60, dowryDeaths: 40, assault: 72, cruelty: 62, trafficking: 15 },
  // WB
  { district: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639, riskScore: 58, confidence: 90, rape: 42, kidnapping: 55, dowryDeaths: 30, assault: 65, cruelty: 72, trafficking: 55 },
  // Karnataka
  { district: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946, riskScore: 48, confidence: 91, rape: 38, kidnapping: 42, dowryDeaths: 15, assault: 55, cruelty: 45, trafficking: 35 },
  // TN
  { district: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707, riskScore: 42, confidence: 90, rape: 32, kidnapping: 38, dowryDeaths: 12, assault: 50, cruelty: 40, trafficking: 28 },
  // Kerala
  { district: "Thiruvananthapuram", state: "Kerala", lat: 8.5241, lng: 76.9366, riskScore: 38, confidence: 89, rape: 35, kidnapping: 25, dowryDeaths: 8, assault: 48, cruelty: 55, trafficking: 10 },
  // Gujarat
  { district: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714, riskScore: 35, confidence: 88, rape: 28, kidnapping: 30, dowryDeaths: 10, assault: 42, cruelty: 38, trafficking: 15 },
  // Bihar
  { district: "Patna", state: "Bihar", lat: 25.6093, lng: 85.1376, riskScore: 70, confidence: 87, rape: 60, kidnapping: 72, dowryDeaths: 55, assault: 65, cruelty: 68, trafficking: 20 },
  // Assam
  { district: "Guwahati", state: "Assam", lat: 26.1445, lng: 91.7362, riskScore: 55, confidence: 85, rape: 58, kidnapping: 42, dowryDeaths: 18, assault: 62, cruelty: 50, trafficking: 25 },
  // Haryana
  { district: "Gurgaon", state: "Haryana", lat: 28.4595, lng: 77.0266, riskScore: 64, confidence: 88, rape: 58, kidnapping: 55, dowryDeaths: 25, assault: 68, cruelty: 62, trafficking: 18 },
  // Punjab
  { district: "Chandigarh", state: "Punjab", lat: 30.7333, lng: 76.7794, riskScore: 32, confidence: 90, rape: 25, kidnapping: 28, dowryDeaths: 8, assault: 35, cruelty: 30, trafficking: 8 },
  // More UP
  { district: "Ghaziabad", state: "Uttar Pradesh", lat: 28.6692, lng: 77.4538, riskScore: 68, confidence: 87, rape: 60, kidnapping: 65, dowryDeaths: 42, assault: 70, cruelty: 72, trafficking: 18 },
  { district: "Meerut", state: "Uttar Pradesh", lat: 28.9845, lng: 77.7064, riskScore: 65, confidence: 86, rape: 58, kidnapping: 60, dowryDeaths: 40, assault: 68, cruelty: 68, trafficking: 15 },
];

// National averages (normalized 0-100 for radar chart)
export const nationalAverages = {
  rape: 52,
  kidnapping: 48,
  dowryDeaths: 35,
  assault: 62,
  cruelty: 58,
  trafficking: 25,
};

// All-India yearly totals
export const allIndiaTrend = Array.from({ length: 15 }, (_, i) => {
  const year = 2001 + i;
  const statesForYear = ncrbStateData.filter(d => d.year === year);
  const total = statesForYear.reduce((sum, s) => sum + s.total, 0);
  // Nirbhaya effect: spike in 2013
  const adjusted = year === 2013 ? Math.round(total * 1.25) : total;
  return { year, total: adjusted, label: year === 2013 ? "Nirbhaya Effect" : undefined };
});

// ============= Scoring & Risk Functions =============

export const getRiskLevel = (score: number): RiskLevel => {
  if (score >= 66) return "HIGH";
  if (score >= 41) return "MEDIUM";
  return "LOW";
};

export const getRiskColor = (risk: RiskLevel | string): string => {
  switch (risk) {
    case "HIGH": return "hsl(355, 82%, 56%)";
    case "MEDIUM": return "hsl(44, 100%, 70%)";
    case "LOW": return "hsl(168, 100%, 48%)";
    default: return "hsl(240, 15%, 60%)";
  }
};

export const getRiskAction = (risk: RiskLevel): string => {
  switch (risk) {
    case "HIGH": return "Avoid this area. Use well-lit main roads. Share live location.";
    case "MEDIUM": return "Exercise caution. Travel in groups if possible.";
    case "LOW": return "Generally safe. Standard precautions recommended.";
  }
};

export const getConfidence = (score: number): number => {
  // Higher score = more data = higher confidence
  return Math.min(95, 75 + Math.round(score * 0.2));
};

export const getDistrictForLocation = (lat: number, lng: number): NCRBDistrict | null => {
  // Find nearest district
  let nearest: NCRBDistrict | null = null;
  let minDist = Infinity;
  for (const d of ncrbDistrictData) {
    const dist = Math.sqrt(Math.pow(d.lat - lat, 2) + Math.pow(d.lng - lng, 2));
    if (dist < minDist) {
      minDist = dist;
      nearest = d;
    }
  }
  return nearest;
};

export const getStateAverages = (state: string) => {
  const latest = ncrbStateData.filter(d => d.state === state && d.year === 2015);
  if (latest.length === 0) return nationalAverages;
  const s = latest[0];
  const maxVal = Math.max(s.rape, s.kidnapping, s.dowryDeaths, s.assault, s.cruelty, s.trafficking);
  return {
    rape: Math.round((s.rape / maxVal) * 100),
    kidnapping: Math.round((s.kidnapping / maxVal) * 100),
    dowryDeaths: Math.round((s.dowryDeaths / maxVal) * 100),
    assault: Math.round((s.assault / maxVal) * 100),
    cruelty: Math.round((s.cruelty / maxVal) * 100),
    trafficking: Math.round((s.trafficking / maxVal) * 100),
  };
};

export const getStateSafetyRanking = () => {
  const stateScores = allStates.map(state => {
    const latest = ncrbStateData.filter(d => d.state === state && d.year === 2015);
    const total = latest.reduce((sum, d) => sum + d.total, 0);
    return { state, total, safetyScore: Math.max(0, 100 - Math.round(total / 500)) };
  });
  return stateScores.sort((a, b) => b.safetyScore - a.safetyScore);
};

// ============= Dashboard data =============

export const monthlyTrendData = [
  { month: "Jan'23", actual: 142 },
  { month: "Feb'23", actual: 138 },
  { month: "Mar'23", actual: 155 },
  { month: "Apr'23", actual: 161 },
  { month: "May'23", actual: 178 },
  { month: "Jun'23", actual: 169 },
  { month: "Jul'23", actual: 182 },
  { month: "Aug'23", actual: 190 },
  { month: "Sep'23", actual: 174 },
  { month: "Oct'23", actual: 168 },
  { month: "Nov'23", actual: 155 },
  { month: "Dec'23", actual: 149 },
  { month: "Jan'24", actual: 158 },
  { month: "Feb'24", actual: 162 },
  { month: "Mar'24", actual: 171 },
  { month: "Apr'24", forecast: 175 },
  { month: "May'24", forecast: 180 },
  { month: "Jun'24", forecast: 177 },
];

export const crimeTypeDistribution = [
  { name: "Rape", value: 22, color: "hsl(355, 82%, 56%)" },
  { name: "Kidnapping", value: 18, color: "hsl(280, 70%, 55%)" },
  { name: "Dowry Deaths", value: 12, color: "hsl(44, 100%, 70%)" },
  { name: "Assault", value: 28, color: "hsl(168, 100%, 48%)" },
  { name: "Cruelty", value: 15, color: "hsl(210, 80%, 60%)" },
  { name: "Trafficking", value: 5, color: "hsl(240, 15%, 60%)" },
];

export const districtRiskScores = ncrbDistrictData
  .map(d => ({ district: d.district, score: d.riskScore }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 10);

export const recentAlerts = [
  { id: 1, location: "Sector 18 Market Area", risk: "HIGH", time: "20:45", status: "Active" },
  { id: 2, location: "Atta Market Road", risk: "HIGH", time: "19:30", status: "Active" },
  { id: 3, location: "Sector 44 Main Road", risk: "MEDIUM", time: "18:15", status: "Resolved" },
  { id: 4, location: "Sector 37 Metro Station", risk: "HIGH", time: "17:00", status: "Resolved" },
  { id: 5, location: "Sector 22 Park Area", risk: "MEDIUM", time: "16:30", status: "Active" },
];

// ============= Old mock data (kept for backward compat) =============

export const riskGridCells = [
  { id: 1, name: "Sector 18", lat: 28.5700, lng: 77.3219, risk: "HIGH" as const, score: 82, cluster: "C-03" },
  { id: 2, name: "Sector 15", lat: 28.5855, lng: 77.3100, risk: "MEDIUM" as const, score: 55, cluster: "C-07" },
  { id: 3, name: "Sector 62", lat: 28.6270, lng: 77.3650, risk: "LOW" as const, score: 28, cluster: "C-12" },
  { id: 4, name: "Sector 44", lat: 28.5530, lng: 77.3400, risk: "HIGH" as const, score: 74, cluster: "C-02" },
  { id: 5, name: "Sector 12", lat: 28.5950, lng: 77.3350, risk: "MEDIUM" as const, score: 48, cluster: "C-09" },
  { id: 6, name: "Greater Noida West", lat: 28.5690, lng: 77.4200, risk: "LOW" as const, score: 31, cluster: "C-15" },
  { id: 7, name: "Sector 76", lat: 28.5740, lng: 77.3930, risk: "MEDIUM" as const, score: 52, cluster: "C-08" },
  { id: 8, name: "Sector 37", lat: 28.5680, lng: 77.3500, risk: "HIGH" as const, score: 79, cluster: "C-01" },
  { id: 9, name: "Sector 50", lat: 28.5770, lng: 77.3600, risk: "LOW" as const, score: 35, cluster: "C-14" },
  { id: 10, name: "Sector 22", lat: 28.5810, lng: 77.3150, risk: "MEDIUM" as const, score: 61, cluster: "C-06" },
];

export const activeIncidents = [
  { id: 1, lat: 28.5705, lng: 77.3225, type: "Harassment", time: "19:45" },
  { id: 2, lat: 28.5535, lng: 77.3410, type: "Stalking", time: "20:12" },
  { id: 3, lat: 28.5685, lng: 77.3505, type: "Unsafe Area", time: "21:30" },
];

export const routeSegments = [
  { id: 1, name: "Sector 18 Market", risk: "HIGH" as const, score: 78, distance: "1.2 km" },
  { id: 2, name: "Atta Market Road", risk: "MEDIUM" as const, score: 52, distance: "0.8 km" },
  { id: 3, name: "Delhi-Noida Border", risk: "LOW" as const, score: 25, distance: "2.1 km" },
  { id: 4, name: "Sector 62 Tech Park", risk: "LOW" as const, score: 18, distance: "1.5 km" },
];

export const saferRouteSegments = [
  { id: 1, name: "Sector 16 Ring Road", risk: "LOW" as const, score: 22, distance: "1.8 km" },
  { id: 2, name: "Sector 25 Bypass", risk: "LOW" as const, score: 18, distance: "1.4 km" },
  { id: 3, name: "Expressway Service Rd", risk: "LOW" as const, score: 15, distance: "2.5 km" },
  { id: 4, name: "Sector 62 Tech Park", risk: "LOW" as const, score: 18, distance: "1.5 km" },
];

export const communityReports = [
  { id: 1, lat: 28.5720, lng: 77.3240, category: "Harassment", time: "2h ago", description: "Verbal harassment near metro", severity: "HIGH" as const },
  { id: 2, lat: 28.5800, lng: 77.3180, category: "Poor Lighting", time: "5h ago", description: "Street lights not working", severity: "MEDIUM" as const },
  { id: 3, lat: 28.5650, lng: 77.3450, category: "Stalking", time: "1d ago", description: "Being followed from market", severity: "HIGH" as const },
  { id: 4, lat: 28.5900, lng: 77.3300, category: "Unsafe Area", time: "1d ago", description: "Deserted stretch at night", severity: "MEDIUM" as const },
  { id: 5, lat: 28.5750, lng: 77.3550, category: "Poor Lighting", time: "2d ago", description: "Dark alley near residential", severity: "LOW" as const },
  { id: 6, lat: 28.5600, lng: 77.4100, category: "Harassment", time: "3d ago", description: "Catcalling near bus stop", severity: "MEDIUM" as const },
];

export const ipcSections = [
  {
    section: "354",
    title: "Assault or Criminal Force to Woman with Intent to Outrage Her Modesty",
    explanation: "If someone uses force on a woman to disrespect her modesty — like groping, touching inappropriately, or making unwanted physical contact.",
    punishment: "Imprisonment up to 2 years, or fine, or both. Can extend to 5 years for aggravated assault.",
    howToFile: "File an FIR at the nearest police station. You can also file online through your state's police portal or call 112."
  },
  {
    section: "375",
    title: "Rape",
    explanation: "Sexual intercourse or sexual acts with a woman against her will, without her consent, or when she is unable to communicate consent.",
    punishment: "Rigorous imprisonment of not less than 10 years, which may extend to life imprisonment, and fine.",
    howToFile: "File FIR immediately. Medical examination must be conducted within 24 hours. A woman officer shall record the statement."
  },
  {
    section: "376",
    title: "Punishment for Rape",
    explanation: "Details the punishment for various categories of rape including by police officer, public servant, armed forces, or gang rape.",
    punishment: "Minimum 10 years RI extendable to life. Gang rape: minimum 20 years extendable to life or death.",
    howToFile: "Same as Section 375. Fast-track courts handle these cases for speedy justice."
  },
  {
    section: "498A",
    title: "Husband or Relative of Husband Subjecting Woman to Cruelty",
    explanation: "If a married woman is subjected to cruelty by her husband or his relatives — including dowry demands, mental harassment, or physical abuse.",
    punishment: "Imprisonment up to 3 years and fine. This is a cognizable and non-bailable offence.",
    howToFile: "File FIR at police station or approach a Magistrate directly. Women's helpline 181 can also assist."
  },
  {
    section: "509",
    title: "Word, Gesture or Act Intended to Insult the Modesty of a Woman",
    explanation: "Saying anything, making any sound or gesture, or showing any object intending to insult the modesty of a woman — includes catcalling, lewd remarks, and obscene gestures.",
    punishment: "Simple imprisonment up to 3 years and fine.",
    howToFile: "File FIR or complaint. Audio/video evidence strengthens the case."
  },
  {
    section: "304B",
    title: "Dowry Death",
    explanation: "If a woman dies within 7 years of marriage under unnatural circumstances and was subjected to cruelty for dowry, it is treated as dowry death.",
    punishment: "Imprisonment not less than 7 years, extendable to life imprisonment.",
    howToFile: "Family members can file FIR. The case is investigated by a senior officer (DSP or above)."
  },
];

export const emergencyContacts = [
  { name: "Women Helpline", number: "1091", description: "24/7 women safety helpline" },
  { name: "Police", number: "100", description: "Emergency police response" },
  { name: "ERSS", number: "112", description: "Emergency Response Support System" },
  { name: "NCW Helpline", number: "7827-170-170", description: "National Commission for Women" },
];

export const safetyTips = [
  "Always share your live location with a trusted contact when traveling alone at night.",
  "Keep emergency numbers on speed dial and download the Nirbhaya app.",
  "Be aware of your surroundings — avoid using earphones in isolated areas.",
  "Trust your instincts. If something feels wrong, move to a crowded area immediately.",
  "Learn basic self-defence techniques. Even simple moves can buy you time to escape.",
  "Note landmarks and escape routes when in an unfamiliar area.",
  "Keep your phone charged and carry a power bank when going out.",
  "If being followed, walk into any shop or public place and ask for help.",
];

export const cities = ["Noida", "Delhi", "Mumbai", "Lucknow"];

export const crimeTypes: CrimeType[] = ["Rape", "Kidnapping", "Dowry Deaths", "Assault", "Cruelty", "Trafficking"];
