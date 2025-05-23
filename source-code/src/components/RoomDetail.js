import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

const RoomDetail = () => {
  const { id } = useParams();
  const [room, setRoom] = useState(null);

  useEffect(() => {
    const fetchRoom = async () => {
      const docRef = doc(db, "rooms", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setRoom({ id: docSnap.id, ...docSnap.data() });
      }
    };
    fetchRoom();
  }, [id]);

   if (!room) return <p>Loading...</p>;

  return (
    <div>
  {(room.imageFile || room.imageUrl) && (
    <img
      src={room.imageFile || room.imageUrl}
      alt={room.name}
      style={{ width: "100%", maxWidth: "400px", objectFit: "cover" }}
    />
  )}
  <h1>{room.name}</h1>
  <p>Price: ${room.price}</p>
  <p>Location: {room.location}</p>
  <p>Description: {room.description}</p>
  <p>Posted By: {room.adminName}</p>
  <p>
    Posted At:{" "}
    {room.createdAt?.seconds
      ? new Date(room.createdAt.seconds * 1000).toLocaleDateString()
      : "Unknown"}
  </p>
</div>

  );
};

export default RoomDetail;
