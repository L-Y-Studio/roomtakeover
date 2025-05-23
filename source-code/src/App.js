import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import RoomList from "./components/RoomList";
import Profile from "./components/Profile";
import Messages from "./components/Messages";
import Navbar from "./components/Navbar";
import RentRoom from "./components/RentRoom";
import AdminRoomApproval from "./components/AdminRoomApproval";
import RoomDetail from "./components/RoomDetail";

const theme = createTheme({
  palette: {
    primary: {
      main: "#223843",
    },
    secondary: {
      main: "#dbd3d8",
    },
    background: {
      default: "#eff1f3",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
    h1: {
      fontWeight: 600,
      color: "#223843",
    },
    h2: {
      fontWeight: 500,
      color: "#223843",
    },
  },

});


function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar />

          <Routes>
            <Route path="/" element={<RoomList />} />
            <Route path="/room/:id" element={<RoomDetail />} />
            <Route path="/admin" element={<AdminRoomApproval />} />
            <Route path="/rent" element={<RentRoom />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/messages" element={<Messages />} />
          </Routes>
      </Router>
    </ThemeProvider>
  );

}

export default App
