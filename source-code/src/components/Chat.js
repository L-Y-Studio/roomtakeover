"use client"

import { useState, useEffect, useRef } from "react"
import { db, auth } from "../firebase"
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore"
import { Typography, TextField, Button, Box, Avatar, Divider, CircularProgress, Paper } from "@mui/material"
import SendIcon from "@mui/icons-material/Send"

const Chat = ({ conversationId, recipientId, recipientName, isFloating = false }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)
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

      // Mark messages as read when they are viewed
      markMessagesAsRead(snapshot.docs)
    })

    return () => unsubscribe()
  }, [conversationId, currentUser])

  const markMessagesAsRead = async (messageDocs) => {
    if (!currentUser) return

    // Find messages that are for the current user and are unread
    const unreadMessages = messageDocs.filter(
      (doc) => doc.data().recipientId === currentUser.uid && doc.data().read === false,
    )

    // Update each unread message to be marked as read
    for (const messageDoc of unreadMessages) {
      await updateDoc(doc(db, "messages", messageDoc.id), {
        read: true,
      })
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Scroll to bottom when component mounts
  useEffect(() => {
    scrollToBottom()
  }, [])

  const handleSendMessage = async (e) => {
    e.preventDefault()

    if (!newMessage.trim() || !currentUser || !conversationId) return

    try {
      // Add the new message
      await addDoc(collection(db, "messages"), {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        recipientId: recipientId,
        conversationId: conversationId,
        timestamp: serverTimestamp(),
        read: false,
      })

      // Update the conversation's last message
      const conversationRef = doc(db, "conversations", conversationId)
      await updateDoc(conversationRef, {
        lastMessage: newMessage,
        lastMessageTime: serverTimestamp(),
      })

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  if (!currentUser) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography variant="body1">Please sign in to chat</Typography>
      </Box>
    )
  }

  // Adjust the styling for floating chat windows
  const containerStyles = isFloating
    ? {
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }
    : {
        maxWidth: "md",
        py: 4,
      }

  const messageContainerStyles = isFloating
    ? {
        flexGrow: 1,
        overflow: "auto",
        p: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        bgcolor: "#f5f5f5",
      }
    : {
        flexGrow: 1,
        overflow: "auto",
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        bgcolor: "#f5f5f5",
      }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "background.default",
      }}
    >
      <Box
        ref={chatContainerRef}
        sx={messageContainerStyles}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <CircularProgress size={24} />
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
                <Paper
                  sx={{
                    p: 1.5,
                    maxWidth: "70%",
                    bgcolor: isCurrentUser ? "primary.main" : "grey.100",
                    color: isCurrentUser ? "white" : "text.primary",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body1">{message.text}</Typography>
                  <Typography variant="caption" color={isCurrentUser ? "inherit" : "text.secondary"}>
                    {message.timestamp
                      ? new Date(message.timestamp.toDate()).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Sending..."}
                  </Typography>
                </Paper>
              </Box>
            )
          })
        ) : (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <Typography variant="body2" color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Divider />

      <Box sx={{ p: 1.5, bgcolor: "background.paper" }}>
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
            size="small"
            endIcon={<SendIcon />}
            disabled={!newMessage.trim()}
          />
        </form>
      </Box>
    </Box>
  )
}

export default Chat
