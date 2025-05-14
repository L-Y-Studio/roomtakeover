import { db, auth } from "../firebase"
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"

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
  const q1 = query(collection(db, "conversations"), where("participants", "array-contains", userId1))

  const querySnapshot = await getDocs(q1)

  for (const doc of querySnapshot.docs) {
    const conversation = doc.data()
    if (conversation.participants.includes(userId2)) {
      return { id: doc.id, ...conversation }
    }
  }

  return null
}
