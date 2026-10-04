import { doc, updateDoc, increment } from "firebase/firestore";

// ─────────────────────────────────────────────────────────────────────────
// ANALYSIS FAILURE LOG
//
// The score cards auto-run their AI analysis when `trigger…Evaluation` is true
// on universalProfiles/{uid}. They used to clear that flag whether or not the
// run worked, so a failed analysis was lost and never retried.
//
// Now the flag is only cleared on success, and every failure is recorded here
// on the same profile doc (no new collection, so no new security rules):
//
//   universalProfiles/{uid}.analysisFailures.<card> = {
//     message, at (ISO), attempts (running count), stage?
//   }
//
// The next page open mounts the card again, sees the flag still true, and
// tries again. A success clears the flag and the card's entry.
// ─────────────────────────────────────────────────────────────────────────

export async function logAnalysisFailure(db, userId, card, error, extra = {}) {
  const message = String(error?.message || error || "Unknown error").slice(0, 500);
  console.error(`[analysis-failure] ${card}:`, message);
  if (!db || !userId) return;
  try {
    await updateDoc(doc(db, "universalProfiles", userId), {
      [`analysisFailures.${card}`]: {
        message,
        at: new Date().toISOString(),
        attempts: increment(1),
        ...extra,
      },
    });
  } catch (e) {
    // Logging must never break the card.
    console.error("[analysis-failure] could not write log:", e);
  }
}