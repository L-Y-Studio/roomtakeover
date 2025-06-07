"use client";

import { TextField } from "@mui/material";
import { db, auth } from "../firebase";
import { collection, query, onSnapshot } from "firebase/firestore";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import MessageIcon from "@mui/icons-material/Message";
import FilterListIcon from "@mui/icons-material/FilterList";
import SortIcon from "@mui/icons-material/Sort";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { getOrCreateConversation } from "../utils/chatUtils";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { Link } from "react-router-dom";
import { useFloatingChat } from "../contexts/FloatingChatContext";

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [user, setUser] = useState(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [roomType, setRoomType] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [facilities, setFacilities] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const { openFloatingChat } = useFloatingChat();

  const roomTypes = ["studio", "standard", "double", "villa"];
  const facilityOptions = [
    "swimming",
    "gym",
    "cleaning",
    "microwave",
    "washing machine",
    "wifi",
    "refrigerator",
    "air-con",
    "office service",
    "security",
    "parking",
    "smoking",
    "pet friendly",
    "guest"
  ];

  useEffect(() => {
    const q = query(collection(db, "rooms"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRooms(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => {
      unsubscribe();
      authUnsubscribe();
    };
  }, []);

  const handleMessageClick = async (room) => {
    if (!user) {
      setSelectedRoom(room);
      setLoginDialogOpen(true);
      return;
    }

    if (user.uid === room.userId) {
      alert("You cannot message yourself!");
      return;
    }

    try {
      const conversationId = await getOrCreateConversation(room.userId, room.adminName);
      openFloatingChat(conversationId);
    } catch (error) {
      console.error("Error starting conversation:", error);
      alert("Failed to start conversation. Please try again.");
    }
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setLoginDialogOpen(false);

      if (selectedRoom) {
        handleMessageClick(selectedRoom);
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleFacilityToggle = (facility) => {
    setFacilities(prev =>
      prev.includes(facility)
        ? prev.filter(f => f !== facility)
        : [...prev, facility]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setMinPrice("");
    setMaxPrice("");
    setRoomType("");
    setSortBy("default");
    setFacilities([]);
  };

  const filteredRooms = rooms
    .filter((room) => room.status === "approved")
    .filter((room) => {
      const price = Number(room.price);
      const min = minPrice ? Number(minPrice) : 0;
      const max = maxPrice ? Number(maxPrice) : Infinity;
      return price >= min && price <= max;
    })
    .filter((room) => {
      const searchMatch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.location.toLowerCase().includes(searchTerm.toLowerCase());
      const typeMatch = !roomType || room.roomType === roomType;
      const facilitiesMatch = facilities.length === 0 || 
        facilities.every(f => room.facilities?.includes(f));
      return searchMatch && typeMatch && facilitiesMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "newest":
          return b.createdAt?.toDate() - a.createdAt?.toDate();
        case "default":
        default:
          return 0;
      }
    });

  return (
    <Container sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h2"
        gutterBottom
        align="center"
        sx={{ mb: 4 }}
      >
        Available Rooms around ABAC
      </Typography>

      {/* Enhanced Search and Filter Section */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search condos..."
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: searchTerm && (
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <ClearIcon />
                  </IconButton>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 140 }}>
                <InputLabel>Room Type</InputLabel>
                <Select
                  value={roomType}
                  label="Room Type"
                  onChange={(e) => setRoomType(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {roomTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ maxWidth: 160 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="default">Default</MenuItem>
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="price-asc">Price: Low to High</MenuItem>
                  <MenuItem value="price-desc">Price: High to Low</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Min Price"
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                sx={{ width: 120 }}
              />

              <TextField
                label="Max Price"
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                sx={{ width: 120 }}
              />

              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>

              <Button
                variant="outlined"
                color="error"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
              >
                Clear All
              </Button>
            </Box>
          </Grid>

          {/* Additional Filters */}
          {showFilters && (
            <Grid item xs={12}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Facilities
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {facilityOptions.map((facility) => (
                    <Chip
                      key={facility}
                      label={facility}
                      onClick={() => handleFacilityToggle(facility)}
                      color={facilities.includes(facility) ? "primary" : "default"}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Stack>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Room Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "1fr 1fr 1fr",
          },
          gap: 3,
        }}
      >
        {filteredRooms.map((room) => (
          <Link
            to={`/room/${room.id}`}
            key={room.id}
            style={{ textDecoration: "none" }}
          >
            <Card
              sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                backgroundColor: "background.default",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                  transform: "translateY(-4px)",
                },
                overflow: "hidden",
              }}
            >
              {room.imageUrl && (
                <Box
                  component="img"
                  src={room.imageUrl}
                  alt={room.name}
                  sx={{
                    width: "100%",
                    height: 150,
                    objectFit: "cover",
                  }}
                />
              )}

              <CardContent sx={{ p: 2, flexGrow: 1 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  color="primary"
                  sx={{ fontWeight: 600 }}
                >
                  {room.name}
                </Typography>

                <Typography variant="body1" sx={{ mb: 1 }}>
                  ${room.price}/month
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    lineHeight: 1.5,
                  }}
                >
                  {room.location}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontStyle: "italic" }}
                >
                  Posted by {room.adminName || "Unknown"}
                </Typography>
              </CardContent>

              <Box sx={{ p: 2 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<MessageIcon />}
                  onClick={() => handleMessageClick(room)}
                  fullWidth
                >
                  Message
                </Button>
              </Box>
            </Card>
          </Link>
        ))}
      </Box>

      {/* Login Dialog */}
      <Dialog open={loginDialogOpen} onClose={() => setLoginDialogOpen(false)}>
        <DialogTitle>Sign In Required</DialogTitle>
        <DialogContent>
          <Typography>You need to sign in to message room owners.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoginDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleLogin} variant="contained" color="primary">
            Sign In with Google
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RoomList;
