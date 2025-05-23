// hooks/useUserRole.js
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const useUserRole = (user) => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (!user) {
      setRole(null);
      return;
    }

    const fetchRole = async () => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setRole(userSnap.data().role);
      } else {
        setRole("user"); // Default role
      }
    };

    fetchRole();
  }, [user]);

  return role;
};

export default useUserRole;
