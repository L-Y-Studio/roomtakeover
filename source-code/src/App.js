import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import RoomList from "./components/RoomList";
import AdminPage from "./components/AdminPage";

function App() {
  return (
    <Router>
      <div className="App">
        <h1>Room Finder</h1>
        <Routes>
          <Route path="/" element={<RoomList />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
