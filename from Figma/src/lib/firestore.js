/**
 * firestore.js — Firestore Collection Helpers & Seeding
 *
 * Collections:
 *   users          — { uid, email, role, provider_id, displayName }
 *   providers      — { name, specialty, avgEmpathy, avgClarity, avgEfficiency }
 *   consultations  — { timestamp, provider_id, patient_anxiety_flag, metrics }
 */

import {
  collection, doc, setDoc, getDocs, getDoc, addDoc,
  query, where, orderBy, limit, Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export const usersCol = collection(db, "users");
export const providersCol = collection(db, "providers");
export const consultationsCol = collection(db, "consultations");

export async function getProvider(providerId) {
  const snap = await getDoc(doc(db, "providers", providerId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getAllProviders() {
  const snap = await getDocs(providersCol);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addConsultation({ providerId, patientAnxietyFlag = false, empathy, clarity, efficiency }) {
  return addDoc(consultationsCol, {
    timestamp: Timestamp.now(),
    provider_id: providerId,
    patient_anxiety_flag: patientAnxietyFlag,
    metrics: { Empathy: empathy, Clarity: clarity, Efficiency: efficiency },
  });
}

export function consultationsForProviderQuery(providerId) {
  return query(consultationsCol, where("provider_id", "==", providerId), orderBy("timestamp", "desc"));
}

export function consultationsInRangeQuery(startDate, endDate) {
  return query(
    consultationsCol,
    where("timestamp", ">=", Timestamp.fromDate(startDate)),
    where("timestamp", "<=", Timestamp.fromDate(endDate)),
    orderBy("timestamp", "asc")
  );
}

const SEED_PROVIDERS = [
  { id: "dr-jenkins", name: "Dr. Sarah Jenkins", specialty: "Cardiology", avgEmpathy: 88, avgClarity: 82, avgEfficiency: 75, joinedYear: 2019 },
  { id: "dr-patel", name: "Dr. Raj Patel", specialty: "Pediatrics", avgEmpathy: 85, avgClarity: 90, avgEfficiency: 80, joinedYear: 2017 },
  { id: "dr-chen", name: "Dr. Linda Chen", specialty: "Oncology", avgEmpathy: 79, avgClarity: 76, avgEfficiency: 72, joinedYear: 2020 },
  { id: "dr-murphy", name: "Dr. Kevin Murphy", specialty: "Neurology", avgEmpathy: 74, avgClarity: 80, avgEfficiency: 70, joinedYear: 2018 },
  { id: "dr-wilson", name: "Dr. Emily Wilson", specialty: "General Practice", avgEmpathy: 70, avgClarity: 73, avgEfficiency: 68, joinedYear: 2021 },
];

export async function seedFirestore() {
  const existing = await getDocs(query(providersCol, limit(1)));
  if (!existing.empty) { console.log("[seed] Already seeded."); return; }
  console.log("[seed] Seeding Firestore...");

  for (const p of SEED_PROVIDERS) {
    const { id, ...data } = p;
    await setDoc(doc(db, "providers", id), data);
  }

  const now = new Date();
  for (let day = 29; day >= 0; day--) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    date.setHours(7, 0, 0, 0);

    for (const p of SEED_PROVIDERS) {
      const count = 16 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        const t = new Date(date);
        t.setMinutes(t.getMinutes() + Math.floor(Math.random() * 720));
        const j = () => (Math.random() - 0.5) * 16;
        const c = (v) => Math.max(0, Math.min(100, Math.round(v)));
        await addDoc(consultationsCol, {
          timestamp: Timestamp.fromDate(t),
          provider_id: p.id,
          patient_anxiety_flag: Math.random() < 0.12,
          metrics: { Empathy: c(p.avgEmpathy + j()), Clarity: c(p.avgClarity + j()), Efficiency: c(p.avgEfficiency + j()) },
        });
      }
    }
  }
  console.log("[seed] Done.");
}
