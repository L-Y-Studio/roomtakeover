import React, { useState, useEffect } from "react";
import { db, auth, signInWithGoogle } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import "./RoomList.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      
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

          <div className="room-list">
          <h3>Your Posted Rooms:</h3>

          {rooms.length > 0 ? (
            <ul className="room-list-ul">
              {rooms.map((room) => (
          <div key={room.id}>
            <strong>{room.name}</strong>
            <br></br>$ {room.price}/month 
            <br></br>Location - {room.location}
            <br />
            <small>Posted by {room.adminName || "Unknown"}</small>
          </div>
        ))}
            </ul>
          ) : (
            <p>No rooms posted yet.</p>
            
          )}
          </div>
        </>
      ) : (
              <>
                <p>You are not signed in.</p>
                <button onClick={signInWithGoogle}>Sign In with Google</button>
              </>
            )}
    </div>
  );
};

export default Profile;