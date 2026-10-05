import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { resolveProfile } from "./calendarData";

// Role-aware replacement for the hook in your message; current Auth UID remains canonical.
export function useUserProfile(config) {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState(config.label || "User");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (!currentUser) {
        if (active) { setUser(null); setUserName(config.label || "User"); setEmail(""); setLoading(false); }
        return;
      }
      if (active) setUser(currentUser);
      const profile = await resolveProfile(currentUser.uid, config, currentUser);
      if (active) { setUserName(profile.name); setEmail(profile.email); setLoading(false); }
    });
    return () => { active = false; unsubscribe(); };
  }, [config]);
  return { user, userName, email, loading };
}
