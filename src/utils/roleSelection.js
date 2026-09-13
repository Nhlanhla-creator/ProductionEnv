// src/utils/roleSelection.js
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

const STORAGE_KEY = "big_preSignupRoleSelection";

// Save the pre-signup picks before an account exists yet.
export function savePreSignupRoleSelection({ role, priorities }) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ role, priorities, pickedAt: Date.now() })
    );
  } catch (err) {
    console.error("Failed to store pre-signup role selection:", err);
  }
}

export function getPreSignupRoleSelection() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Failed to read pre-signup role selection:", err);
    return null;
  }
}

export function clearPreSignupRoleSelection() {
  sessionStorage.removeItem(STORAGE_KEY);
}

// Call this once, right after auth.currentUser exists (post sign-up/sign-in).
// Writes the role + priorities onto the user doc, then clears the session copy.
export async function applyPreSignupRoleSelection(uid) {
  const picked = getPreSignupRoleSelection();
  if (!picked || !uid) return null;

  try {
    await setDoc(
      doc(db, "users", uid),
      {
        accountRole: picked.role,
        rolePriorities: picked.priorities,
        roleSelection: {
          role: picked.role,
          priorities: picked.priorities,
          completedAt: serverTimestamp(),
        },
      },
      { merge: true }
    );
    clearPreSignupRoleSelection();
    return picked;
  } catch (err) {
    console.error("Failed to apply pre-signup role selection:", err);
    return null;
  }
}