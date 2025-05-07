import { db } from "../firebase";
import { collection, query, onSnapshot } from "firebase/firestore";
import { useState, useEffect } from "react";
import React from "react";
import "./RoomList.css";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
} from "@mui/material";

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
    <Container sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h2"
        gutterBottom
        align="center"
        sx={{ mb: 4 }}
      >
        Available Rooms around ABAC
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 3,
        }}
      >
        {rooms.filter((room) => room.status === "approved").map((room) => (
          <Card
          key={room.id}
          sx={{
            width: 270,
            height: 250,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "background.default",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            transition: "all 0.3s ease",
            '&:hover': {
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
              transform: "translateY(-4px)",
            },
            p: 2
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <Typography
              variant="h6"
              component="h3"
              gutterBottom
              color="primary"
              sx={{ fontWeight: 600, mb: 2 }}
            >
              {room.name}
            </Typography>
        
            <Typography variant="body1" sx={{ mb: 1 }}>
              ${room.price}/month
            </Typography>
        
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                whiteSpace: "normal",
                wordBreak: "break-word",
                lineHeight: 1.5,
              }}
            >
              {room.location}
            </Typography>
        
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: "auto", fontStyle: "italic" }}
            >
              Posted by {room.adminName || "Unknown"}
            </Typography>
          </CardContent>
        </Card>
        
        ))}
        </Box></Container>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 3,
        }}
      >
        {rooms.map((room) => (
          <Card
          key={room.id}
          sx={{
            width: 270,
            height: 250,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "background.default",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            transition: "all 0.3s ease",
            '&:hover': {
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
              transform: "translateY(-4px)",
            },
            p: 2
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <Typography
              variant="h6"
              component="h3"
              gutterBottom
              color="primary"
              sx={{ fontWeight: 600, mb: 2 }}
            >
              {room.name}
            </Typography>
        
            <Typography variant="body1" sx={{ mb: 1 }}>
              ${room.price}/month
            </Typography>
        
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                whiteSpace: "normal",
                wordBreak: "break-word",
                lineHeight: 1.5,
              }}
            >
              {room.location}
            </Typography>
        
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: "auto", fontStyle: "italic" }}
            >
              Posted by {room.adminName || "Unknown"}
            </Typography>
          </CardContent>
        </Card>
        
        ))}
      </Box>
    </Container>
  );
};

export default RoomList;
