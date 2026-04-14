import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  color: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
}

export interface AppSettings {
  nightMode: boolean;
  travelAlerts: boolean;
  vibration: boolean;
  fakeCallName: string;
}

const CONTACTS_KEY = "safeher_contacts";
const PROFILE_KEY = "safeher_profile";
const SETTINGS_KEY = "safeher_settings";

const avatarColors = ["#e63946", "#00f5d4", "#ffd166", "#8338ec", "#ff006e", "#3a86ff", "#06d6a0", "#ef476f"];

// ── Local Storage (fallback + cache) ────────────────────────────

export const getContacts = (): EmergencyContact[] => {
  try {
    const data = localStorage.getItem(CONTACTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

export const saveContacts = (contacts: EmergencyContact[]) => {
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
};

export const addContact = (contact: Omit<EmergencyContact, "id" | "color">): EmergencyContact => {
  const contacts = getContacts();
  const newContact: EmergencyContact = {
    ...contact,
    id: Date.now().toString(),
    color: avatarColors[contacts.length % avatarColors.length],
  };
  contacts.push(newContact);
  saveContacts(contacts);
  return newContact;
};

export const removeContact = (id: string) => {
  const contacts = getContacts().filter(c => c.id !== id);
  saveContacts(contacts);
};

export const getProfile = (): UserProfile => {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : { name: "", email: "", phone: "" };
  } catch { return { name: "", email: "", phone: "" }; }
};

export const saveProfile = (profile: UserProfile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const getSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : { nightMode: true, travelAlerts: true, vibration: true, fakeCallName: "Mom" };
  } catch { return { nightMode: true, travelAlerts: true, vibration: true, fakeCallName: "Mom" }; }
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const clearAllUserData = () => {
  localStorage.removeItem(CONTACTS_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(SETTINGS_KEY);
};

// ── Firestore Sync (write) ──────────────────────────────────────

export const syncContactsToFirestore = async (userId: string, contacts: EmergencyContact[]) => {
  try {
    await setDoc(doc(db, "users", userId, "data", "contacts"), { list: contacts });
    console.log("[Firestore] Contacts synced:", contacts.length, "contacts");
  } catch (err) {
    console.error("[Firestore] Failed to sync contacts:", err);
    throw err; // Re-throw so caller knows it failed
  }
};

export const syncProfileToFirestore = async (userId: string, profile: UserProfile) => {
  try {
    await setDoc(doc(db, "users", userId, "data", "profile"), profile);
    console.log("[Firestore] Profile synced for:", profile.name);
  } catch (err) {
    console.error("[Firestore] Failed to sync profile:", err);
    throw err;
  }
};

export const syncSettingsToFirestore = async (userId: string, settings: AppSettings) => {
  try {
    await setDoc(doc(db, "users", userId, "data", "settings"), settings);
    console.log("[Firestore] Settings synced");
  } catch (err) {
    console.error("[Firestore] Failed to sync settings:", err);
    throw err;
  }
};

// ── Firestore Load (read) ───────────────────────────────────────
// Returns true if data was loaded successfully, false otherwise

export const loadUserDataFromFirestore = async (userId: string): Promise<boolean> => {
  try {
    console.log("[Firestore] Loading user data for UID:", userId);

    // Load all three in parallel for speed — with 10s timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Firestore load timed out after 10s")), 10000)
    );

    const [profileSnap, contactsSnap, settingsSnap] = await Promise.race([
      Promise.all([
        getDoc(doc(db, "users", userId, "data", "profile")),
        getDoc(doc(db, "users", userId, "data", "contacts")),
        getDoc(doc(db, "users", userId, "data", "settings")),
      ]),
      timeoutPromise,
    ]) as any;

    // Profile
    if (profileSnap.exists()) {
      const profileData = profileSnap.data() as UserProfile;
      saveProfile(profileData);
      console.log("[Firestore] Profile loaded:", profileData.name, "| Phone:", profileData.phone);
    } else {
      console.log("[Firestore] No profile doc found — user may be new");
    }

    // Contacts
    if (contactsSnap.exists()) {
      const contactsData = contactsSnap.data();
      const contacts = contactsData.list || [];
      saveContacts(contacts);
      console.log("[Firestore] Contacts loaded:", contacts.length, "contacts");
    } else {
      saveContacts([]); // Explicitly set empty
      console.log("[Firestore] No contacts doc found — starting with empty");
    }

    // Settings
    if (settingsSnap.exists()) {
      const settingsData = settingsSnap.data() as AppSettings;
      saveSettings(settingsData);
      console.log("[Firestore] Settings loaded");
    } else {
      console.log("[Firestore] No settings doc found — using defaults");
    }

    return true; // Success
  } catch (err) {
    console.error("[Firestore] FAILED to load user data:", err);
    return false; // Failure — caller should NOT clear localStorage
  }
};
