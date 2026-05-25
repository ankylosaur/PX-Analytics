/**
 * wipe_legacy_firestore.js — Database Sanitizer for PX Analytics Legacy Schema
 *
 * Connects to Firestore using Firebase Admin SDK and wipes all legacy
 * collections (consultations, providers, live_sessions, metrics, sessions)
 * to clean the database and conserve Firebase free-tier quota.
 *
 * Prerequisites:
 *   1. Ensure scripts/serviceAccountKey.json is present.
 *   2. Run: node wipe_legacy_firestore.js
 */

const admin = require("firebase-admin");
const path = require("path");

// ─── Firebase Admin Initialization ───
const serviceAccount = require(path.resolve(__dirname, "serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Legacy collections to wipe
const COLLECTIONS_TO_WIPE = [
  "consultations",
  "providers",
  "live_sessions",
  "metrics",
  "sessions",
];

/**
 * Delete all documents in a collection.
 * Uses batching to support deleting collections with >500 documents.
 */
async function deleteCollection(collectionName) {
  console.log(`[clear] Scanning collection: ${collectionName}...`);
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) {
    console.log(`  [clear] Collection "${collectionName}" is already empty or does not exist.\n`);
    return 0;
  }
  
  console.log(`  [clear] Found ${snapshot.size} documents in "${collectionName}". Deleting...`);
  
  let batch = db.batch();
  let count = 0;
  let deletedCount = 0;
  
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    count++;
    deletedCount++;
    
    // Commit batch every 400 documents
    if (count >= 400) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }
  
  if (count > 0) {
    await batch.commit();
  }
  
  console.log(`  [clear] Successfully deleted all ${deletedCount} documents in "${collectionName}".\n`);
  return deletedCount;
}

async function main() {
  console.log("=".repeat(65));
  console.log("  PX Analytics — Legacy Firestore Data Sanitizer");
  console.log("=".repeat(65));

  let totalDeleted = 0;

  try {
    for (const coll of COLLECTIONS_TO_WIPE) {
      const deleted = await deleteCollection(coll);
      totalDeleted += deleted;
    }
    
    console.log("=".repeat(65));
    console.log(`[wipe] SANITIZATION COMPLETE. Total documents deleted: ${totalDeleted}`);
    console.log("=".repeat(65));
  } catch (err) {
    console.error("\n[wipe] ERROR:", err.message);
    process.exit(1);
  }

  process.exit(0);
}

main();
