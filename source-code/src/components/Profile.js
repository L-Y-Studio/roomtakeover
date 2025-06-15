import React, { useState, useEffect } from "react";
import { db, auth, signInWithGoogle } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import LogoutIcon from "@mui/icons-material/Logout";
import EditIcon from "@mui/icons-material/Edit";
import { supabase } from "../utils/supabaseClient";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [userData, setUserData] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    lineId: "",
    messengerName: "",
    profilePictureUrl: "",
  });
  const [newImageFile, setNewImageFile] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setUserData(snap.data());
        }

        const unsubscribeRooms = fetchUserRooms(currentUser.uid);
        return () => unsubscribeRooms();
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const fetchUserRooms = (userId) => {
    const q = query(collection(db, "rooms"), where("userId", "==", userId));
    const unsubscribeRooms = onSnapshot(q, (snapshot) => {
      setRooms(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribeRooms;
  };

  const handleEditOpen = () => {
    setForm({
      name: userData?.name || "",
      phoneNumber: userData?.phoneNumber || "",
      lineId: userData?.lineId || "",
      messengerName: userData?.messengerName || "",
      profilePictureUrl: userData?.profilePictureUrl || "",
    });
    setNewImageFile(null);
    setEditOpen(true);
  };

  const handleSaveProfile = async () => {
    try {
      let profilePictureUrl = form.profilePictureUrl;

      if (newImageFile) {
        const fileExt = newImageFile.name.split(".").pop();
        const filePath = `profile-pictures/${user.uid}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("profile-pictures")
          .upload(filePath, newImageFile, { upsert: true });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          return alert("Failed to upload image");
        }

        const { data } = supabase.storage
          .from("profile-pictures")
          .getPublicUrl(filePath);
        profilePictureUrl = data.publicUrl;
      }

      await updateDoc(doc(db, "users", user.uid), {
        name: form.name,
        phoneNumber: form.phoneNumber,
        lineId: form.lineId,
        messengerName: form.messengerName,
        profilePictureUrl,
        lastActive: new Date(),
      });

      setUserData({
        ...form,
        profilePictureUrl,
      });
      setEditOpen(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error saving profile.");
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4, px: 2 }}>
      {user ? (
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Avatar
            src={userData?.profilePictureUrl || ""}
            sx={{ width: 100, height: 100, mx: "auto", mb: 2 }}
          >
            {userData?.name?.[0]?.toUpperCase() || "U"}
          </Avatar>
          <Typography variant="h5">{userData?.name || user.displayName}</Typography>
          <Typography variant="body2">{user.email}</Typography>
          {userData && (
            <>
              <Typography>📞 {userData.phoneNumber}</Typography>
              <Typography>💬 Line: {userData.lineId}</Typography>
              <Typography>📘 Facebook Link: {userData.messengerName}</Typography>
            </>
          )}
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleEditOpen}
              startIcon={<EditIcon />}
              sx={{ mr: 2 }}
            >
              Edit Profile
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={() => signOut(auth)}
            >
              Sign Out
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography variant="body1" gutterBottom>
            You are not signed in. Please sign in to view your profile.
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
      )}

      {/* Room Cards */}
      {user && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Your Posted Rooms
          </Typography>
          {rooms.length > 0 ? (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 3,
                justifyContent: "center",
              }}
            >
              {rooms.map((room) => (
                <Card
                  key={room.id}
                  sx={{
                    width: 270,
                    height: 270,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    backgroundColor: "background.default",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    transition: "all 0.3s ease",
                    '&:hover': {
                      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                      transform: "translateY(-4px)"
                    }
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      color="primary"
                      sx={{ fontWeight: 550, mb: 2 }}
                      gutterBottom
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
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        lineHeight: 1.5,
                        mb: 1
                      }}
                    >
                      {room.location}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Status: {room.status}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Typography align="center" sx={{ mt: 2 }}>
              No rooms posted yet.
            </Typography>
          )}
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Your Profile</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Name"
              fullWidth
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              label="Phone Number"
              fullWidth
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            />
            <TextField
              label="Line ID"
              fullWidth
              value={form.lineId}
              onChange={(e) => setForm({ ...form, lineId: e.target.value })}
            />
            <TextField
              label="Facebook Link"
              fullWidth
              value={form.messengerName}
              onChange={(e) => setForm({ ...form, messengerName: e.target.value })}
            />
            <p>Upload profile picture</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewImageFile(e.target.files[0])}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveProfile}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
