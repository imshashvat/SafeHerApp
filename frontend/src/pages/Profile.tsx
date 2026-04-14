import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Phone, Mail, Trash2, Plus, Send, Settings, Moon, Navigation, Vibrate, Save, X, AlertCircle } from "lucide-react";
import {
  getProfile, saveProfile, getContacts, saveContacts, addContact, removeContact,
  getSettings, saveSettings, syncContactsToFirestore, syncProfileToFirestore,
  syncSettingsToFirestore, loadUserDataFromFirestore,
  type EmergencyContact, type UserProfile, type AppSettings
} from "@/lib/localStorage";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(getProfile());
  const [contacts, setContacts] = useState<EmergencyContact[]>(getContacts());
  const [settings, setAppSettings] = useState<AppSettings>(getSettings());
  const [showAddContact, setShowAddContact] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [testSentId, setTestSentId] = useState<string | null>(null);
  const [testSending, setTestSending] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load data from Firestore on mount
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        await loadUserDataFromFirestore(user.uid);
        setProfile(getProfile());
        setContacts(getContacts());
        setAppSettings(getSettings());

        // If profile is empty, populate from auth
        const p = getProfile();
        if (!p.name && user.displayName) {
          const updated = { ...p, name: user.displayName, email: user.email || "" };
          saveProfile(updated);
          setProfile(updated);
        }
      }
      setDataLoaded(true);
    };
    loadData();
  }, [user]);

  const handleSaveProfile = async () => {
    saveProfile(profile);
    if (user) {
      try {
        await syncProfileToFirestore(user.uid, profile);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        console.error("Profile sync failed:", err);
        setSaved(true); // Still show saved (localStorage works)
        setTimeout(() => setSaved(false), 2000);
      }
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleAddContact = async () => {
    if (!newName || !newPhone) return;
    const c = addContact({ name: newName, phone: newPhone, email: newEmail });
    const updated = [...contacts, c];
    setContacts(updated);
    setNewName(""); setNewPhone(""); setNewEmail("");
    setShowAddContact(false);
    if (user) {
      try {
        await syncContactsToFirestore(user.uid, updated);
      } catch (err) {
        console.error("Contact sync failed:", err);
      }
    }
  };

  const handleRemoveContact = async (id: string) => {
    removeContact(id);
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    if (user) {
      try {
        await syncContactsToFirestore(user.uid, updated);
      } catch (err) {
        console.error("Contact sync failed:", err);
      }
    }
  };

  const handleTestSend = async (contact: EmergencyContact) => {
    if (!contact.email) return;
    setTestSending(contact.id);
    try {
      const profileData = getProfile();
      let locationUrl = "Location unavailable";
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 })
        );
        locationUrl = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
      } catch {}

      await api.sendSOSEmail([contact.email], locationUrl, profileData.name || "SafeHer User");
      setTestSentId(contact.id);
      setTimeout(() => setTestSentId(null), 3000);
    } catch (err) {
      console.error("Test send error:", err);
    } finally {
      setTestSending(null);
    }
  };

  const handleToggle = async (key: keyof AppSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setAppSettings(updated);
    saveSettings(updated);
    if (user) await syncSettingsToFirestore(user.uid, updated);
  };

  const handleFakeCallNameChange = (name: string) => {
    const updated = { ...settings, fakeCallName: name };
    setAppSettings(updated);
    saveSettings(updated);
  };

  const handleFakeCallNameBlur = async () => {
    if (user) await syncSettingsToFirestore(user.uid, settings);
  };

  const initials = profile.name ? profile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U";

  if (!dataLoaded) {
    return (
      <div className="min-h-screen pt-16 bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-8">Profile & Settings</h1>

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <span className="font-heading text-xl font-bold text-primary">{initials}</span>
            </div>
            <div className="flex-1">
              <input
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                className="bg-transparent text-lg font-heading font-bold text-foreground outline-none w-full border-b border-transparent focus:border-border pb-1"
                placeholder="Your Name"
              />
              <input
                value={profile.email}
                onChange={e => setProfile({ ...profile, email: e.target.value })}
                className="bg-transparent text-sm text-muted-foreground outline-none w-full mt-1"
                placeholder="your@email.com"
              />
            </div>
            <button onClick={handleSaveProfile} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${saved ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
              <Save className="w-3 h-3" /> {saved ? "Saved!" : "Save"}
            </button>
          </div>

          {/* Phone number */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <input
              value={profile.phone}
              onChange={e => setProfile({ ...profile, phone: e.target.value })}
              className="bg-transparent text-sm text-foreground outline-none flex-1"
              placeholder="Your phone number (+91...)"
            />
          </div>
        </motion.div>

        {/* Emergency Contacts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-semibold text-foreground">Emergency Contacts</h2>
            <button
              onClick={() => setShowAddContact(!showAddContact)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-secondary/10 border border-secondary/20 text-secondary text-xs font-semibold hover:bg-secondary/20 transition-colors"
            >
              {showAddContact ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              {showAddContact ? "Cancel" : "Add Contact"}
            </button>
          </div>

          {showAddContact && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mb-4 p-4 bg-muted rounded-lg space-y-3">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none" />
              <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Phone (+91...)" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none" />
              <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email (required for SOS alerts)" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none" />
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Email is needed to send SOS location alerts
              </p>
              <button onClick={handleAddContact} disabled={!newName || !newPhone} className="w-full py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-semibold disabled:opacity-50">
                Add Contact
              </button>
            </motion.div>
          )}

          {contacts.length === 0 && !showAddContact && (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 rounded-full bg-muted mx-auto flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No emergency contacts yet</p>
              <p className="text-xs text-muted-foreground">Add contacts so SOS can send your location to them</p>
              <button
                onClick={() => setShowAddContact(true)}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                Add Your First Contact
              </button>
            </div>
          )}

          <div className="space-y-3">
            {contacts.map(c => (
              <div key={c.id} className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-background" style={{ backgroundColor: c.color }}>
                  {c.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Phone className="w-3 h-3" /> {c.phone}
                    {c.email && <><Mail className="w-3 h-3 ml-2" /> {c.email}</>}
                  </div>
                </div>
                <button
                  onClick={() => handleTestSend(c)}
                  disabled={!c.email || testSending === c.id}
                  className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                    testSentId === c.id
                      ? "bg-secondary/20 text-secondary"
                      : !c.email
                      ? "bg-muted text-muted-foreground/40 cursor-not-allowed"
                      : testSending === c.id
                      ? "bg-muted text-muted-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                  title={!c.email ? "Add email to enable test" : "Send test SOS email"}
                >
                  {testSentId === c.id ? "✓ Sent!" : testSending === c.id ? "Sending..." : <><Send className="w-3 h-3 inline mr-1" />Test</>}
                </button>
                <button onClick={() => handleRemoveContact(c.id)} className="text-muted-foreground hover:text-primary transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-xl p-6 mb-6">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" /> Settings
          </h2>

          <div className="space-y-4">
            {[
              { key: "nightMode" as const, icon: Moon, label: "Night Mode Auto-Activate", desc: "Automatically increase alert sensitivity after sunset" },
              { key: "travelAlerts" as const, icon: Navigation, label: "Travel Mode Alerts", desc: "Get notified when risk level changes during travel" },
              { key: "vibration" as const, icon: Vibrate, label: "Vibration Feedback", desc: "Haptic feedback on SOS and alerts" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-foreground">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(item.key)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${settings[item.key] ? "bg-secondary" : "bg-muted"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-foreground transition-transform ${settings[item.key] ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
            ))}

            {/* Fake call name */}
            <div className="flex items-center justify-between py-2 border-t border-border pt-4">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-foreground">Fake Call Caller Name</div>
                  <div className="text-xs text-muted-foreground">Displayed when fake call is triggered</div>
                </div>
              </div>
              <input
                value={settings.fakeCallName}
                onChange={e => handleFakeCallNameChange(e.target.value)}
                onBlur={handleFakeCallNameBlur}
                className="w-28 bg-muted border border-border rounded-md px-2 py-1 text-sm text-foreground outline-none text-right"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
