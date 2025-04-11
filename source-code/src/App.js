import React from "react";
import { HashRouter as  Router, Route, Routes } from "react-router-dom";
import RoomList from "./components/RoomList";
import AdminPage from "./components/AdminPage";
import Profile from "./components/Profile";
import Navbar from "./components/Navbar";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="App">
        <h1 className="title">Room Finder</h1>
        <Navbar />
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
