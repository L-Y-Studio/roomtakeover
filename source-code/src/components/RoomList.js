"use client";

import { TextField } from "@mui/material";
import { db, auth } from "../firebase";
import { collection, query, onSnapshot } from "firebase/firestore";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import MessageIcon from "@mui/icons-material/Message";
import { getOrCreateConversation } from "../utils/chatUtils";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { Link } from "react-router-dom";

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [user, setUser] = useState(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "rooms"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRooms(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => {
      unsubscribe();
      authUnsubscribe();
    };
  }, []);

  const handleMessageClick = async (room) => {
    if (!user) {
      setSelectedRoom(room);
      setLoginDialogOpen(true);
      return;
    }

    if (user.uid === room.userId) {
      alert("You cannot message yourself!");
      return;
    }

    try {
      await getOrCreateConversation(room.userId, room.adminName);
      navigate("/messages");
    } catch (error) {
      console.error("Error starting conversation:", error);
      alert("Failed to start conversation. Please try again.");
    }
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setLoginDialogOpen(false);

      if (selectedRoom) {
        handleMessageClick(selectedRoom);
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

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

      {/* Search and Price Filter */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <TextField
          label="Search condos..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flex: 2, minWidth: 200 }}
        />
        <TextField
          label="Min Price"
          variant="outlined"
          type="number"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          sx={{ flex: 1, minWidth: 100 }}
        />
        <TextField
          label="Max Price"
          variant="outlined"
          type="number"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          sx={{ flex: 1, minWidth: 100 }}
        />
      </Box>

      {/* Room Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "1fr 1fr 1fr",
          },
          gap: 3,
        }}
      >
        {rooms
          .filter((room) => room.status === "approved")
          .filter((room) => {
            const price = Number(room.price);
            const min = minPrice ? Number(minPrice) : 0;
            const max = maxPrice ? Number(maxPrice) : Infinity;
            return price >= min && price <= max;
          })
          .filter(
            (room) =>
              room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              room.location.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((room) => (
            <Link
              to={`/room/${room.id}`}
              key={room.id}
              style={{ textDecoration: "none" }}
            >
              <Card
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backgroundColor: "background.default",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                    transform: "translateY(-4px)",
                  },
                  overflow: "hidden",
                }}
              >
                {room.imageUrl && (
                  <Box
                    component="img"
                    src={room.imageUrl}
                    alt={room.name}
                    sx={{
                      width: "100%",
                      height: 150,
                      objectFit: "cover",
                    }}
                  />
                )}

                <CardContent sx={{ p: 2, flexGrow: 1 }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    color="primary"
                    sx={{ fontWeight: 600 }}
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
                    sx={{ fontStyle: "italic" }}
                  >
                    Posted by {room.adminName || "Unknown"}
                  </Typography>
                </CardContent>

                <Box sx={{ p: 2 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<MessageIcon />}
                    onClick={() => handleMessageClick(room)}
                    fullWidth
                  >
                    Message
                  </Button>
                </Box>
              </Card>
            </Link>
          ))}
      </Box>

      {/* Login Dialog */}
      <Dialog open={loginDialogOpen} onClose={() => setLoginDialogOpen(false)}>
        <DialogTitle>Sign In Required</DialogTitle>
        <DialogContent>
          <Typography>You need to sign in to message room owners.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoginDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleLogin} variant="contained" color="primary">
            Sign In with Google
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RoomList;
