import React, { useState } from "react";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { supabase } from "../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  Container,
  TextField,
  Button,
  Typography,
  Stack
} from "@mui/material";

const SetupProfile = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [lineId, setLineId] = useState("");
  const [messengerName, setMessengerName] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const uploadProfilePicture = async (file) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `profile-pictures/${fileName}`;
    const { error } = await supabase.storage.from("profile-pictures").upload(filePath, file);
    if (error) {
      console.error("Upload error:", error);
      return null;
    }
    const { data } = supabase.storage.from("profile-pictures").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);

    try {
      let profilePictureUrl = "";
      if (profilePic) {
        const uploadedUrl = await uploadProfilePicture(profilePic);
        profilePictureUrl = uploadedUrl;
      }

      await updateDoc(doc(db, "users", user.uid), {
        phoneNumber,
        lineId,
        messengerName,
        profilePictureUrl
      });

      navigate("/profile");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 5 }}>
      <Typography variant="h5" gutterBottom>Complete Your Profile</Typography>
      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField label="Phone Number" fullWidth required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
          <TextField label="Line ID" fullWidth required value={lineId} onChange={(e) => setLineId(e.target.value)} />
          <TextField label="Messenger Link" fullWidth required value={messengerName} onChange={(e) => setMessengerName(e.target.value)} />
            <p>Upload profile picture *</p>
          <input type="file" accept="image/*" onChange={(e) => setProfilePic(e.target.files[0])} />
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Saving..." : "Save Profile"}
          </Button>
        </Stack>
      </form>
    </Container>
  );
};

export default SetupProfile;
