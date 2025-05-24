import { db, auth } from "../firebase"
import { collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore"

// Function to create or get an existing conversation between two users
export const getOrCreateConversation = async (roomOwnerId, roomOwnerName) => {
  const currentUser = auth.currentUser

  if (!currentUser) {
    throw new Error("User must be signed in to start a conversation")
  }

  // Check if a conversation already exists between these users
  const existingConversation = await findExistingConversation(currentUser.uid, roomOwnerId)

  if (existingConversation) {
    return existingConversation.id
  }

  // If no conversation exists, create a new one
  const participantNames = {
    [currentUser.uid]: currentUser.displayName,
    [roomOwnerId]: roomOwnerName,
  }

  const newConversation = await addDoc(collection(db, "conversations"), {
    participants: [currentUser.uid, roomOwnerId],
    participantNames: participantNames,
    createdAt: serverTimestamp(),
    lastMessageTime: serverTimestamp(),
    lastMessage: "",
  })

  return newConversation.id
}

// Helper function to find an existing conversation between two users
const findExistingConversation = async (userId1, userId2) => {
  // Query for conversations where both users are participants
  const q1 = query(collection(db, "conversations"), where("participants", "array-contains", userId1))

  const querySnapshot = await getDocs(q1)

  // Check each conversation to see if the other user is also a participant
  for (const doc of querySnapshot.docs) {
    const conversation = doc.data()
    if (conversation.participants.includes(userId2)) {
      return { id: doc.id, ...conversation }
    }
  }

  return null
}

// Function to send a message and trigger email notification
export const sendMessage = async (conversationId, recipientId, text) => {
  const currentUser = auth.currentUser

  if (!currentUser || !text.trim() || !conversationId) {
    throw new Error("Invalid message data")
  }

  try {
    // Add the message to Firestore
    const messageRef = await addDoc(collection(db, "messages"), {
      text: text,
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
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
    })

    // Create a notification record to trigger the Cloud Function
    // No need to check user preferences - always send notifications
    await addDoc(collection(db, "notifications"), {
      type: "new_message",
      messageId: messageRef.id,
      recipientId: recipientId,
      senderId: currentUser.uid,
      senderName: currentUser.displayName,
      messagePreview: text.substring(0, 100),
      timestamp: serverTimestamp(),
      processed: false,
    })

    return messageRef.id
  } catch (error) {
    console.error("Error sending message:", error)
    throw error
  }
}
