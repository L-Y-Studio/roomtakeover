
import React from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css"; // Assuming you have a CSS file for styling


const Navbar = () => {

    const navigate = useNavigate(); // Hook to navigate between pages

    return (
        
        <div className="header">
            <button className="button" onClick={() => navigate("/profile")}>View Profile</button>

            <button className="button" onClick={() => navigate("/")}>Find Rooms</button>
      
            <button className="button" onClick={() => navigate("/admin")}>Rent your Rooms</button>
      
            <button className="button" onClick={() => navigate("/admin")}>Admin</button>
        </div>
    );
};

export default Navbar;