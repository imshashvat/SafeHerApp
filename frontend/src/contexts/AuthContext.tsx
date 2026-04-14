import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  loadUserDataFromFirestore,
  clearAllUserData,
  saveContacts,
  saveProfile,
  saveSettings,
} from "@/lib/localStorage";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string, name: string, phone: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        console.log("[Auth] User detected:", u.email, "UID:", u.uid);

        // Step 1: Clear stale localStorage FIRST
        clearAllUserData();

        // Step 2: Load fresh data from Firestore
        const success = await loadUserDataFromFirestore(u.uid);

        if (!success) {
          console.warn("[Auth] Firestore load failed — localStorage is empty");
          // Even if Firestore fails, user can still use the app
          // Their data will be empty but they can re-add it
        }
      } else {
        console.log("[Auth] No user — clearing data");
        clearAllUserData();
      }

      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signup = async (email: string, password: string, name: string, phone: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    const profileData = { name, email, phone };

    // Save to Firestore
    await setDoc(doc(db, "users", cred.user.uid, "data", "profile"), {
      ...profileData,
      createdAt: new Date().toISOString(),
    });
    await setDoc(doc(db, "users", cred.user.uid, "data", "contacts"), { list: [] });
    await setDoc(doc(db, "users", cred.user.uid, "data", "settings"), {
      nightMode: true,
      travelAlerts: true,
      vibration: true,
      fakeCallName: "Mom",
    });

    // Also set localStorage immediately (no need to wait for onAuthStateChanged)
    saveProfile(profileData);
    saveContacts([]);
    saveSettings({ nightMode: true, travelAlerts: true, vibration: true, fakeCallName: "Mom" });

    console.log("[Auth] Signup complete for:", email);
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged fires automatically and handles data loading
  };

  const logout = async () => {
    clearAllUserData();
    await signOut(auth);
    console.log("[Auth] Logged out and data cleared");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
