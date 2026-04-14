import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Phone } from "lucide-react";
import { ipcSections, emergencyContacts, safetyTips } from "@/data/mockData";

const Resources = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Resources</h1>
        <p className="text-sm text-muted-foreground mb-8">Legal rights, emergency contacts, and safety guidelines</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* IPC Sections */}
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-4">IPC Sections for Women</h2>
            <div className="space-y-3">
              {ipcSections.map((ipc) => (
                <div key={ipc.section} className="bg-card border border-border rounded-lg border-l-2 border-l-primary overflow-hidden">
                  <button
                    onClick={() => setOpenSection(openSection === ipc.section ? null : ipc.section)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div>
                      <span className="text-xs text-primary font-semibold">Section {ipc.section}</span>
                      <h3 className="text-sm text-foreground font-medium mt-0.5">{ipc.title}</h3>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openSection === ipc.section ? "rotate-180" : ""}`} />
                  </button>
                  {openSection === ipc.section && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                      <div>
                        <span className="text-xs text-muted-foreground font-semibold uppercase">What it means</span>
                        <p className="text-sm text-foreground mt-1">{ipc.explanation}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground font-semibold uppercase">Punishment</span>
                        <p className="text-sm text-foreground mt-1">{ipc.punishment}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground font-semibold uppercase">How to file complaint</span>
                        <p className="text-sm text-foreground mt-1">{ipc.howToFile}</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Contacts + Tips */}
          <div className="space-y-8">
            <div>
              <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Emergency Contacts</h2>
              <div className="space-y-3">
                {emergencyContacts.map((c) => (
                  <div key={c.number} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-foreground font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.description}</div>
                      <div className="text-lg font-heading font-bold text-secondary mt-1">{c.number}</div>
                    </div>
                    <a href={`tel:${c.number.replace(/-/g, "")}`} className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-secondary text-secondary text-xs font-semibold hover:bg-secondary/10 transition-colors">
                      <Phone className="w-3 h-3" /> Call Now
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Safety Tips</h2>
              <ol className="space-y-3">
                {safetyTips.map((tip, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="text-sm text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;
