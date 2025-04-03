import React, { useState, useEffect } from "react";
import { db, auth, signInWithGoogle } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        signInWithGoogle(); // Trigger login popup if not signed in
      }
      setUser(currentUser);
      if (currentUser) {
        fetchUserRooms(currentUser.uid);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const fetchUserRooms = (userId) => {
    const q = query(collection(db, "rooms"), where("userId", "==", userId));
    const unsubscribeRooms = onSnapshot(q, (snapshot) => {
      setRooms(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribeRooms();
  };

  return (
    <div>
      <h2>Profile</h2>
      {user ? (
        <>
          <p>Name: {user.displayName}</p>
          <button onClick={() => signOut(auth)}>Sign Out</button>
          <h3>Your Posted Rooms:</h3>
          {rooms.length > 0 ? (
            <ul>
              {rooms.map((room) => (
                <li key={room.id}>
                  {room.name} - ${room.price}/month - {room.location}
                </li>
              ))}
            </ul>
          ) : (
            <p>No rooms posted yet.</p>
          )}
        </>
      ) : (
        <p>Loading user info...</p>
      )}
      <button onClick={() => navigate("/")}>Go to Room Listing</button>
    </div>
  );
};

export default Profile;