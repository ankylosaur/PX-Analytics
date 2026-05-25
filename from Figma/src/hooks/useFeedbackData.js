/**
 * useFeedbackData.js — Real-time Firestore hooks with client-side filtering.
 *
 * Subscribes to the entire collection (ordered by timestamp desc) to avoid
 * needing composite indexes in Firestore, then filters the data in-memory.
 */

import { useState, useEffect, useMemo } from "react";
import { onSnapshot } from "firebase/firestore";
import { buildFeedbackQuery } from "../lib/firestore";

/**
 * Real-time hook for patient feedback data with client-side multi-field filtering.
 *
 * @param {Object} filters
 * @param {string} [filters.department]  — "All" or department name
 * @param {string} [filters.doctor]      — "All" or doctor_id
 * @param {string} [filters.sentiment]   — "All", "Positive", "Neutral", or "Negative"
 * @param {Date}   [filters.startDate]   — Start of date range
 * @param {Date}   [filters.endDate]     — End of date range
 * @returns {{ feedbacks, loading, error, sentimentBreakdown, trendingPainPoints, uniqueDoctors, uniqueDepartments, totalCount }}
 */
export function useFeedbackData(filters = {}) {
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Subscribe to all feedbacks sorted by timestamp desc (automatic single-field index)
  useEffect(() => {
    setLoading(true);
    setError(null);

    let q;
    try {
      q = buildFeedbackQuery();
    } catch (err) {
      console.error("[useFeedbackData] Failed to build query:", err);
      setError(err.message);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        console.log(
          `[useFeedbackData] ${docs.length} feedback records synced from firestore`
        );
        setAllFeedbacks(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useFeedbackData] Snapshot error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ─── Client-Side Filtering ───
  const filterKey = JSON.stringify(filters);

  const filteredFeedbacks = useMemo(() => {
    return allFeedbacks.filter((fb) => {
      // Patient Search Filter
      if (filters.searchQuery && filters.searchQuery.trim() !== "") {
        const queryStr = filters.searchQuery.toLowerCase().trim();
        const patientName = (fb.patient_name || "").toLowerCase();
        if (!patientName.includes(queryStr)) {
          return false;
        }
      }

      // Department Filter
      if (
        filters.department &&
        filters.department !== "All" &&
        fb.department !== filters.department
      ) {
        return false;
      }

      // Doctor Filter
      if (
        filters.doctor &&
        filters.doctor !== "All" &&
        fb.doctor_id !== filters.doctor
      ) {
        return false;
      }

      // Sentiment Filter
      if (
        filters.sentiment &&
        filters.sentiment !== "All" &&
        fb.sentiment !== filters.sentiment
      ) {
        return false;
      }

      // Date Range Filters
      if (filters.startDate || filters.endDate) {
        const fbDate = fb.timestamp?.toDate
          ? fb.timestamp.toDate()
          : fb.timestamp
          ? new Date(fb.timestamp)
          : null;

        if (!fbDate) return false;

        if (filters.startDate && fbDate < filters.startDate) {
          return false;
        }

        // Set endDate to end of day for inclusive filtering
        if (filters.endDate) {
          const endOfDay = new Date(filters.endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (fbDate > endOfDay) {
            return false;
          }
        }
      }

      return true;
    });
  }, [allFeedbacks, filterKey]);

  // ─── Derived Computations ───

  const sentimentBreakdown = useMemo(() => {
    if (filteredFeedbacks.length === 0) {
      return { positive: 0, neutral: 0, negative: 0, total: 0 };
    }

    let positive = 0;
    let neutral = 0;
    let negative = 0;

    for (const fb of filteredFeedbacks) {
      switch (fb.sentiment) {
        case "Positive":
          positive++;
          break;
        case "Neutral":
          neutral++;
          break;
        case "Negative":
          negative++;
          break;
      }
    }

    const total = filteredFeedbacks.length;
    return {
      positive,
      neutral,
      negative,
      total,
      positivePercent: Math.round((positive / total) * 100) || 0,
      neutralPercent: Math.round((neutral / total) * 100) || 0,
      negativePercent: Math.round((negative / total) * 100) || 0,
    };
  }, [filteredFeedbacks]);

  const trendingPainPoints = useMemo(() => {
    if (filteredFeedbacks.length === 0) return [];

    const countMap = {};
    for (const fb of filteredFeedbacks) {
      if (Array.isArray(fb.pain_points)) {
        for (const point of fb.pain_points) {
          countMap[point] = (countMap[point] || 0) + 1;
        }
      }
    }

    return Object.entries(countMap)
      .map(([point, count]) => ({ point, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredFeedbacks]);

  const uniqueDoctors = useMemo(() => {
    const docs = new Set();
    for (const fb of allFeedbacks) {
      // Contextual doctor filtering: if a department filter is active, only list doctors in that department
      if (
        filters.department &&
        filters.department !== "All" &&
        fb.department !== filters.department
      ) {
        continue;
      }
      if (fb.doctor_id) docs.add(fb.doctor_id);
    }
    return Array.from(docs).sort();
  }, [allFeedbacks, filters.department]);

  const uniqueDepartments = useMemo(() => {
    const depts = new Set();
    for (const fb of allFeedbacks) {
      if (fb.department) depts.add(fb.department);
    }
    return Array.from(depts).sort();
  }, [allFeedbacks]);

  return {
    feedbacks: filteredFeedbacks,
    allFeedbacks,
    loading,
    error,
    sentimentBreakdown,
    trendingPainPoints,
    uniqueDoctors,
    uniqueDepartments,
    totalCount: filteredFeedbacks.length,
  };
}
