import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, X, User } from "lucide-react";
import { getSettings } from "@/lib/localStorage";

interface FakeCallProps {
  onClose: () => void;
}

const FakeCall = ({ onClose }: FakeCallProps) => {
  const [stage, setStage] = useState<"ringing" | "active" | null>("ringing");
  const [callDuration, setCallDuration] = useState(0);
  const settings = getSettings();
  const callerName = settings.fakeCallName || "Mom";

  // Vibration pattern for ringing
  useEffect(() => {
    if (stage === "ringing" && settings.vibration && "vibrate" in navigator) {
      const interval = setInterval(() => {
        navigator.vibrate([300, 200, 300]);
      }, 1500);
      return () => { clearInterval(interval); navigator.vibrate(0); };
    }
  }, [stage, settings.vibration]);

  // Call timer
  useEffect(() => {
    if (stage !== "active") return;
    const interval = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(interval);
  }, [stage]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleAnswer = () => {
    if ("vibrate" in navigator) navigator.vibrate(0);
    setStage("active");
  };

  const handleDecline = () => {
    if ("vibrate" in navigator) navigator.vibrate(0);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-between"
      style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #0a0a0f 100%)" }}
    >
      {/* Top section */}
      <div className="flex flex-col items-center pt-20">
        {stage === "ringing" && (
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-sm text-muted-foreground mb-4"
          >
            Incoming Call...
          </motion.p>
        )}
        {stage === "active" && (
          <p className="text-sm text-secondary mb-4">{formatDuration(callDuration)}</p>
        )}

        {/* Avatar */}
        <div className="w-24 h-24 rounded-full bg-muted border-2 border-border flex items-center justify-center mb-4">
          <User className="w-12 h-12 text-muted-foreground" />
        </div>

        <h2 className="font-heading text-2xl font-bold text-foreground">{callerName}</h2>
        <p className="text-sm text-muted-foreground mt-1">Mobile</p>
      </div>

      {/* Bottom buttons */}
      <div className="pb-16 flex items-center gap-16">
        <button
          onClick={handleDecline}
          className="w-16 h-16 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
        >
          <PhoneOff className="w-7 h-7 text-primary-foreground" />
        </button>

        {stage === "ringing" && (
          <motion.button
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            onClick={handleAnswer}
            className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/90 transition-colors"
          >
            <Phone className="w-7 h-7 text-secondary-foreground" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default FakeCall;
