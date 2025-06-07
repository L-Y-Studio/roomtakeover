"use client"

import { useState, useEffect } from "react"
import { db, auth } from "../firebase"
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import {
  Box,
  Fab,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Typography,
  IconButton,
  Paper,
  Dialog,
  Button,
  Tooltip,
} from "@mui/material"
import ChatIcon from "@mui/icons-material/Chat"
import CloseIcon from "@mui/icons-material/Close"
import MinimizeIcon from "@mui/icons-material/Minimize"
import GoogleIcon from "@mui/icons-material/Google"
import { signInWithGoogle } from "../firebase"
import Chat from "./Chat"
import { useFloatingChat } from "../contexts/FloatingChatContext"

const FloatingChat = () => {
  const [user, setUser] = useState(null)
  const [conversations, setConversations] = useState([])
  const [unreadCounts, setUnreadCounts] = useState({})
  const [totalUnread, setTotalUnread] = useState(0)
  const [activeChats, setActiveChats] = useState([])
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const { isDrawerOpen, activeConversationId, closeFloatingChat, openFloatingChat } = useFloatingChat()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (currentUser) fetchConversations(currentUser.uid)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (activeConversationId && user) {
      const conversation = conversations.find(c => c.id === activeConversationId)
      if (conversation) {
        handleOpenChat(conversation)
      }
    }
  }, [activeConversationId, conversations, user])

  useEffect(() => {
    const total = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)
    setTotalUnread(total)
  }, [unreadCounts])

  const fetchConversations = (userId) => {
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", userId),
      orderBy("lastMessageTime", "desc")
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversationData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setConversations(conversationData)
      conversationData.forEach((conversation) => fetchUnreadCount(conversation.id, userId))
    })
    return () => unsubscribe()
  }

  const fetchUnreadCount = (conversationId, userId) => {
    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      where("recipientId", "==", userId),
      where("read", "==", false)
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCounts((prev) => ({
        ...prev,
        [conversationId]: snapshot.docs.length,
      }))
    })
    return unsubscribe
  }

  const markConversationAsRead = async (conversationId) => {
    if (!user) return
    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      where("recipientId", "==", user.uid),
      where("read", "==", false)
    )
    const querySnapshot = await getDocs(q)
    for (const docSnapshot of querySnapshot.docs) {
      await updateDoc(doc(db, "messages", docSnapshot.id), {
        read: true,
      })
    }
  }

  const handleOpenChat = async (conversation) => {
    if (!user) return setLoginDialogOpen(true)

    const otherParticipantId = conversation.participants.find((id) => id !== user.uid)
    const otherParticipantName = conversation.participantNames[otherParticipantId]
    const isAlreadyOpen = activeChats.some((chat) => chat.id === conversation.id)

    if (!isAlreadyOpen) {
      setActiveChats((prev) => [
        ...prev,
        {
          id: conversation.id,
          recipientId: otherParticipantId,
          recipientName: otherParticipantName,
          minimized: false,
        },
      ])
    }

    closeFloatingChat()
    await markConversationAsRead(conversation.id)
  }

  const handleCloseChat = (chatId) => {
    setActiveChats((prev) => prev.filter((chat) => chat.id !== chatId))
  }

  const handleMinimizeChat = (chatId) => {
    setActiveChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, minimized: !chat.minimized } : chat
      )
    )
  }

  const handleLogin = async () => {
    try {
      await signInWithGoogle()
      setLoginDialogOpen(false)
    } catch (error) {
      console.error("Login error:", error)
    }
  }

  const reopenChat = (chatId) => {
    setActiveChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, minimized: false } : chat
      )
    )
  }

  return (
    <>
      {/* Floating Chat Button */}
      <Fab
        color="primary"
        aria-label="chat"
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 1000,
          width: 56,
          height: 56,
        }}
        onClick={() => (!user ? setLoginDialogOpen(true) : openFloatingChat())}
      >
        <Badge badgeContent={totalUnread} color="error" overlap="circular">
          <ChatIcon sx={{ fontSize: 24 }} />
        </Badge>
      </Fab>

      {/* Conversations Drawer */}
      <Drawer anchor="right" open={isDrawerOpen} onClose={closeFloatingChat}>
        <Box sx={{ width: 320, p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">Messages</Typography>
            <IconButton onClick={closeFloatingChat}>
              <CloseIcon />
            </IconButton>
          </Box>

          {conversations.length > 0 ? (
            <List>
              {conversations.map((conversation, index) => {
                const otherId = conversation.participants.find((id) => id !== user?.uid)
                const name = conversation.participantNames[otherId]
                const unreadCount = unreadCounts[conversation.id] || 0
                const hasUnread = unreadCount > 0

                return (
                  <Box key={conversation.id}>
                    <ListItem
                      button
                      onClick={() => handleOpenChat(conversation)}
                      sx={{
                        bgcolor: hasUnread ? "rgba(25, 118, 210, 0.08)" : "transparent",
                        borderRadius: 1,
                      }}
                    >
                      <ListItemAvatar>
                        <Badge badgeContent={unreadCount} color="error" invisible={!hasUnread}>
                          <Avatar>{name?.[0]?.toUpperCase() || "U"}</Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography fontWeight={hasUnread ? 600 : 400}>{name}</Typography>}
                        secondary={
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 200,
                            }}
                          >
                            {conversation.lastMessage?.substring(0, 30)}...
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < conversations.length - 1 && <Divider component="li" />}
                  </Box>
                )
              })}
            </List>
          ) : (
            <Box sx={{ textAlign: "center", mt: 4 }}>
              <Typography variant="body1">No conversations yet</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Start a conversation by messaging a room owner
              </Typography>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Active Chats */}
      <Box
        sx={{
          position: "fixed",
          bottom: 20 + 56 + 20, // chat fab height + gap
          right: 20,
          display: "flex",
          flexDirection: "column-reverse",
          gap: 2,
          zIndex: 999,
        }}
      >
        {activeChats.map((chat) => {
          const unreadCount = unreadCounts[chat.id] || 0
          return chat.minimized ? (
            <Box
              key={chat.id}
              sx={{
                position: "relative",
                "&:hover .close-icon": {
                  display: "block",
                },
              }}
            >
              <Tooltip title={chat.recipientName}>
                <Badge
                  badgeContent={unreadCount}
                  color="error"
                  overlap="circular"
                  sx={{ cursor: "pointer" }}
                >
                  <Avatar
                    onClick={() => reopenChat(chat.id)}
                    sx={{
                      bgcolor: "primary.main",
                      color: "white",
                      width: 56,
                      height: 56,
                      fontSize: 24,
                      boxShadow: 3,
                    }}
                  >
                    {chat.recipientName[0]?.toUpperCase()}
                  </Avatar>
                </Badge>
              </Tooltip>
              <IconButton
                size="small"
                onClick={() => handleCloseChat(chat.id)}
                sx={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  backgroundColor: "white",
                  display: "none",
                }}
                className="close-icon"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Paper
              key={chat.id}
              elevation={3}
              sx={{
                width: 320,
                height: 400,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: "primary.main",
                  color: "white",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="subtitle1">{chat.recipientName}</Typography>
                <Box>
                  <IconButton size="small" color="inherit" onClick={() => handleMinimizeChat(chat.id)}>
                    <MinimizeIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="inherit" onClick={() => handleCloseChat(chat.id)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <Chat
                  conversationId={chat.id}
                  recipientId={chat.recipientId}
                  recipientName={chat.recipientName}
                  isFloating={true}
                />
              </Box>
            </Paper>
          )
        })}
      </Box>

      {/* Login Dialog */}
      <Dialog open={loginDialogOpen} onClose={() => setLoginDialogOpen(false)}>
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            Sign In Required
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            You need to sign in to view and send messages.
          </Typography>
          <Button variant="contained" startIcon={<GoogleIcon />} onClick={handleLogin}>
            Sign In with Google
          </Button>
        </Box>
      </Dialog>
    </>
  )
}

export default FloatingChat
