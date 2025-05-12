"use client"

import { useState, useEffect, useRef } from "react"
import { db, auth } from "../firebase"
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore"
import { Container, Typography, TextField, Button, Box, Paper, Avatar, Divider, CircularProgress } from "@mui/material"
import SendIcon from "@mui/icons-material/Send"

const Chat = ({ conversationId, recipientId, recipientName }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const currentUser = auth.currentUser

  useEffect(() => {
    if (!conversationId || !currentUser) return

    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      orderBy("timestamp", "asc"),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setMessages(messageData)
      setLoading(false)
      scrollToBottom()
    })

    return () => unsubscribe()
  }, [conversationId, currentUser])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()

    if (!newMessage.trim() || !currentUser || !conversationId) return

    try {
      await addDoc(collection(db, "messages"), {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        recipientId: recipientId,
        conversationId: conversationId,
        timestamp: serverTimestamp(),
      })

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  if (!currentUser) {
    return (
      <Container sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="h6">Please sign in to chat</Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper
        elevation={3}
        sx={{
          height: "70vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 2,
        }}
      >
        <Box sx={{ p: 2, bgcolor: "primary.main", color: "white" }}>
          <Typography variant="h6">Chat with {recipientName}</Typography>
        </Box>

        <Divider />

        <Box
          sx={{
            flexGrow: 1,
            overflow: "auto",
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            bgcolor: "#f5f5f5",
          }}
        >
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
              <CircularProgress />
            </Box>
          ) : messages.length > 0 ? (
            messages.map((message) => {
              const isCurrentUser = message.senderId === currentUser.uid

              return (
                <Box
                  key={message.id}
                  sx={{
                    display: "flex",
                    justifyContent: isCurrentUser ? "flex-end" : "flex-start",
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: "flex", maxWidth: "70%" }}>
                    {!isCurrentUser && (
                      <Avatar
                        sx={{
                          bgcolor: "primary.main",
                          width: 32,
                          height: 32,
                          mr: 1,
                          mt: 0.5,
                        }}
                      >
                        {message.senderName?.[0]?.toUpperCase() || "U"}
                      </Avatar>
                    )}

                    <Box>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: isCurrentUser ? "primary.main" : "white",
                          color: isCurrentUser ? "white" : "text.primary",
                        }}
                      >
                        <Typography variant="body1">{message.text}</Typography>
                      </Paper>

                      <Typography variant="caption" sx={{ ml: 1, color: "text.secondary" }}>
                        {message.timestamp
                          ? new Date(message.timestamp.toDate()).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Sending..."}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )
            })
          ) : (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
              <Typography variant="body1" color="text.secondary">
                No messages yet. Start the conversation!
              </Typography>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        <Divider />

        <Box sx={{ p: 2, bgcolor: "background.paper" }}>
          <form onSubmit={handleSendMessage} style={{ display: "flex", gap: 8 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              size="small"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              endIcon={<SendIcon />}
              disabled={!newMessage.trim()}
            >
              Send
            </Button>
          </form>
        </Box>
      </Paper>
    </Container>
  )
}

export default Chat
