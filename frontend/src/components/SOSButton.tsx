import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2, AlertCircle, UserPlus, Phone, PhoneOff, User } from "lucide-react";
import { getContacts, getSettings, type EmergencyContact } from "@/lib/localStorage";
import { useNavigate } from "react-router-dom";

// ── Fake Call Sub-component ─────────────────────────────────────────
const FakeCallScreen = ({ onClose }: { onClose: () => void }) => {
  const [stage, setStage] = useState<"ringing" | "active">("ringing");
  const [callDuration, setCallDuration] = useState(0);
  const settings = getSettings();
  const callerName = settings.fakeCallName || "Mom";

  useEffect(() => {
    if (stage === "ringing" && settings.vibration && "vibrate" in navigator) {
      const interval = setInterval(() => navigator.vibrate([300, 200, 300]), 1500);
      return () => { clearInterval(interval); navigator.vibrate(0); };
    }
  }, [stage, settings.vibration]);

  useEffect(() => {
    if (stage !== "active") return;
    const interval = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(interval);
  }, [stage]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-between"
      style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #0a0a0f 100%)" }}
    >
      <div className="flex flex-col items-center pt-20">
        {stage === "ringing" && (
          <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}
            className="text-sm text-muted-foreground mb-4">Incoming Call...</motion.p>
        )}
        {stage === "active" && <p className="text-sm text-secondary mb-4">{fmt(callDuration)}</p>}
        <div className="w-24 h-24 rounded-full bg-muted border-2 border-border flex items-center justify-center mb-4">
          <User className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-foreground">{callerName}</h2>
        <p className="text-sm text-muted-foreground mt-1">Mobile</p>
      </div>
      <div className="pb-16 flex items-center gap-16">
        <button
          onClick={() => { if ("vibrate" in navigator) navigator.vibrate(0); onClose(); }}
          className="w-16 h-16 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
        >
          <PhoneOff className="w-7 h-7 text-primary-foreground" />
        </button>
        {stage === "ringing" && (
          <motion.button
            animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
            onClick={() => { if ("vibrate" in navigator) navigator.vibrate(0); setStage("active"); }}
            className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/90 transition-colors"
          >
            <Phone className="w-7 h-7 text-secondary-foreground" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

// ── Main SOS + FakeCall Button Group ───────────────────────────────
const SOSButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [stage, setStage] = useState<"countdown" | "sending" | "sent" | "no-contacts" | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [showFakeCall, setShowFakeCall] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [emailContacts, setEmailContacts] = useState<EmergencyContact[]>([]);

  const handleSOS = () => {
    const freshContacts = getContacts();
    const freshEmailContacts = freshContacts.filter(c => c.email);
    setContacts(freshContacts);
    setEmailContacts(freshEmailContacts);
    if (freshEmailContacts.length === 0) {
      setIsOpen(true); setStage("no-contacts"); return;
    }
    setIsOpen(true); setStage("countdown"); setCountdown(5);
  };

  useEffect(() => {
    if (stage !== "countdown") return;
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); fireSOS(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [stage]);

  const fireSOS = async () => {
    const settings = getSettings();
    if (settings.vibration && "vibrate" in navigator) navigator.vibrate([200, 100, 200, 100, 200]);
    setStage("sending");
    let locationUrl = "Location unavailable";
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 })
      );
      locationUrl = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
    } catch {}
    const currentContacts = getContacts();
    const emails = currentContacts.filter(c => c.email).map(c => c.email);
    if (emails.length > 0) {
      try {
        const { getProfile } = await import("@/lib/localStorage");
        const profile = getProfile();
        const { api } = await import("@/services/api");
        await api.sendSOSEmail(emails, locationUrl, profile.name || "A SafeHer User");
      } catch (err) { console.error("SOS email error:", err); }
    }
    setStage("sent");
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsOpen(false); setStage(null); setCountdown(5);
  };

  const circumference = 2 * Math.PI * 45;
  const progress = stage === "countdown" ? ((5 - countdown) / 5) * circumference : 0;

  return (
    <>
      {/* ── Floating button group: Phone (Fake Call) + SOS ── */}
      <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3">

        {/* Fake Call button — teal, clearly visible */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => setShowFakeCall(true)}
            title="Fake Call"
            className="relative w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            style={{
              background: "#00D4AA",
              boxShadow: "0 0 0 0 rgba(0,212,170,0.4)",
              animation: "teal-ping 2s cubic-bezier(0.4,0,0.6,1) infinite",
            }}
          >
            {/* outer glow ring */}
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background: "rgba(0,212,170,0.25)",
                animation: "teal-ping 2s cubic-bezier(0.4,0,0.6,1) infinite",
              }}
            />
            <Phone className="w-5 h-5 relative z-10" style={{ color: "#0a0a14" }} />
          </button>
          <span className="text-[9px] font-semibold tracking-wide" style={{ color: "#00D4AA" }}>
            CALL
          </span>
        </div>

        {/* SOS button */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleSOS}
            className="relative w-16 h-16 rounded-full bg-primary text-primary-foreground font-heading font-bold text-sm flex items-center justify-center hover:scale-110 transition-transform"
          >
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
            <span className="relative">SOS</span>
          </button>
          <span className="text-[9px] font-semibold tracking-wide text-primary">
            EMERGENCY
          </span>
        </div>
      </div>

      {/* keyframes for teal pulse */}
      <style>{`
        @keyframes teal-ping {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,212,170,0.5); }
          50% { box-shadow: 0 0 0 10px rgba(0,212,170,0); }
        }
      `}</style>

      {/* ── Fake Call Full-Screen ─────────────────────────── */}
      <AnimatePresence>
        {showFakeCall && <FakeCallScreen onClose={() => setShowFakeCall(false)} />}
      </AnimatePresence>

      {/* ── SOS Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel rounded-xl p-8 max-w-md w-full mx-4 text-center relative"
            >
              <h2 className="font-heading text-2xl font-bold text-primary mb-2">Emergency Alert</h2>

              {stage === "no-contacts" && (
                <div className="space-y-4 mt-6">
                  <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
                  <p className="text-foreground font-medium">No Emergency Contacts</p>
                  <p className="text-sm text-muted-foreground">
                    You need to add at least one contact with an email address in your Profile to send SOS alerts.
                  </p>
                  <div className="flex gap-3 justify-center mt-4">
                    <button onClick={() => { handleCancel(); navigate("/profile"); }}
                      className="px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2">
                      <UserPlus className="w-4 h-4" /> Add Contacts
                    </button>
                    <button onClick={handleCancel}
                      className="px-5 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Close
                    </button>
                  </div>
                </div>
              )}

              {stage === "countdown" && (
                <div className="space-y-4 mt-6">
                  <div className="relative w-28 h-28 mx-auto">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                      <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--primary))" strokeWidth="4"
                        strokeLinecap="round" strokeDasharray={circumference}
                        strokeDashoffset={circumference - progress}
                        className="transition-all duration-1000 ease-linear" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-heading text-3xl font-bold text-primary">{countdown}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">SOS will fire in {countdown} seconds</p>
                  <p className="text-xs text-muted-foreground">
                    Sending to {emailContacts.length} contact{emailContacts.length !== 1 ? "s" : ""}
                  </p>
                  <button onClick={handleCancel}
                    className="px-6 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
                    Cancel
                  </button>
                </div>
              )}

              {stage === "sending" && (
                <div className="space-y-4 mt-6">
                  <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
                  <p className="text-muted-foreground">Sharing your location with emergency contacts...</p>
                </div>
              )}

              {stage === "sent" && (
                <div className="space-y-4 mt-6">
                  <CheckCircle className="w-12 h-12 text-secondary mx-auto" />
                  <p className="text-foreground font-medium">Alert Sent Successfully</p>
                  <div className="space-y-2 mt-4">
                    {contacts.map((c) => (
                      <div key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-background"
                          style={{ backgroundColor: c.color }}>{c.name[0].toUpperCase()}</div>
                        <div className="flex-1 text-left">
                          <div className="text-sm text-foreground">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.phone}</div>
                        </div>
                        {c.email
                          ? <CheckCircle className="w-4 h-4 text-secondary" />
                          : <span className="text-[10px] text-muted-foreground">No email</span>}
                      </div>
                    ))}
                  </div>
                  <button onClick={handleCancel}
                    className="mt-4 px-6 py-2 rounded-md bg-muted text-sm text-foreground hover:bg-muted/80 transition-colors">
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SOSButton;
