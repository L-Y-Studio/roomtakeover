"use client"

import { db, auth } from "../firebase"
import { collection, query, onSnapshot } from "firebase/firestore"
import { useState, useEffect } from "react"
import { SearchBar}
import { useNavigate } from "react-router-dom"
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
} from "@mui/material"
import MessageIcon from "@mui/icons-material/Message"
import { getOrCreateConversation } from "../utils/chatUtils"
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { Link } from "react-router-dom"

const RoomList = () => {
  const [rooms, setRooms] = useState([])
  const [user, setUser] = useState(null)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const q = query(collection(db, "rooms"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRooms(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })

    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })

    return () => {
      unsubscribe()
      authUnsubscribe()
    }
  }, [])

  const handleMessageClick = async (room) => {
    if (!user) {
      setSelectedRoom(room)
      setLoginDialogOpen(true)
      return
    }

    if (user.uid === room.userId) {
      alert("You cannot message yourself!")
      return
    }

    try {
      await getOrCreateConversation(room.userId, room.adminName)
      navigate("/messages")
    } catch (error) {
      console.error("Error starting conversation:", error)
      alert("Failed to start conversation. Please try again.")
    }
  }

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      setLoginDialogOpen(false)

      if (selectedRoom) {
        handleMessageClick(selectedRoom)
      }
    } catch (error) {
      console.error("Login error:", error)
    }
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

          <Link
            to={`/room/${room.id}`}
            key={room.id}
            style={{ textDecoration: "none" }}
          >
            <Card
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
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {room.imageUrl && <Box component="img" src={room.imageUrl} alt={room.name} sx={{ width: "100%", height: 140, objectFit: "cover" }} />}
                </Typography>
                <Typography variant="h6" component="h3" gutterBottom color="primary" sx={{ fontWeight: 600, mb: 2 }}>
                  {room.name}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  ${room.price}/month
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.5 }}>
                  {room.location}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: "auto", fontStyle: "italic" }}>
                  Posted by {room.adminName || "Unknown"}
                </Typography>
              </CardContent>
              
              <Button
              variant="outlined"
              color="primary"
              startIcon={<MessageIcon />}
              onClick={() => handleMessageClick(room)}
              fullWidth
            >
              Message
            </Button>
            </Card>
          </Link>
        ))}



      </Box>
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


export default RoomList
