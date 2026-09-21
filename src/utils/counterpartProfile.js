import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Every role's profile lives in its own collection — there's no shared
// "universal" store. The counterpart's role isn't known ahead of time, so
// each collection is checked in turn. Program Sponsor / Associator have no
// dedicated collection yet, so they resolve via the `users` fallback below.
export const PROFILE_COLLECTIONS = [
  "MyuniversalProfiles", // SME
  "universalProfiles",   // Investor
  "cmfProfiles",         // Capital Market Facilitator
  "catalystProfiles",    // Catalyst
  "internProfiles",      // Intern
  "advisorProfiles",     // Advisor
];

const extractName = (data) =>
  data?.formData?.entityOverview?.tradingName ||
  data?.formData?.entityOverview?.registeredName ||
  data?.formData?.contactDetails?.primaryContactName ||
  data?.formData?.contactDetails?.contactName ||
  data?.formData?.fundManageOverview?.registeredName ||
  data?.formData?.personalDetails?.fullName ||
  null;

const extractEmail = (data) =>
  data?.formData?.contactDetails?.email ||
  data?.formData?.entityOverview?.email ||
  data?.email ||
  null;

/**
 * Resolve a counterpart's display name (and email) across every role's
 * profile collection, falling back to `users`, then null.
 */
export async function resolveCounterpartProfile(id) {
  if (!id) return { name: null, email: null };

  for (const collectionName of PROFILE_COLLECTIONS) {
    try {
      const snap = await getDoc(doc(db, collectionName, id));
      if (snap.exists()) {
        const name = extractName(snap.data());
        if (name) return { name, email: extractEmail(snap.data()) };
      }
    } catch (e) {
      console.warn(`Error checking ${collectionName} for ${id}:`, e);
    }
  }

  try {
    const userSnap = await getDoc(doc(db, "users", id));
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const name =
        userData.name ||
        userData.fullName ||
        userData.username ||
        userData.displayName ||
        userData.email ||
        null;
      return { name, email: userData.email || null };
    }
  } catch (e) {
    console.warn(`Error checking users collection for ${id}:`, e);
  }

  return { name: null, email: null };
}