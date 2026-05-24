/**
 * seed.js — Firestore Database Seeder for Ambient PX Analytics
 *
 * Injects 150 realistic consultation records distributed over 30 days.
 * Scores trend upward toward present day to simulate improvement.
 *
 * Prerequisites:
 *   1. Go to Firebase Console → Project Settings → Service Accounts
 *   2. Click "Generate New Private Key" → save the JSON file
 *   3. Place it in this directory as "serviceAccountKey.json"
 *   4. Run: node seed.js
 *
 * WARNING: This script writes directly to production Firestore.
 *          Run once, then verify in the Firebase Console.
 */

const admin = require("firebase-admin");
const path = require("path");

// ─── Firebase Admin Initialization ───
const serviceAccount = require(path.resolve(__dirname, "serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const { Timestamp } = admin.firestore;

// ─── Configuration ───
const TOTAL_CONSULTATIONS = 150;
const DAYS_BACK = 30;

const PROVIDERS = [
  { id: "dr-jenkins",  name: "Dr. Sarah Jenkins",  specialty: "Cardiology" },
  { id: "dr-patel",    name: "Dr. Raj Patel",       specialty: "Pediatrics" },
  { id: "dr-chen",     name: "Dr. Linda Chen",      specialty: "Oncology" },
  { id: "dr-murphy",   name: "Dr. Kevin Murphy",    specialty: "Neurology" },
  { id: "dr-wilson",   name: "Dr. Emily Wilson",    specialty: "General Practice" },
];

// ─── Helpers ───

/**
 * Random integer between min and max (inclusive).
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a metric score that trends upward over time.
 *
 * @param {number} dayAge — how many days ago (30 = oldest, 0 = today)
 * @param {number} baseMin — floor score for oldest records
 * @param {number} baseMax — ceiling score for newest records
 * @returns {number} — score between baseMin and baseMax, trending up
 */
function trendingScore(dayAge, baseMin = 62, baseMax = 98) {
  // progressFactor: 0.0 (30 days ago) → 1.0 (today)
  const progressFactor = 1 - dayAge / DAYS_BACK;

  // Shift the random range upward as we approach today
  const rangeLow = baseMin + Math.round(progressFactor * 12);   // 62 → 74
  const rangeHigh = baseMax - Math.round((1 - progressFactor) * 6); // 92 → 98

  // Add natural jitter (±4)
  const jitter = randInt(-4, 4);
  return Math.max(0, Math.min(100, randInt(rangeLow, rangeHigh) + jitter));
}

/**
 * Generate a random timestamp within a specific day.
 * Consultations occur between 7:00 AM and 7:00 PM.
 */
function randomTimestampForDay(daysAgo) {
  const now = new Date();
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(7, 0, 0, 0); // Start of shift

  // Random minute offset within the 12-hour shift (7AM → 7PM = 720 minutes)
  const minuteOffset = randInt(0, 720);
  date.setMinutes(date.getMinutes() + minuteOffset);

  return Timestamp.fromDate(date);
}

// ─── Seed Providers ───

async function seedProviders() {
  console.log("\n[seed] Seeding providers collection...");
  const batch = db.batch();

  for (const p of PROVIDERS) {
    const ref = db.collection("providers").doc(p.id);
    batch.set(ref, {
      name: p.name,
      specialty: p.specialty,
      avgEmpathy: randInt(72, 92),
      avgClarity: randInt(74, 90),
      avgEfficiency: randInt(68, 85),
      joinedYear: randInt(2016, 2022),
    }, { merge: true });
    console.log(`  [+] Provider: ${p.name} (${p.id})`);
  }

  await batch.commit();
  console.log(`[seed] ${PROVIDERS.length} providers written.\n`);
}

// ─── Seed Consultations ───

async function seedConsultations() {
  console.log(`[seed] Generating ${TOTAL_CONSULTATIONS} consultations over ${DAYS_BACK} days...\n`);

  // Firestore batch writes are limited to 500 operations
  let batch = db.batch();
  let batchCount = 0;
  let totalWritten = 0;

  // Track per-day counts for the log
  const dayCounts = {};

  for (let i = 0; i < TOTAL_CONSULTATIONS; i++) {
    // Random day in the past 30 days (0 = today, 29 = oldest)
    const daysAgo = randInt(0, DAYS_BACK - 1);
    dayCounts[daysAgo] = (dayCounts[daysAgo] || 0) + 1;

    // Random provider
    const provider = PROVIDERS[randInt(0, PROVIDERS.length - 1)];

    // Generate trending scores
    const empathy = trendingScore(daysAgo, 60, 96);
    const clarity = trendingScore(daysAgo, 62, 95);
    const efficiency = trendingScore(daysAgo, 58, 93);

    // ~15% anxiety flag, weighted higher for low empathy
    const anxietyFlag = empathy < 55 ? Math.random() < 0.6 : Math.random() < 0.15;

    const doc = {
      timestamp: randomTimestampForDay(daysAgo),
      provider_id: provider.id,
      patient_anxiety_flag: anxietyFlag,
      metrics: {
        Empathy: empathy,
        Clarity: clarity,
        Efficiency: efficiency,
      },
    };

    const ref = db.collection("consultations").doc(); // auto-ID
    batch.set(ref, doc);
    batchCount++;

    // Commit in batches of 400 (under 500 limit)
    if (batchCount >= 400) {
      await batch.commit();
      totalWritten += batchCount;
      console.log(`  [batch] Committed ${totalWritten}/${TOTAL_CONSULTATIONS} documents`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
    totalWritten += batchCount;
    console.log(`  [batch] Committed ${totalWritten}/${TOTAL_CONSULTATIONS} documents`);
  }

  // Print distribution summary
  console.log("\n[seed] Distribution by day (0 = today):");
  const sortedDays = Object.entries(dayCounts).sort((a, b) => Number(a[0]) - Number(b[0]));
  for (const [day, count] of sortedDays) {
    const bar = "#".repeat(count);
    console.log(`  Day -${day.padStart(2, "0")}: ${bar} (${count})`);
  }

  console.log(`\n[seed] Total consultations written: ${totalWritten}`);
}

// ─── Delete Collection Helper ───

async function deleteCollection(collectionName) {
  console.log(`[clear] Deleting all documents in collection: ${collectionName}...`);
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) {
    console.log(`  [clear] Collection "${collectionName}" is already empty.`);
    return;
  }
  
  let batch = db.batch();
  let count = 0;
  
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    count++;
    
    if (count >= 400) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }
  
  if (count > 0) {
    await batch.commit();
  }
  console.log(`  [clear] Deleted all ${snapshot.docs.length} documents in "${collectionName}".\n`);
}

// ─── Main ───

async function main() {
  console.log("=".repeat(55));
  console.log("  Ambient PX Analytics — Firestore Database Seeder");
  console.log("=".repeat(55));

  try {
    // Clear collections first
    await deleteCollection("providers");
    await deleteCollection("consultations");

    await seedProviders();
    await seedConsultations();

    console.log("\n[seed] DONE. Your database has been cleared and re-seeded with fresh data.");
    console.log("[seed] Refresh the Vite frontend to see the charts populate.\n");
  } catch (err) {
    console.error("\n[seed] ERROR:", err.message);
    console.error("[seed] Make sure serviceAccountKey.json is in this directory.");
    process.exit(1);
  }

  process.exit(0);
}

main();
