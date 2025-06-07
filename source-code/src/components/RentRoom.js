import React, { useState, useEffect } from "react";
import { db, auth, signInWithGoogle } from "../firebase";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc
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
import EditIcon from "@mui/icons-material/Edit";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { supabase } from "../utils/supabaseClient";

const RentRoom = () => {
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [user, setUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomToEdit, setRoomToEdit] = useState(null);
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
    if (!roomName || !price || !location || (!imageFile && !imageUrl) || !description) {
      alert("Please fill all fields (including either image upload or URL)");
      return;
    }

    try {
      let finalImageUrl = imageUrl;

      if (imageFile) {
        const uploadedUrl = await uploadImageToSupabase();
        finalImageUrl = uploadedUrl || imageUrl;
      }

      await addDoc(collection(db, "rooms"), {
        name: roomName,
        price: parseFloat(price),
        location,
        imageUrl: finalImageUrl,
        description,
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
      setImageUrl("");
      setDescription("");
    } catch (error) {
      console.error("Error adding room:", error);
      alert("Failed to add room.");
    }
  };

  const handleEditSave = async () => {
    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        const uploadedUrl = await uploadImageToSupabase();
        finalImageUrl = uploadedUrl || imageUrl;
      }

      await updateDoc(doc(db, "rooms", roomToEdit.id), {
        name: roomName,
        price: parseFloat(price),
        location,
        imageUrl: finalImageUrl,
        description,
      });
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating room:", error);
    }
  };

  if (loadingAuth) return <div>Loading user...</div>;
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
      <Typography variant="h4" align="center" gutterBottom>Rent Your Room</Typography>

      <Box sx={{ mb: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Typography variant="h6">Welcome, {user.displayName}</Typography>
        <Button variant="outlined" startIcon={<LogoutIcon />} onClick={() => signOut(auth)}>
          Sign Out
        </Button>

        <Box sx={{ mt: 5, mb: 4, maxWidth: 400, width: "100%" }}>
          <Typography variant="h6">Add New Room</Typography>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField label="Condo Name" fullWidth value={roomName} onChange={(e) => setRoomName(e.target.value)} required />
              <TextField label="Price" type="number" fullWidth value={price} onChange={(e) => setPrice(e.target.value)} required InputProps={{ startAdornment: <AttachMoneyIcon color="action" /> }} />
              <TextField label="Location" fullWidth value={location} onChange={(e) => setLocation(e.target.value)} required InputProps={{ startAdornment: <LocationOnIcon color="action" /> }} />
              <TextField label="Image URL (optional if uploading)" fullWidth value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
              {imageFile && <img src={URL.createObjectURL(imageFile)} alt="preview" style={{ width: "100%", maxHeight: 200, objectFit: "cover" }} />}
              <TextField label="Description" multiline rows={3} fullWidth value={description} onChange={(e) => setDescription(e.target.value)} required />
              <Button type="submit" variant="contained" size="large">Add Room</Button>
            </Stack>
          </form>
        </Box>
      </Box>

      <Typography variant="h6" gutterBottom>Your Pending Rooms</Typography>
      <Grid container spacing={3}>
        {rooms.filter((room) => room.userId === user.uid && room.status === "pending").map((room) => (
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

      <Typography variant="h5" sx={{ mt: 5, mb: 3 }}>Your Rooms Listed</Typography>
      <Grid container spacing={3}>
        {rooms.filter((room) => room.status === "approved" && room.userId === user.uid).map((room) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={room.id}>
            <Card sx={{ height: 330 }}>
              {room.imageUrl && <img src={room.imageUrl} alt={room.name} style={{ width: "100%", height: 150, objectFit: "cover" }} />}
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" color="primary">{room.name}</Typography>
                  <Box>
                    <IconButton color="primary" onClick={() => {
                      setRoomToEdit(room);
                      setRoomName(room.name);
                      setPrice(room.price);
                      setLocation(room.location);
                      setImageUrl(room.imageUrl);
                      setImageFile(null);
                      setDescription(room.description);
                      setEditDialogOpen(true);
                    }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => {
                      setSelectedRoom(room);
                      setDeleteDialogOpen(true);
                    }}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Typography>${room.price}/month</Typography>
                <Typography variant="body2" color="text.secondary">{room.location}</Typography>
                <Typography variant="caption" sx={{ mt: 2, display: "block" }}>Posted by {room.adminName || "Unknown"}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Room</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete "{selectedRoom?.name}"?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => handleDelete(selectedRoom?.id)} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Room</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <TextField label="Room Name" fullWidth value={roomName} onChange={(e) => setRoomName(e.target.value)} />
            <TextField label="Price" fullWidth type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            <TextField label="Location" fullWidth value={location} onChange={(e) => setLocation(e.target.value)} />
            <TextField label="Image URL" fullWidth value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
            {imageFile && <img src={URL.createObjectURL(imageFile)} alt="preview" style={{ width: "100%", maxHeight: 200, objectFit: "cover" }} />}
            <TextField label="Description" fullWidth multiline rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RentRoom;
