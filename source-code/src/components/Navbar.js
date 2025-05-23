
"use client"
import React from "react";
import { useNavigate, useLocation } from "react-router-dom"
import { AppBar, Toolbar, Button, Typography, Box, Badge } from "@mui/material"
import { useNotifications } from "../context/NotificationContext"

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { unreadCount = 0 } = useNotifications() || {}

  const navItems = [
    { label: "Profile", path: "/profile" },
    { label: "Find Rooms", path: "/" },
    { label: "Rent Rooms", path: "/rent" },
    { label: "Admin", path: "/admin" },
    { label: "Messages", path: "/messages" },

  ];

  return (
    <AppBar position="static" sx={{ backgroundColor: "#223843" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography
          variant="h6"
          component="div"
          sx={{ fontWeight: "bold", cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          RoomFinder
        </Typography>

        <Box sx={{ display: "flex", gap: 2 }}>
          {navItems.map((item) => {

            const isActive = location.pathname === item.path;

            return (
              <Button
                key={item.path}
                color="inherit"
                onClick={() => navigate(item.path)}
                sx={(theme) => ({

                  borderBottom: isActive
                    ? `2px solid ${theme.palette.secondary.main}`
                    : "none",

                  borderRadius: 0,
                  textTransform: "none",
                  fontSize: "1rem",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                })}
              >
                {item.label}
              </Button>

            );

          })}

          <Button
            color="inherit"
            onClick={() => navigate("/messages")}
            sx={(theme) => ({
              borderBottom: location.pathname === "/messages" ? `2px solid ${theme.palette.secondary.main}` : "none",
              borderRadius: 0,
              textTransform: "none",
              fontSize: "1rem",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            })}
          >
            <Badge badgeContent={unreadCount} color="error" sx={{ mr: 1 }}>
              Messages
            </Badge>
          </Button>
        </Box>
      </Toolbar>
    </AppBar>

  );
};

export default Navbar;

