import React, { useState, useEffect } from "react";
import { db, auth, signInWithGoogle } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { useNavigate } from "react-router-dom";

const AdminPage = () => {
  const [roomName, setRoomName] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [user, setUser] = useState(null);

  const navigate = useNavigate(); // Hook to navigate between pages
  // Check if user is signed in when entering the page
  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        signInWithGoogle(); // Trigger login popup
      }
      setUser(currentUser);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("You must be signed in to add rooms.");
      return;
    }

    if (!roomName || !price || !location) {
      alert("Please fill all fields");
      return;
    }

    try {
      await addDoc(collection(db, "rooms"), {
        name: roomName,
        price: parseFloat(price),
        location: location,
        createdAt: new Date(),
        userId: user.uid, // Store user ID for reference
      });

      alert("Room added successfully!");
      setRoomName("");
      setPrice("");
      setLocation("");
    } catch (error) {
      console.error("Error adding room:", error);
      alert("Failed to add room.");
    }
  };

  return (
    <div>
      <h2>Admin - Add a Room</h2>
      <button onClick={() => navigate("/")}>Go to Room Listing</button>
      {user ? (
        <>
          <p>Signed in as {user.displayName}</p>
          <button onClick={() => signOut(auth)}>Sign Out</button>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Room Name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
            <input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button type="submit">Add Room</button>
          </form>
        </>
      ) : (
        <p>Loading sign-in...</p>
      )}
    </div>
  );
};

export default AdminPage;
