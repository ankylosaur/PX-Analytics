/**
 * AuthContext.jsx — Firebase Auth Context with Role-Based Access Control
 *
 * Roles:
 *   "admin"    → Full access: Executive Overview, Specialty Benchmarking, all data
 *   "provider" → Restricted: Only their own Provider Deep-Dive view
 *
 * Usage:
 *   Wrap your app with <AuthProvider> and consume with useAuth()
 */

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

/**
 * @typedef {Object} UserProfile
 * @property {string} uid
 * @property {string} email
 * @property {"admin" | "provider"} role
 * @property {string | null} provider_id   — links to providers collection (null for admins)
 * @property {string | null} displayName
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);        // Firebase Auth user
  const [profile, setProfile] = useState(null);  // Firestore user profile (role, provider_id)
  const [loading, setLoading] = useState(true);

  // ── Listen for auth state changes ──
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch the user's profile from Firestore (contains role)
        try {
          const profileDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (profileDoc.exists()) {
            setProfile({ uid: firebaseUser.uid, ...profileDoc.data() });
          } else {
            // Profile doesn't exist yet — set a default (provider)
            console.warn(
              `[auth] No Firestore profile for ${firebaseUser.uid}. ` +
                "Creating default provider profile."
            );
            const defaultProfile = {
              email: firebaseUser.email,
              role: "provider",
              provider_id: null,
              displayName: firebaseUser.displayName || firebaseUser.email,
            };
            await setDoc(doc(db, "users", firebaseUser.uid), defaultProfile);
            setProfile({ uid: firebaseUser.uid, ...defaultProfile });
          }
        } catch (err) {
          console.error("[auth] Failed to fetch user profile:", err);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ── Auth actions ──

  /**
   * Sign in with email/password.
   */
  async function signIn(email, password) {
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return credential.user;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Register a new user with email/password and create their Firestore profile.
   * @param {string} email
   * @param {string} password
   * @param {"admin" | "provider"} role
   * @param {string | null} providerId — provider doc ID if role is "provider"
   */
  async function register(email, password, role = "provider", providerId = null) {
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = credential.user.uid;

      // Create the Firestore user profile
      const userProfile = {
        email,
        role,
        provider_id: providerId,
        displayName: email.split("@")[0],
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "users", uid), userProfile);
      setProfile({ uid, ...userProfile });

      return credential.user;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Sign out the current user.
   */
  async function signOut() {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
  }

  // ── Role helpers ──
  const isAdmin = profile?.role === "admin";
  const isProvider = profile?.role === "provider";

  /**
   * Check if the current user has access to a specific tab.
   * Admin: all tabs. Provider: only "provider" tab.
   */
  function canAccessTab(tabId) {
    if (!profile) return false;
    if (isAdmin) return true;
    return tabId === "provider";
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    register,
    signOut,
    isAdmin,
    isProvider,
    canAccessTab,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to consume the Auth context.
 * @returns {{ user, profile: UserProfile, loading, signIn, register, signOut, isAdmin, isProvider, canAccessTab }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return context;
}
