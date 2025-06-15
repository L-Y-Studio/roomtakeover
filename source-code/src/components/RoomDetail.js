import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  Container,
  Typography,
  Box,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const RoomDetail = () => {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoom = async () => {
      const roomRef = doc(db, "rooms", id);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        setRoom({ id: roomSnap.id, ...roomSnap.data() });
      }
    };

    fetchRoom();
  }, [id]);

  if (!room) return <div>Loading...</div>;

  return (
    <Container sx={{ py: 4 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)} // Goes back to the previous page
        sx={{ mb: 3 }}
      >
        Back
      </Button>

      <Typography variant="h4" gutterBottom>{room.name}</Typography>
      {room.imageUrl && (
        <img
          src={room.imageUrl}
          alt={room.name}
          style={{
            width: "100%",
            height: "400px",
            objectFit: "cover",
            borderRadius: "8px"
          }}
        />
      )}
      <Box mt={2}>
        <Typography><strong>Price:</strong> ฿{room.price} / month</Typography>
        <Typography><strong>Location:</strong> {room.location}</Typography>
        <Typography><strong>Room Number:</strong> {room.roomNumber}</Typography>
        <Typography><strong>Floor:</strong> {room.floor}</Typography>
        <Typography><strong>Building :</strong> {room.building}</Typography>
        <Typography><strong>Map:</strong> <a href={room.locationMap} target="_blank" rel="noreferrer">View on Google Maps</a></Typography>
        <Typography><strong>Room Type:</strong> {room.roomType}</Typography>
        <Typography><strong>Facilities:</strong> {room.facilities?.join(", ")}</Typography>
        <Typography><strong>Deposit:</strong> ฿{room.deposit}</Typography>
        <Typography><strong>Description:</strong> {room.description}</Typography>
      </Box>
    </Container>
  );
};

export default RoomDetail;
