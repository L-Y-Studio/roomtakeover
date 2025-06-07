"use client"

import { useState, useEffect } from "react"
import { db, auth } from "../firebase"
import { collection, query, where, onSnapshot, orderBy, getDocs, updateDoc, doc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { Container, Typography, Box, List, ListItem, ListItemAvatar, ListItemText, Avatar, Divider, Paper, Button, CircularProgress, Badge,} from "@mui/material"
import GoogleIcon from "@mui/icons-material/Google"
import { signInWithGoogle } from "../firebase"
import Chat from "./Chat"

const Messages = () => {
  const [user, setUser] = useState(null)
  const [conversations, setConversations] = useState([])
  const [unreadCounts, setUnreadCounts] = useState({})
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

      // For each conversation, get the unread message count
      conversationData.forEach((conversation) => {
        fetchUnreadCount(conversation.id, userId)
      })

      setLoading(false)
    })

    return () => unsubscribe()
  }

  const fetchUnreadCount = (conversationId, userId) => {
    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      where("recipientId", "==", userId),
      where("read", "==", false),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCounts((prev) => ({
        ...prev,
        [conversationId]: snapshot.docs.length,
      }))
    })

    return unsubscribe
  }

  const handleSelectConversation = async (conversation) => {
    // Find the other participant (not the current user)
    const otherParticipantId = conversation.participants.find((id) => id !== user.uid)

    setSelectedConversation({
      id: conversation.id,
      recipientId: otherParticipantId,
      recipientName: conversation.participantNames[otherParticipantId],
    })

    // Mark messages in this conversation as read
    await markConversationAsRead(conversation.id)
  }

  const markConversationAsRead = async (conversationId) => {
    if (!user) return

    // Get all unread messages for this conversation
    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      where("recipientId", "==", user.uid),
      where("read", "==", false),
    )

    const querySnapshot = await getDocs(q)

    // Mark each message as read
    for (const docSnapshot of querySnapshot.docs) {
      await updateDoc(doc(db, "messages", docSnapshot.id), {
        read: true,
      })
    }
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
              const unreadCount = unreadCounts[conversation.id] || 0
              const hasUnread = unreadCount > 0

              return (
                <Box key={conversation.id}>
                  <ListItem
                    alignItems="flex-start"
                    button
                    onClick={() => handleSelectConversation(conversation)}
                    sx={{
                      transition: "background-color 0.2s",
                      "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
                      bgcolor: hasUnread ? "rgba(25, 118, 210, 0.08)" : "transparent",
                    }}
                  >
                    <ListItemAvatar>
                      <Badge badgeContent={unreadCount} color="error" invisible={!hasUnread} overlap="circular">
                        <Avatar sx={{ bgcolor: "primary.main" }}>
                          {otherParticipantName?.[0]?.toUpperCase() || "U"}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography component="span" variant="body1" sx={{ fontWeight: hasUnread ? 600 : 400 }}>
                          {otherParticipantName}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                            sx={{
                              display: "inline",
                              fontWeight: hasUnread ? 500 : 400,
                            }}
                          >
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
