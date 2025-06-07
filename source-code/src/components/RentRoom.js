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
  const [building, setBuilding] = useState("");
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
  const [contract, setContract] = useState("");
  const [electric, setElectric] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [locationMap, setLocationMap] = useState("");
  const [roomType, setRoomType] = useState("");
  const [facilities, setFacilities] = useState([]);
  const [taxiService, setTaxiService] = useState("no");
  const [vanService, setVanService] = useState("no");
  const [deposit, setDeposit] = useState("");

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
        contract,
        electric,
        roomNumber,
        floor,
        locationMap,
        roomType,
        facilities,
        taxiService,
        vanService,
        deposit: parseFloat(deposit),
        createdAt: new Date(),
        userId: user.uid,
        adminName: user.displayName,
        status: "pending",
        building,
      });

      alert("Room added successfully!");
      setRoomName("");
      setPrice("");
      setBuilding("");
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
        contract,
        electric,
        roomNumber,
        floor,
        locationMap,
        roomType,
        facilities,
        taxiService,
        vanService,
        deposit: parseFloat(deposit),
        building,
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

        <Box sx={{ mt: 5, mb: 4, maxWidth: 800, width: "100%" }}>
          <Typography variant="h6">Add New Room</Typography>
          <br></br>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
  <Grid item xs={12} sm={1}>
    <TextField label="Condo Name" fullWidth value={roomName} onChange={(e) => setRoomName(e.target.value)} required />
  </Grid>
  <Grid item xs={12} sm={6}>
    <TextField label="Room Number" fullWidth value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} required/>
  </Grid>

  <Grid item xs={12} sm={6}>
    <TextField label="Contract Duration" fullWidth value={contract} onChange={(e) => setContract(e.target.value)} required/>
  </Grid>
  <Grid item xs={12} sm={6}>
    <TextField label="Electric Rate (per unit)" fullWidth value={electric} onChange={(e) => setElectric(e.target.value)} required/>
  </Grid>

  <Grid item xs={12} sm={6}>
    <TextField label="Floor" fullWidth value={floor} onChange={(e) => setFloor(e.target.value)} required/>
  </Grid>
  <Grid item xs={12} sm={6} >
    <TextField label="Building" fullWidth value={building} onChange={(e) => setBuilding(e.target.value)} />
  </Grid>
  

  <Grid item xs={12} sm={6}>
    <TextField
      label=""
      select
      SelectProps={{ native: true }}
      fullWidth
      value={roomType}
      onChange={(e) => setRoomType(e.target.value)}
      sx={{ width: '123%' }}
    >
      <option value="">Select Room Type</option>
      <option value="studio">Studio</option>
      <option value="standard">Standard</option>
      <option value="double">Double</option>
      <option value="villa">Villa</option>
    </TextField>
  </Grid>

  <Grid item xs={12}>
    <Typography variant="subtitle1" sx={{ mb: 1 }}>Facilities</Typography>
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
      {["swimming", "gym", "cleaning", "microwave", "washing machine", "wifi", "refrigerator", "air-con", "office service", "security", "parking", "smoking", "pet friendly", "guest"].map((f) => (
        <label key={f}>
          <input
            type="checkbox"
            checked={facilities.includes(f)}
            onChange={(e) => {
              if (e.target.checked) {
                setFacilities([...facilities, f]);
              } else {
                setFacilities(facilities.filter((item) => item !== f));
              }
            }}
          />
          {" " + f}
        </label>
      ))}
    </Box>
  </Grid>

  <Grid item xs={12} sm={6} sx={{ width: '20%' }}>
    <TextField label="Taxi Service" select SelectProps={{ native: true }} fullWidth value={taxiService} onChange={(e) => setTaxiService(e.target.value)} >
      <option value="no">No</option>
      <option value="yes">Yes</option>
    </TextField>
  </Grid>

  <Grid item xs={12} sm={6} sx={{ width: '20%' }}>
    <TextField label="Van Service" select SelectProps={{ native: true }} fullWidth value={vanService} onChange={(e) => setVanService(e.target.value)}>
      <option value="no">No</option>
      <option value="yes">Yes</option>
    </TextField>
  </Grid>
  <Grid item xs={12} sm={6} sx={{ width: '42%' }}>
    <TextField label="Deposit Amount" type="number" fullWidth value={deposit} onChange={(e) => setDeposit(e.target.value)} required/>
  </Grid>
  <Grid item xs={12} sm={6} sx={{ width: '20%' }}>
    <TextField label="Price" type="number" fullWidth value={price} onChange={(e) => setPrice(e.target.value)} required InputProps={{ startAdornment: <AttachMoneyIcon color="action" /> }} />
  </Grid>

  <Grid item xs={12} sx={{ width: '65%' }}>
    <TextField label="Location" fullWidth value={location} onChange={(e) => setLocation(e.target.value)} required InputProps={{ startAdornment: <LocationOnIcon color="action" /> }}  />
  </Grid>
  <Grid item xs={12} sm={6} sx={{ width: '35%' }} >
    <TextField label="Google Map URL" fullWidth value={locationMap} onChange={(e) => setLocationMap(e.target.value)} />
  </Grid>

  <Grid item xs={12} sx={{ width: '50%' }}>
    <TextField label="Image URL (optional if uploading)" fullWidth value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
  </Grid>

  

  <Grid item xs={12} sx={{ width: '65%' }}>
    <TextField label="Description" multiline rows={3} fullWidth value={description} onChange={(e) => setDescription(e.target.value)} required />
  </Grid>

  <Grid item xs={12}>
    <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
    {imageFile && <img src={URL.createObjectURL(imageFile)} alt="preview" style={{ width: "100%", maxHeight: 200, objectFit: "cover", marginTop: 8 }} />}
  </Grid>

  <Grid item xs={12}>
    <Button type="submit" variant="contained" size="large" fullWidth>Add Room</Button>
  </Grid>
</Grid>

          </form>
        </Box>
      </Box>

      <Typography variant="h6" gutterBottom>Your Pending Rooms</Typography>
      <Grid
        container
        spacing={3}
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 3,
          mb: 4
        }}
      >
        {rooms.filter((room) => room.userId === user.uid && room.status === "pending").map((room) => (
          <Card
            key={room.id}
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
              <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
                {room.name}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                ฿{room.price}/month
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
              <Typography variant="caption" color="warning.main" sx={{ fontStyle: "italic" }}>
                Status: Pending
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Grid>

      <Typography variant="h5" sx={{ mb: 3 }}>Your Rooms Listed</Typography>
      <Grid
        container
        spacing={3}
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 3,
        }}
      >
        {rooms.filter((room) => room.status === "approved" && room.userId === user.uid).map((room) => (
          <Card
            key={room.id}
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
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                  {room.name}
                </Typography>
                <Box>
                  <IconButton
                    color="primary"
                    onClick={() => {
                      setRoomToEdit(room);
                      setRoomName(room.name);
                      setPrice(room.price);
                      setBuilding(room.building);
                      setLocation(room.location);
                      setImageUrl(room.imageUrl);
                      setImageFile(null);
                      setDescription(room.description);
                      setEditDialogOpen(true);
                      setContract(room.contract || "");
                      setElectric(room.electric || "");
                      setRoomNumber(room.roomNumber || "");
                      setFloor(room.floor || "");
                      setLocationMap(room.locationMap || "");
                      setRoomType(room.roomType || "");
                      setFacilities(room.facilities || []);
                      setTaxiService(room.taxiService || "no");
                      setVanService(room.vanService || "no");
                      setDeposit(room.deposit || "");
                    }}
                  >
                    <EditIcon />
                  </IconButton>
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
              </Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                ฿{room.price}/month
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
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                Posted by {room.adminName || "Unknown"}
              </Typography>
            </CardContent>
          </Card>
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
            <br></br>
            <TextField label="Condo Name" fullWidth value={roomName} onChange={(e) => setRoomName(e.target.value)} required />
                <TextField label="Room Number" fullWidth value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} required />
              <TextField label="Contract Duration" fullWidth value={contract} onChange={(e) => setContract(e.target.value)} required/>
              <TextField label="Electric Rate (per unit)" fullWidth value={electric} onChange={(e) => setElectric(e.target.value)} required/>
              
              <TextField label="Floor" fullWidth value={floor} onChange={(e) => setFloor(e.target.value)} required/>
              <TextField label="Building" fullWidth value={building} onChange={(e) => setBuilding(e.target.value)} />

              <TextField label="Google Map URL" fullWidth value={locationMap} onChange={(e) => setLocationMap(e.target.value)} />
              <TextField
                label=""
                select
                SelectProps={{ native: true }}
                fullWidth
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
              >
                <option value="">Select Room Type</option>
                <option value="studio">Studio</option>
                <option value="standard">Standard</option>
                <option value="double">Double</option>
                <option value="villa">Villa</option>
              </TextField>

              <Box>
                <Typography variant="subtitle1">Facilities</Typography>
                {["swimming", "gym", "cleaning", "microwave", "washing machine", "wifi", "refrigerator", "air-con", "office service", "security", "parking", "smoking", "pet friendly", "guest"].map((f) => (
                  <label key={f} style={{ marginRight: 10 }}>
                    <input
                      type="checkbox"
                      checked={facilities.includes(f)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFacilities([...facilities, f]);
                        } else {
                          setFacilities(facilities.filter((item) => item !== f));
                        }
                      }}
                    />
                    {" " + f}
                  </label>
                ))}
              </Box>

              <TextField label="Taxi Service" select SelectProps={{ native: true }} fullWidth value={taxiService} onChange={(e) => setTaxiService(e.target.value)}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </TextField>

              <TextField label="Van Service" select SelectProps={{ native: true }} fullWidth value={vanService} onChange={(e) => setVanService(e.target.value)}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </TextField>

              <TextField label="Deposit Amount" type="number" fullWidth value={deposit} onChange={(e) => setDeposit(e.target.value)} required/>

              
              <TextField label="Price" type="number" fullWidth value={price} onChange={(e) => setPrice(e.target.value)} required InputProps={{ startAdornment: <AttachMoneyIcon color="action" /> }} />
              <TextField label="Location" fullWidth value={location} onChange={(e) => setLocation(e.target.value)} required InputProps={{ startAdornment: <LocationOnIcon color="action" /> }} />
              <TextField label="Image URL (optional if uploading)" fullWidth value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
              {imageFile && <img src={URL.createObjectURL(imageFile)} alt="preview" style={{ width: "100%", maxHeight: 200, objectFit: "cover" }} />}
              <TextField label="Description" multiline rows={3} fullWidth value={description} onChange={(e) => setDescription(e.target.value)} required />

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
