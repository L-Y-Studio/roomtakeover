import React, { useState, useEffect } from "react";
import { db, auth, signInWithGoogle } from "../firebase";
import { collection, addDoc, query, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const AdminPage = () => {
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  // Fetch room listings
  useEffect(() => {
    const q = query(collection(db, "rooms"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRooms(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Check user authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Handle form submission
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
        location,
        createdAt: new Date(),
        userId: user.uid, // Store admin's user ID
        adminName: user.displayName, // Store admin's name
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
        <>
          <p>You are not signed in.</p>
          <button onClick={signInWithGoogle}>Sign In with Google</button>
        </>
      )}

      <h3>Room Listings</h3>
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

export default AdminPage;
