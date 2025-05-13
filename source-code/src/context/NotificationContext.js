import { createContext, useContext, useEffect, useState } from "react"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, query, where, onSnapshot } from "firebase/firestore"

const NotificationContext = createContext()

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let unsubscribeAuth
    let unsubscribeMessages

    unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(
          collection(db, "messages"),
          where("recipientId", "==", user.uid),
          where("read", "==", false)
        )

        unsubscribeMessages = onSnapshot(q, (snapshot) => {
          setUnreadCount(snapshot.size) // total unread messages for this user
        })
      } else {
        setUnreadCount(0)
        if (unsubscribeMessages) unsubscribeMessages()
      }
    })

    return () => {
      if (unsubscribeAuth) unsubscribeAuth()
      if (unsubscribeMessages) unsubscribeMessages()
    }
  }, [])

  return (
    <NotificationContext.Provider value={{ unreadCount }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)
