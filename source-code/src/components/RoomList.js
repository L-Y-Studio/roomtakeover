import { db } from "../firebase"; // Ensure this is correct
import { collection, query, onSnapshot } from "firebase/firestore";
import { useState, useEffect } from "react";
import React from "react";
import "./RoomList.css";

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  useEffect(() => {
    const q = query(collection(db, "rooms"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRooms(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  return (
    
      <div className="room-list">
      <h2>Available Rooms around ABAC</h2>
      
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
      </div>

  );
};

export default RoomList;
