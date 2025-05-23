import React, { useState, useEffect } from "react";
import { db, auth, signInWithGoogle } from "../firebase";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Box,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import LogoutIcon from "@mui/icons-material/Logout";
import DeleteIcon from "@mui/icons-material/Delete";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { supabase } from "../utils/supabaseClient";

const RentRoom = () => {
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [user, setUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "rooms"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRooms(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const uploadImageToSupabase = async () => {
    if (!imageFile) return null;

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `room-images/${fileName}`;

    const { error } = await supabase.storage
      .from("room-images")
      .upload(filePath, imageFile);

    if (error) {
      console.error("Image upload error:", error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("room-images")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "rooms", id));
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  };

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
      const imageUrl = await uploadImageToSupabase();

      await addDoc(collection(db, "rooms"), {
        name: roomName,
        price: parseFloat(price),
        location,
        imageUrl: imageUrl || "",
        createdAt: new Date(),
        userId: user.uid,
        adminName: user.displayName,
        status: "pending",
      });

      alert("Room added successfully!");
      setRoomName("");
      setPrice("");
      setLocation("");
      setImageFile(null);
    } catch (error) {
      console.error("Error adding room:", error);
      alert("Failed to add room.");
    }
  };

  if (loadingAuth) {
    return <div>Loading user...</div>;
  }

  if (!user) {
    return (
      <Container sx={{ py: 4 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography variant="body1" gutterBottom>
            You are not signed in. Please sign in to post a room.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<GoogleIcon />}
            onClick={signInWithGoogle}
          >
            Sign In with Google
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h2"
        gutterBottom
        align="center"
        sx={{ mb: 4 }}
      >
        Rent Your Room
      </Typography>

      <Box sx={{ mb: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Typography variant="h6" gutterBottom>
          Welcome, {user.displayName}
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<LogoutIcon />}
          onClick={() => signOut(auth)}
        >
          Sign Out
        </Button>

        <Box sx={{ mt: 5, mb: 4, maxWidth: 400, width: "100%" }}>
          <Typography variant="h6" gutterBottom>
            Add New Room
          </Typography>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Room Name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required
              />
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                InputProps={{
                  startAdornment: <AttachMoneyIcon color="action" />,
                }}
              />
              <TextField
                fullWidth
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                InputProps={{
                  startAdornment: <LocationOnIcon color="action" />,
                }}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
              />
              {imageFile && (
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="preview"
                  style={{ width: "100%", maxHeight: 200, objectFit: "cover" }}
                />
              )}
              <Button type="submit" variant="contained" color="primary" size="large">
                Add Room
              </Button>
            </Stack>
          </form>
        </Box>
      </Box>

      <Typography variant="h6" gutterBottom>Your Pending Rooms</Typography>
      <Grid container spacing={3}>
        {rooms
          .filter((room) => room.userId === user.uid && room.status === "pending")
          .map((room) => (
            <Grid item xs={12} sm={6} md={4} key={room.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{room.name}</Typography>
                  <Typography color="warning.main">Status: Pending</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>

      <Typography variant="h5" gutterBottom sx={{ mt: 5, mb: 3 }}>
        Your Rooms Listed
      </Typography>

      <Grid container spacing={3}>
        {rooms
          .filter((room) => room.status === "approved" && room.userId === user.uid)
          .map((room) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={room.id}>
              <Card sx={{ height: 330 }}>
                {room.imageUrl && (
                  <img
                    src={room.imageUrl}
                    alt={room.name}
                    style={{
                      width: "100%",
                      height: 150,
                      objectFit: "cover",
                      borderTopLeftRadius: 4,
                      borderTopRightRadius: 4,
                    }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="h6" color="primary">
                      {room.name}
                    </Typography>
                    <IconButton
                      color="error"
                      onClick={() => {
                        setSelectedRoom(room);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Typography>${room.price}/month</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {room.location}
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 2, display: "block" }}>
                    Posted by {room.adminName || "Unknown"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Room</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedRoom?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => handleDelete(selectedRoom?.id)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RentRoom;
