import React, { useState, useEffect } from "react";
import { db, auth, signInWithGoogle } from "../firebase";
import { collection, addDoc, query, onSnapshot, deleteDoc, doc  } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

const AdminPage = () => {
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [user, setUser] = useState(null);


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

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this room?");
    if (!confirmDelete) return;
  
    try {
      await deleteDoc(doc(db, "rooms", id));
      alert("Room deleted successfully!");
    } catch (error) {
      console.error("Error deleting room:", error);
      alert("Failed to delete room.");
    }
  };

  
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
      <h2>Admin</h2>

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


<div className="room-list">
      <h2>All Rooms Listed</h2>
      
      <ul className="room-list-ul">
      {rooms.map((room) => (
          <div key={room.id}>
            <strong>{room.name}</strong>
            <br></br>$ {room.price}/month 
            <br></br>Location - {room.location}
            <br />
            <small>Posted by {room.adminName || "Unknown"}</small>
            <br></br>
            <button onClick={() => handleDelete(room.id)}>Delete Room</button>

          </div>
        ))}
      </ul>
      </div>

    </div>
  );
};

export default AdminPage;
