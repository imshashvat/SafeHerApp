import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, Shield, MapPin, Target, Cpu, BarChart3, Brain } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  ReferenceLine, Label, Area, AreaChart,
} from "recharts";
import { getRiskColor } from "@/data/mockData";
import { useEffect, useRef, useState } from "react";
import { api } from "@/services/api";

const useCountUp = (end: number, duration = 2000) => {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (end === 0) { setValue(0); return; }
    const s = performance.now();
    let raf: number;
    const anim = (n: number) => {
      const p = Math.min((n - s) / duration, 1);
      setValue(Math.round(p * end));
      if (p < 1) raf = requestAnimationFrame(anim);
    };
    raf = requestAnimationFrame(anim);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);
  return { value, ref };
};

// ── Confusion Matrix component (from user's ML training) ────────────
const ConfusionMatrix = ({ data, title, normalized }: { data: number[][]; title: string; normalized?: boolean }) => {
  const labels = ["SAFE", "MODERATE", "HIGH RISK"];
  const maxVal = Math.max(...data.flat());
  return (
    <div>
      <h4 className="font-heading text-xs font-semibold text-foreground mb-3 text-center">{title}</h4>
      <div className="flex">
        <div className="flex flex-col justify-around pr-2 text-[10px] text-muted-foreground">
          {labels.map(l => <span key={l} className="h-10 flex items-center">{l}</span>)}
        </div>
        <div className="flex-1">
          {data.map((row, i) => (
            <div key={i} className="flex gap-0.5 mb-0.5">
              {row.map((v, j) => {
                const intensity = normalized ? v : v / maxVal;
                const bg = i === j
                  ? `rgba(0, 100, 80, ${0.15 + intensity * 0.85})`
                  : `rgba(0, 80, 60, ${0.05 + intensity * 0.15})`;
                return (
                  <div key={j} className="flex-1 h-10 flex items-center justify-center rounded text-xs font-bold" style={{ backgroundColor: bg, color: intensity > 0.5 ? "#fff" : "hsl(240,15%,60%)" }}>
                    {normalized ? v.toFixed(2) : v}
                  </div>
                );
              })}
            </div>
          ))}
          <div className="flex gap-0.5 mt-1">
            {labels.map(l => <span key={l} className="flex-1 text-center text-[9px] text-muted-foreground">{l}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Correlation Heatmap ──────────────────────────────────────────────
const CorrelationHeatmap = () => {
  const features = ["rape", "kidnapping", "dowry", "assault", "insult", "cruelty", "year"];
  // Real correlation values from the user's ML training
  const matrix = [
    [1.00, 0.77, 0.65, 0.90, 0.41, 0.75, 0.11],
    [0.77, 1.00, 0.82, 0.68, 0.24, 0.69, 0.05],
    [0.65, 0.82, 1.00, 0.60, 0.24, 0.54, 0.03],
    [0.90, 0.68, 0.60, 1.00, 0.57, 0.74, 0.11],
    [0.41, 0.24, 0.24, 0.57, 1.00, 0.49, 0.00],
    [0.75, 0.69, 0.54, 0.74, 0.49, 1.00, 0.10],
    [0.11, 0.05, 0.03, 0.11, 0.00, 0.10, 1.00],
  ];
  return (
    <div>
      <h4 className="font-heading text-xs font-semibold text-foreground mb-3 text-center">Feature Correlation Matrix</h4>
      <div className="flex">
        <div className="flex flex-col justify-around pr-1 text-[9px] text-muted-foreground">
          {features.map(f => <span key={f} className="h-7 flex items-center">{f}</span>)}
        </div>
        <div className="flex-1">
          {matrix.map((row, i) => (
            <div key={i} className="flex gap-px mb-px">
              {row.map((v, j) => (
                <div key={j} className="flex-1 h-7 flex items-center justify-center rounded-sm text-[9px] font-semibold"
                  style={{
                    backgroundColor: `rgba(180, 30, 30, ${v * 0.9})`,
                    color: v > 0.5 ? "#fff" : "hsl(240,15%,60%)"
                  }}>
                  {i <= j ? v.toFixed(2) : ""}
                </div>
              ))}
            </div>
          ))}
          <div className="flex gap-px mt-1">
            {features.map(f => <span key={f} className="flex-1 text-center text-[8px] text-muted-foreground" style={{ writingMode: "vertical-rl" }}>{f}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [stateRanking, setStateRanking] = useState<any[]>([]);
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [crimeTypes, setCrimeTypes] = useState<any>(null);
  const [totalCrimes, setTotalCrimes] = useState(0);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [trendsRes, rankingsRes, crimeTypesRes, modelRes] = await Promise.all([
        api.getCrimeTrends(),
        api.getStateRankings(36),
        api.getCrimeTypes(),
        api.getModelInfo(),
      ]);

      if (trendsRes?.trends?.length > 0) {
        setTrendData(trendsRes.trends);
        setTotalCrimes(trendsRes.trends.reduce((s: number, t: any) => s + (t.total_crimes || 0), 0));
      }
      if (rankingsRes?.rankings) setStateRanking(rankingsRes.rankings);
      if (crimeTypesRes?.crime_types) setCrimeTypes(crimeTypesRes.crime_types);
      if (modelRes) setModelInfo(modelRes);
    } catch (err) { console.error("Dashboard load error:", err); }
    finally { setLoading(false); }
  };

  const stat1 = useCountUp(Math.round(totalCrimes / 100000) || 31, 2000);
  const stat2 = useCountUp(1032, 1500);
  const stat3 = useCountUp(36, 1200);

  // Build real crime type chart data from backend
  const crimeTypeColors: Record<string, string> = {
    cruelty: "#2ecc71", assault: "#e74c3c", rape: "#e67e22",
    kidnapping: "#3498db", insult: "#9b59b6", dowry: "#1abc9c",
  };
  const crimeTypeChartData = crimeTypes ? Object.entries(crimeTypes)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value: value as number, color: crimeTypeColors[name] || "#888" }))
    .sort((a, b) => b.value - a.value) : [];

  const crimeTypePieData = crimeTypeChartData.map(c => ({
    name: c.name, value: Math.round((c.value / totalCrimes) * 100), color: c.color,
  }));

  // Top 15 states for bar chart
  const top15States = stateRanking.slice(0, 15).map(s => ({
    state: s.state?.length > 14 ? s.state.slice(0, 14) + "…" : s.state,
    total: s.total_crimes,
    color: s.risk_code === 2 ? "#e74c3c" : s.risk_code === 1 ? "#f39c12" : "#2ecc71",
  }));

  // Feature importance from model info (LightGBM)
  const featureImportance = modelInfo?.models?.LightGBM?.feature_importance
    ? Object.entries(modelInfo.models.LightGBM.feature_importance)
      .map(([name, score]) => ({ name, score: score as number }))
      .sort((a, b) => b.score - a.score)
    : [];

  // Risk label distribution — real data from backend model-info endpoint
  const labelDist = modelInfo?.label_distribution || {};
  const riskDistData = [
    { name: "SAFE (0)", value: labelDist.SAFE || 0, color: "#2ecc71" },
    { name: "MODERATE (1)", value: labelDist.MODERATE || 0, color: "#f39c12" },
    { name: "HIGH RISK (2)", value: labelDist.HIGH_RISK || 0, color: "#e74c3c" },
  ];

  // Confusion matrix data from user's ML training images
  const confusionRaw = [[726, 2, 0], [1, 725, 2], [0, 10, 719]];
  const confusionNorm = [[1.00, 0.00, 0.00], [0.00, 1.00, 0.00], [0.00, 0.01, 0.99]];

  if (loading) {
    return (
      <div className="min-h-screen pt-16 bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">Loading real NCRB data from backend…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">Crime Intelligence Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real NCRB Data (2001–2015) · {stateRanking.length} States & UTs · {modelInfo?.districts_cached || 1032} Districts
            {modelInfo?.best_accuracy && (
              <span className="ml-2 text-secondary font-semibold">
                · LightGBM {(modelInfo.best_accuracy * 100).toFixed(1)}% F1
              </span>
            )}
          </p>
        </div>

        {/* ── KPI Cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Crimes (Lakh)", value: `${stat1.value}L+`, ref: stat1.ref, icon: Target, color: "text-primary" },
            { label: "Districts Analyzed", value: stat2.value.toString(), ref: stat2.ref, icon: MapPin, color: "text-secondary" },
            { label: "Highest Risk", value: stateRanking[0]?.state || "—", ref: null, icon: AlertTriangle, color: "text-primary" },
            { label: "States & UTs Covered", value: stat3.value.toString(), ref: stat3.ref, icon: Shield, color: "text-secondary" },
          ].map((k, i) => (
            <motion.div key={i} ref={k.ref} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card border border-border rounded-lg p-5">
              <k.icon className={`w-5 h-5 ${k.color} mb-3`} />
              <div className={`font-heading text-2xl font-bold ${k.color}`}>{k.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── ML Model Performance ───────────────────────────────────── */}
        {modelInfo && (
          <div className="bg-card border border-border rounded-lg p-5 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                <Cpu className="w-4 h-4 text-secondary" /> ML Model Performance
              </h3>
              <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-full font-semibold">Best: {modelInfo.best_model}</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="font-heading text-xl font-bold text-secondary">{(modelInfo.best_accuracy * 100).toFixed(1)}%</div>
                <div className="text-[10px] text-muted-foreground uppercase">Accuracy</div>
              </div>
              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="font-heading text-xl font-bold text-foreground">{modelInfo.districts_cached}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Districts</div>
              </div>
              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="font-heading text-xl font-bold text-foreground">{modelInfo.states_cached}</div>
                <div className="text-[10px] text-muted-foreground uppercase">States & UTs</div>
              </div>
              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="font-heading text-xl font-bold" style={{ color: "#2ecc71" }}>{riskDistData[0].value}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Safe Districts</div>
              </div>
              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="font-heading text-xl font-bold text-primary">{riskDistData[2].value}</div>
                <div className="text-[10px] text-muted-foreground uppercase">High Risk</div>
              </div>
            </div>

            {/* Model comparison table */}
            {modelInfo.models && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border">
                    <th className="text-left text-muted-foreground pb-2 font-medium">Model</th>
                    <th className="text-right text-muted-foreground pb-2 font-medium">CV Accuracy</th>
                    <th className="text-right text-muted-foreground pb-2 font-medium">Test Accuracy</th>
                  </tr></thead>
                  <tbody>
                    {Object.entries(modelInfo.models)
                      .sort(([, a]: any, [, b]: any) => (b.test_accuracy || 0) - (a.test_accuracy || 0))
                      .map(([name, data]: any) => (
                        <tr key={name} className={`border-b border-border/50 ${name === modelInfo.best_model ? "bg-secondary/5" : ""}`}>
                          <td className="py-2 text-foreground flex items-center gap-1.5">
                            {name === modelInfo.best_model && <span className="text-secondary">★</span>}
                            {name}
                            {name === modelInfo.best_model && <span className="text-[9px] bg-secondary/20 text-secondary px-1 rounded ml-1">BEST</span>}
                          </td>
                          <td className="py-2 text-right text-muted-foreground">{((data.cv_mean || 0) * 100).toFixed(1)}%</td>
                          <td className={`py-2 text-right font-bold ${name === modelInfo.best_model ? "text-secondary" : "text-foreground"}`}>
                            {((data.test_accuracy || 0) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Row: Confusion Matrix + Risk Distribution ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-5">
            <ConfusionMatrix data={confusionRaw} title="Confusion Matrix — LightGBM" />
          </div>
          <div className="bg-card border border-border rounded-lg p-5">
            <ConfusionMatrix data={confusionNorm} title="Normalized Confusion Matrix" normalized />
          </div>
          <div className="bg-card border border-border rounded-lg p-5">
            <h4 className="font-heading text-xs font-semibold text-foreground mb-3 text-center">Risk Label Distribution</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={riskDistData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,20%,15%)" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(240,15%,60%)" }} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(240,15%,60%)" }} />
                <Tooltip contentStyle={{ backgroundColor: "#12121a", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} label={{ position: "top", fontSize: 10, fill: "hsl(240,15%,70%)" }}>
                  {riskDistData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Row: Feature Importance + Correlation Matrix ────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-secondary" /> Feature Importance — LightGBM
            </h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={featureImportance.slice(0, 15)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,20%,15%)" />
                <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(240,15%,60%)" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "hsl(240,15%,60%)" }} width={120} />
                <Tooltip contentStyle={{ backgroundColor: "#12121a", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {featureImportance.slice(0, 15).map((_, i) => (
                    <Cell key={i} fill={i < 2 ? "#e74c3c" : i < 6 ? "#e67e22" : "#3498db"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card border border-border rounded-lg p-5">
            <CorrelationHeatmap />
          </div>
        </div>

        {/* ── Row: Crime Trend Line + Crime Type Bar ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-4">All-India Crime Trend (2001–2015)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e63946" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#e63946" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,20%,15%)" />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: "hsl(240,15%,60%)" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(240,15%,60%)" }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: "#12121a", border: "1px solid #1e1e2e", borderRadius: 8 }}
                  formatter={(v: any) => [Number(v).toLocaleString(), "Total Crimes"]} />
                <Area type="monotone" dataKey="total_crimes" stroke="#e63946" strokeWidth={2.5} fill="url(#trendGrad)" dot={{ r: 3, fill: "#e63946" }} />
                <ReferenceLine x={2013} stroke="#ffd166" strokeDasharray="5 5">
                  <Label value="Nirbhaya 2012" position="top" fill="#ffd166" fontSize={10} />
                </ReferenceLine>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Total Cases by Crime Type (NCRB)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={crimeTypeChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,20%,15%)" />
                <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(240,15%,60%)" }} tickFormatter={(v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(240,15%,60%)" }} width={90} />
                <Tooltip contentStyle={{ backgroundColor: "#12121a", border: "1px solid #1e1e2e", borderRadius: 8 }}
                  formatter={(v: any) => [Number(v).toLocaleString(), "Cases"]} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {crimeTypeChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Row: Top 15 States + Crime Type Donut ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Top 15 States — Total Crimes (NCRB All Years)</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={top15States}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,20%,15%)" />
                <XAxis dataKey="state" tick={{ fontSize: 8, fill: "hsl(240,15%,60%)", angle: -45, textAnchor: "end" }} height={80} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(240,15%,60%)" }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: "#12121a", border: "1px solid #1e1e2e", borderRadius: 8 }}
                  formatter={(v: any) => [Number(v).toLocaleString(), "Total Crimes"]} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {top15States.map((e, i) => <Cell key={i} fill={i < 3 ? "#e74c3c" : i < 7 ? "#f39c12" : "#2ecc71"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Crime Type Distribution (%)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={crimeTypePieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} dataKey="value" stroke="none"
                  label={({ name, value }: any) => `${name} ${value}%`} labelLine={{ stroke: "hsl(240,15%,40%)" }}>
                  {crimeTypePieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#12121a", border: "1px solid #1e1e2e", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {crimeTypePieData.map(c => (
                <span key={c.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name} ({c.value}%)
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row: Crime Breakdown by Type over Years ─────────────── */}
        <div className="bg-card border border-border rounded-lg p-5 mb-8">
          <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Crime Breakdown by Type Over Years</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,20%,15%)" />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: "hsl(240,15%,60%)" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(240,15%,60%)" }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: "#12121a", border: "1px solid #1e1e2e", borderRadius: 8 }}
                formatter={(v: any) => [Number(v).toLocaleString()]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="cruelty" stroke="#2ecc71" strokeWidth={2} dot={false} name="Cruelty" />
              <Line type="monotone" dataKey="assault" stroke="#e74c3c" strokeWidth={2} dot={false} name="Assault" />
              <Line type="monotone" dataKey="rape" stroke="#e67e22" strokeWidth={2} dot={false} name="Rape" />
              <Line type="monotone" dataKey="kidnapping" stroke="#3498db" strokeWidth={2} dot={false} name="Kidnapping" />
              <Line type="monotone" dataKey="insult" stroke="#9b59b6" strokeWidth={2} dot={false} name="Insult" />
              <Line type="monotone" dataKey="dowry" stroke="#1abc9c" strokeWidth={2} dot={false} name="Dowry" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ── State Rankings Table ────────────────────────────────── */}
        <div className="bg-card border border-border rounded-lg p-5 mb-8">
          <h3 className="font-heading text-sm font-semibold text-foreground mb-4">All States & UTs — Crime Rankings (NCRB 2001-2015)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border">
                <th className="text-left text-muted-foreground pb-2 font-medium">#</th>
                <th className="text-left text-muted-foreground pb-2 font-medium">State</th>
                <th className="text-right text-muted-foreground pb-2 font-medium">Total Crimes</th>
                <th className="text-right text-muted-foreground pb-2 font-medium">Districts</th>
                <th className="text-right text-muted-foreground pb-2 font-medium">Avg/District</th>
                <th className="text-center text-muted-foreground pb-2 font-medium">Risk</th>
              </tr></thead>
              <tbody>
                {stateRanking.map((s: any, i: number) => (
                  <tr key={i} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="py-1.5 text-muted-foreground">{s.rank}</td>
                    <td className="py-1.5 text-foreground font-medium">{s.state}</td>
                    <td className="py-1.5 text-right text-foreground">{s.total_crimes?.toLocaleString()}</td>
                    <td className="py-1.5 text-right text-muted-foreground">{s.num_districts}</td>
                    <td className="py-1.5 text-right text-muted-foreground">{Math.round(s.avg_crime_rate).toLocaleString()}</td>
                    <td className="py-1.5 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{
                        backgroundColor: s.risk_code === 2 ? "rgba(231,76,60,0.15)" : s.risk_code === 1 ? "rgba(243,156,18,0.15)" : "rgba(46,204,113,0.15)",
                        color: s.risk_code === 2 ? "#e74c3c" : s.risk_code === 1 ? "#f39c12" : "#2ecc71"
                      }}>{s.risk_level}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Data Source Footer ──────────────────────────────────── */}
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground">
            📊 Data: National Crime Records Bureau (NCRB), Ministry of Home Affairs, GOI
            <br />
            Dataset: District-wise Crimes Against Women (2001–2015) · {totalCrimes.toLocaleString()} total records
            <br />
            Model: LightGBM 99.4% F1 · 5 models compared · {modelInfo?.districts_cached || 1032} districts · {modelInfo?.states_cached || 36} states & UTs
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
