import React, { useState, useEffect } from "react";
import { db, auth, signInWithGoogle } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Container
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { supabase } from "../utils/supabaseClient";
import GoogleIcon from "@mui/icons-material/Google";
import LogoutIcon from "@mui/icons-material/Logout";
import { useFloatingChat } from "../contexts/FloatingChatContext";
 
const Profile = () => {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {user ? (
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Avatar
            sx={{
              width: 100,
              height: 100,
              mx: "auto",
              mb: 2,
              color: "secondary.main",
              fontSize: 40,
              fontWeight: "bold",
              bgcolor: "primary.main"
            }}
          >
            {user.displayName?.[0]?.toUpperCase() ||
              user.email?.[0]?.toUpperCase() ||
              "U"}
          </Avatar>
          <Typography variant="h5" gutterBottom>
            {user.displayName}
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<LogoutIcon />}
            onClick={() => signOut(auth)}
            sx={{ mt: 2 }}
          >
            Sign Out
          </Button>
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

      {user && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Your Posted Rooms
          </Typography>

          {rooms.length > 0 ? (
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
              {rooms.map((room) => (
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
                      Status: {room.status}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Grid>
          ) : (
            <Typography
              variant="body1"
              color="text.secondary"
              align="center"
              sx={{ mt: 2 }}
            >
              No rooms posted yet.
            </Typography>
          )}
        </Box>
      )}
    </Container>
  );
};

export default Profile;
