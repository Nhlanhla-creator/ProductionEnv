// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext({
  user: null,
  userData: null,
  userRoles: [],
  loading: true,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [userRoles, setUserRoles] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserData(data);

            let roles = [];
            if (Array.isArray(data.roleArray)) {
              roles = [...roles, ...data.roleArray];
            }
            if (data.role && typeof data.role === "string") {
              const roleString = data.role.replace(/\s/g, "");
              roles = [...roles, ...roleString.split(",").filter(Boolean)];
            }
            setUserRoles([...new Set(roles)]);
          } else {
            setUserData(null);
            setUserRoles([]);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData(null);
          setUserRoles([]);
        }
      } else {
        setUserData(null);
        setUserRoles([]);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, userRoles, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Same shape your components already expect.
export function useAuth() {
  return useContext(AuthContext);
}