/**
 * firestore.js — Firestore Collection Helpers for Patient Feedback
 *
 * Collections:
 *   users             — { uid, email, role, displayName }
 *   patient_feedback   — { feedback_id, timestamp, patient_name, doctor_id,
 *                          department, transcript, sentiment, summary, pain_points }
 */

import {
  collection,
  addDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Collection References ───
export const usersCol = collection(db, "users");
export const feedbackCol = collection(db, "patient_feedback");

// ─── Feedback Helpers ───

/**
 * Add a new feedback document to the patient_feedback collection.
 * Used by the AudioUploadModal for graceful degradation (mock mode).
 */
export async function addFeedback(data) {
  const docRef = await addDoc(feedbackCol, {
    ...data,
    timestamp: Timestamp.now(),
  });
  return docRef.id;
}

export function buildFeedbackQuery() {
  return query(feedbackCol, orderBy("timestamp", "desc"));
}
