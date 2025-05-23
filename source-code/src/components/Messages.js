"use client"

import { useState, useEffect } from "react"
import { db, auth } from "../firebase"
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Paper,
  Button,
  CircularProgress,
} from "@mui/material"
import GoogleIcon from "@mui/icons-material/Google"
import { signInWithGoogle } from "../firebase"
import Chat from "./Chat"

const Messages = () => {
  const [user, setUser] = useState(null)
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        fetchConversations(currentUser.uid)
      } else {
        setLoading(false)
      }
    })
    return () => unsubscribe()
  }, [])

  const fetchConversations = (userId) => {
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", userId),
      orderBy("lastMessageTime", "desc"),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversationData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setConversations(conversationData)
      setLoading(false)
    })

    return () => unsubscribe()
  }

  const handleSelectConversation = (conversation) => {
    // Find the other participant (not the current user)
    const otherParticipantId = conversation.participants.find((id) => id !== user.uid)

    setSelectedConversation({
      id: conversation.id,
      recipientId: otherParticipantId,
      recipientName: conversation.participantNames[otherParticipantId],
    })
  }

  if (!user) {
    return (
      <Container sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>
          Messages
        </Typography>
        <Typography variant="body1" gutterBottom>
          Please sign in to view your messages.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<GoogleIcon />}
          onClick={signInWithGoogle}
          sx={{ mt: 2 }}
        >
          Sign In with Google
        </Button>
      </Container>
    )
  }

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    )
  }

  if (selectedConversation) {
    return (
      <Container sx={{ py: 4 }}>
        <Button variant="outlined" onClick={() => setSelectedConversation(null)}>
          Back
        </Button>
        <Chat
          conversationId={selectedConversation.id}
          recipientId={selectedConversation.recipientId}
          recipientName={selectedConversation.recipientName}
        />
      </Container>
    )
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>
        Your Conversations
      </Typography>

      {conversations.length > 0 ? (
        <Paper elevation={2} sx={{ borderRadius: 2 }}>
          <List sx={{ width: "100%", bgcolor: "background.paper" }}>
            {conversations.map((conversation, index) => {
              // Find the other participant (not the current user)
              const otherParticipantId = conversation.participants.find((id) => id !== user.uid)
              const otherParticipantName = conversation.participantNames[otherParticipantId]

              return (
                <Box key={conversation.id}>
                  <ListItem
                    alignItems="flex-start"
                    button
                    onClick={() => handleSelectConversation(conversation)}
                    sx={{
                      transition: "background-color 0.2s",
                      "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        {otherParticipantName?.[0]?.toUpperCase() || "U"}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={otherParticipantName}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary" sx={{ display: "inline" }}>
                            {conversation.lastMessage?.substring(0, 50)}
                            {conversation.lastMessage?.length > 50 ? "..." : ""}
                          </Typography>
                          {conversation.lastMessageTime && (
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", mt: 0.5 }}
                            >
                              {new Date(conversation.lastMessageTime.toDate()).toLocaleString()}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                  {index < conversations.length - 1 && <Divider variant="inset" component="li" />}
                </Box>
              )
            })}
          </List>
        </Paper>
      ) : (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography variant="body1" color="text.secondary">
            You don't have any conversations yet.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Start a conversation by messaging a room owner.
          </Typography>
        </Box>
      )}
    </Container>
  )
}

export default Messages
