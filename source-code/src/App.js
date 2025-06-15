import { HashRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import RoomList from "./components/RoomList";
import Profile from "./components/Profile";
import FloatingChat from "./components/FloatingChat";
import Navbar from "./components/Navbar";
import RentRoom from "./components/RentRoom";
import AdminRoomApproval from "./components/AdminRoomApproval";
import RoomDetail from "./components/RoomDetail";
import SetupProfile from "./components/SetupProfile";
import { NotificationProvider } from "./context/NotificationContext";
import { FloatingChatProvider } from './contexts/FloatingChatContext';
import { useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

const theme = createTheme({
  palette: {
    primary: { main: "#223843" },
    secondary: { main: "#dbd3d8" },
    background: { default: "#eff1f3", paper: "#ffffff" }
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
    h1: { fontWeight: 600, color: "#223843" },
    h2: { fontWeight: 500, color: "#223843" },
  }
});

function AppWrapper() {
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            lastActive: serverTimestamp()
          });
          navigate("/setup-profile");
        } else {
          const data = userSnap.data();
          await updateDoc(userRef, { lastActive: serverTimestamp() });

          if (!data.phoneNumber || !data.lineId || !data.messengerName || !data.profilePictureUrl) {
            navigate("/setup-profile");
          }
        }
      }
    });

    return () => unsub();
  }, [navigate]);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<RoomList />} />
        <Route path="/room/:id" element={<RoomDetail />} />
        <Route path="/admin" element={<AdminRoomApproval />} />
        <Route path="/rent" element={<RentRoom />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/setup-profile" element={<SetupProfile />} />
      </Routes>
      <FloatingChat />
    </>
  );
}

function App() {
  return (
    <FloatingChatProvider>
      <NotificationProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <AppWrapper />
          </Router>
        </ThemeProvider>
      </NotificationProvider>
    </FloatingChatProvider>
  );
}

export default App;
