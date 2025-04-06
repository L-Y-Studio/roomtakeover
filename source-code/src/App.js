import React from "react";
import { HashRouter as  Router, Route, Routes } from "react-router-dom";
import RoomList from "./components/RoomList";
import AdminPage from "./components/AdminPage";
import Profile from "./components/Profile";

function App() {
  return (
    <Router>
      <div className="App">
        <h1>Room Finder</h1>
        <Routes>
          <Route path="/" element={<RoomList />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
