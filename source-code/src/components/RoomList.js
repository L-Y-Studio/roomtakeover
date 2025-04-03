import { db } from "../firebase"; // Ensure this is correct
import { collection, query, onSnapshot } from "firebase/firestore";
import { useState, useEffect } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const navigate = useNavigate(); // Hook to navigate between pages
  useEffect(() => {
    const q = query(collection(db, "rooms"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRooms(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  return (
    
    <div>
      <button onClick={() => navigate("/profile")}>Go to Profile</button>
      <h2>Available Rooms</h2>
      <h3>Add new room  
      <button onClick={() => navigate("/admin")}>Go to Admin</button></h3>
      <ul>
      {rooms.map((room) => (
          <li key={room.id}>
            <strong>{room.name}</strong> - ${room.price}/month "Near {room.location}"  
            <br />
            <small>Posted by {room.adminName || "Unknown"}</small>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RoomList;
