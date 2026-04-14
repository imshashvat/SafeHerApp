import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Camera, MapPin, Clock, AlertTriangle, X, Trash2 } from "lucide-react";
import { getRiskColor } from "@/data/mockData";
import { api } from "@/services/api";
import "leaflet/dist/leaflet.css";

const categories = ["Harassment", "Stalking", "Poor Lighting", "Unsafe Area", "Other"];
const filters = ["All", "Last 24h", "Last Week", "Last Month"];

const catColor: Record<string, string> = {
  Harassment: "#e63946",
  Stalking: "#ffd166",
  "Poor Lighting": "#8888aa",
  "Unsafe Area": "#00f5d4",
  Other: "#666",
};

const CommunityReports = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedCat, setSelectedCat] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showFeed, setShowFeed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await api.getCommunityReports();
      setReports(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = () => {
    if (!selectedCat) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const res = await api.submitReport({
            category: selectedCat,
            description: description,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          
          // Save the ID so we know which ones we can delete
          if (res.id) {
            const mine = JSON.parse(localStorage.getItem('my_safeher_reports') || '[]');
            mine.push(res.id);
            localStorage.setItem('my_safeher_reports', JSON.stringify(mine));
          }

          loadReports();
        } catch (err) {
          console.error("Submit failed:", err);
        }
      });
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedCat("");
      setDescription("");
      setPhotoPreview(null);
      setShowForm(false); // auto-collapse after submit
    }, 3000);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteReport(id);
      
      // Update local storage
      const mine = JSON.parse(localStorage.getItem('my_safeher_reports') || '[]');
      const updatedMine = mine.filter((myId: number) => myId !== id);
      localStorage.setItem('my_safeher_reports', JSON.stringify(updatedMine));

      // Update state
      setReports(reports.filter(r => r.id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const myReportIds = JSON.parse(localStorage.getItem('my_safeher_reports') || '[]');

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-screen w-full relative pt-16">
      {/* Filter chips + feed toggle */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeFilter === f ? "bg-primary text-primary-foreground" : "glass-panel text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
        <button
          onClick={() => setShowFeed(!showFeed)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            showFeed ? "bg-secondary text-secondary-foreground" : "glass-panel text-muted-foreground hover:text-foreground"
          }`}
        >
          Feed
        </button>
      </div>

      {/* Map */}
      <MapContainer center={[28.5745, 77.3560]} zoom={13} className="h-full w-full" zoomControl={false} style={{ background: "#0a0a0f" }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        {reports.map((r) => (
          <CircleMarker
            key={r.id}
            center={[r.lat, r.lng]}
            radius={8}
            pathOptions={{ color: catColor[r.category] || "#666", fillColor: catColor[r.category] || "#666", fillOpacity: 0.7, weight: 2 }}
          >
            <Popup>
              <div className="text-xs">
                <strong>{r.category}</strong><br />
                {r.description}<br />
                <span className="opacity-60">{r.reported_at || r.time}</span>
                <span className={`ml-2 px-1 py-0.5 rounded text-[10px] font-bold`} style={{ backgroundColor: `${getRiskColor(r.severity)}20`, color: getRiskColor(r.severity) }}>
                  {r.severity}
                </span>
                {myReportIds.includes(r.id) && (
                  <button onClick={() => handleDelete(r.id)} className="ml-2 text-destructive hover:text-destructive/80" title="Delete my report">
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Recent reports feed panel */}
      <AnimatePresence>
        {showFeed && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="absolute top-28 right-4 z-[1000] glass-panel rounded-xl p-4 w-72 max-h-[60vh] overflow-y-auto"
          >
            <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Recent Reports</h3>
            <div className="space-y-2">
              {reports.map(r => (
                <div key={r.id} className="flex items-start gap-2 p-2 bg-card rounded-lg border border-border">
                  <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: catColor[r.category] || "#666" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="text-xs text-foreground font-medium">{r.category}</div>
                      {myReportIds.includes(r.id) && (
                        <button onClick={() => handleDelete(r.id)} className="text-destructive/80 hover:text-destructive bg-transparent border-none p-0 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">{r.description}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{r.reported_at ? new Date(r.reported_at).toLocaleTimeString() : r.time}</span>
                      <span className="px-1 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: `${getRiskColor(r.severity)}20`, color: getRiskColor(r.severity) }}>
                        {r.severity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <AnimatePresence>
        {!showForm && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setShowForm(true)}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 rounded-full bg-primary text-primary-foreground font-heading font-semibold shadow-lg shadow-black/50 hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <AlertTriangle className="w-5 h-5" /> Report Incident
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[2000] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md glass-panel rounded-2xl p-6 relative"
            >
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-6">
                    <CheckCircle className="w-12 h-12 text-secondary mx-auto mb-3" />
                    <p className="text-foreground font-heading font-semibold">Thank you.</p>
                    <p className="text-sm text-muted-foreground mt-1">Your report has been added to the safety map.</p>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 pt-2">
                    <h3 className="font-heading text-lg font-bold text-foreground pr-8">Report an Incident — Anonymous</h3>
                    <p className="text-xs text-muted-foreground">GPS location auto-detected. No personal info collected.</p>

                    <div className="flex flex-wrap gap-2">
                      {categories.map((c) => (
                        <button
                          key={c}
                          onClick={() => setSelectedCat(c)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            selectedCat === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground border border-border"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Description (optional)"
                      className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none resize-none h-20"
                    />

                    {/* Photo attachment */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" /> Attach Photo
                      </button>
                      {photoPreview && (
                        <img src={photoPreview} alt="Preview" className="w-10 h-10 rounded-md object-cover border border-border" />
                      )}
                      <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={!selectedCat}
                      className="w-full py-3 rounded-md bg-primary text-primary-foreground font-heading font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      Submit Anonymous Report
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommunityReports;
