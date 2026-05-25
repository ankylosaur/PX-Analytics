/**
 * AuthContext.jsx — Firebase Auth Context
 *
 * Simplified for PX Analytics Post-Discharge Semantic Analysis.
 * Default role is "admin" for all users.
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

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);        // Firebase Auth user
  const [profile, setProfile] = useState(null);  // Firestore user profile (role)
  const [loading, setLoading] = useState(true);

  // ── Listen for auth state changes ──
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const profileDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (profileDoc.exists()) {
            setProfile({ uid: firebaseUser.uid, ...profileDoc.data() });
          } else {
            console.info(
              `[auth] No Firestore profile for ${firebaseUser.uid}. ` +
                "Creating default admin profile."
            );
            const defaultProfile = {
              email: firebaseUser.email,
              role: "admin",
              displayName: firebaseUser.displayName || firebaseUser.email,
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, "users", firebaseUser.uid), defaultProfile);
            setProfile({ uid: firebaseUser.uid, ...defaultProfile });
          }
        } catch (err) {
          console.error("[auth] Failed to fetch user profile:", err);
          // Fallback to local profile to prevent blocking if firestore read fails
          setProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: "admin",
            displayName: firebaseUser.displayName || firebaseUser.email,
          });
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

  async function signIn(email, password) {
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return credential.user;
    } finally {
      setLoading(false);
    }
  }

  async function register(email, password) {
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = credential.user.uid;

      const userProfile = {
        email,
        role: "admin",
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

  async function signOut() {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
  }

  const isAdmin = true; // All authenticated users are admins in this version

  const value = {
    user,
    profile,
    loading,
    signIn,
    register,
    signOut,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return context;
}
