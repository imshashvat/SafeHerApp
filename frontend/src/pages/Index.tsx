import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin, Route, Shield, ChevronRight, Crosshair, BarChart3, Building2 } from "lucide-react";

const useCountUp = (end: number, duration = 2000, decimals = 0) => {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          setValue(parseFloat((progress * end).toFixed(decimals)));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, decimals]);

  return { value, ref };
};

const ParticleGrid = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="grid-bg absolute inset-0 opacity-40" />
    {Array.from({ length: 30 }).map((_, i) => (
      <div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-primary/30"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `pulse-glow ${2 + Math.random() * 3}s infinite ${Math.random() * 2}s`,
        }}
      />
    ))}
  </div>
);

const Index = () => {
  const crimes = useCountUp(4.45, 2000, 2);
  const accuracy = useCountUp(99.4, 2200, 1);
  const districts = useCountUp(1032, 1800, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-16">
        <ParticleGrid />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-primary">Live Threat Intelligence</span>
            </div>

            <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Predict danger.{" "}
              <span className="text-primary glow-crimson">Before it happens.</span>
            </h1>

            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              AI-powered women safety prediction for Indian cities — trained on 15 years of NCRB crime data
              across 6 dimensions. Real-time risk scoring for every district.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/heatmap"
                className="flex items-center gap-2 px-8 py-4 rounded-lg bg-primary text-primary-foreground font-heading font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
              >
                <MapPin className="w-4 h-4" />
                View Safety Heatmap
              </Link>
              <Link
                to="/route"
                className="flex items-center gap-2 px-8 py-4 rounded-lg border border-secondary text-secondary font-heading font-semibold text-sm hover:bg-secondary/10 transition-all"
              >
                <Route className="w-4 h-4" />
                Check Your Route
              </Link>
            </div>
          </motion.div>

          {/* Count-up stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            {[
              { ref: crimes.ref, value: `${crimes.value}L+`, label: "Crimes Analyzed", color: "text-primary" },
              { ref: accuracy.ref, value: `${accuracy.value}%`, label: "LightGBM Accuracy", color: "text-secondary" },
              { ref: districts.ref, value: districts.value.toLocaleString(), label: "Districts Covered", color: "text-accent" },
            ].map((stat, i) => (
              <div key={i} ref={stat.ref} className="text-center">
                <div className={`font-heading text-3xl md:text-4xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "High Risk Districts", value: "344+", color: "text-primary" },
            { label: "States Analyzed", value: "36", color: "text-accent" },
            { label: "Districts Covered", value: "1,032", color: "text-secondary" },
            { label: "NCRB Data Span", value: "15 yrs", color: "text-muted-foreground" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className={`font-heading text-2xl font-bold ${s.color} animate-pulse-glow`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-3">
            Intelligence at Your Fingertips
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            Three powerful tools to understand, analyze, and navigate safety risks across India.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Crosshair,
              title: "Predictive Heatmap",
              desc: "District-level risk visualization across India with NCRB crime data filtering by type and year range. Interactive district breakdowns with donut charts and trend sparklines.",
              link: "/heatmap",
            },
            {
              icon: Route,
              title: "Route Safety Score",
              desc: "Segment-by-segment risk analysis for any journey. Automatic safer alternative suggestions when risk exceeds thresholds. Color-coded route visualization.",
              link: "/route",
            },
            {
              icon: Building2,
              title: "Institutional Intelligence",
              desc: "15-year NCRB crime trends with annotated events, state-by-state safety rankings, radar comparisons of district crime profiles against national averages.",
              link: "/dashboard",
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              viewport={{ once: true }}
            >
              <Link
                to={f.link}
                className="block bg-card border border-border rounded-xl p-8 border-t-2 border-t-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 h-full"
              >
                <f.icon className="w-10 h-10 text-primary mb-5" />
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{f.desc}</p>
                <div className="flex items-center gap-1 text-primary text-sm font-semibold">
                  Explore <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground text-center mb-14">
            How SafeHer Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Detect Location", desc: "GPS auto-detects your current district and reverse-geocodes to the nearest administrative area." },
              { step: "02", title: "Analyze Risk", desc: "LightGBM model scores 6 crime dimensions — Rape, Kidnapping, Dowry Deaths, Assault, Cruelty, Trafficking." },
              { step: "03", title: "Score & Compare", desc: "Risk score 0–100 with confidence %. Compared against state average and national benchmarks." },
              { step: "04", title: "Protect & Alert", desc: "Travel Mode tracks in real-time. SOS alerts emergency contacts with live GPS. Fake Call for discreet exit." },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="font-heading text-4xl font-bold text-primary/20 mb-3">{s.step}</div>
                <h3 className="font-heading text-base font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Shield className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-4">
            Your safety shouldn't be a guess.
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Start using SafeHer to make informed decisions about where you go and how you travel.
          </p>
          <Link
            to="/travel"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-primary text-primary-foreground font-heading font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
          >
            <Shield className="w-4 h-4" />
            Start Travel Mode
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default Index;
