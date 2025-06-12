import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const AdminPage = () => {
  const [pendingRooms, setPendingRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "rooms"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingRooms(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleApprove = async (id) => {
    const roomRef = doc(db, "rooms", id);
    await updateDoc(roomRef, { status: "approved" });
  };

  const handleReject = async (id) => {
    const roomRef = doc(db, "rooms", id);
    await deleteDoc(roomRef); // Or you could set status to "rejected"
  };

  return (
    <Container sx={{ py: 4 }}>
      {users
        .filter((u) => u.uid === user?.uid)
        .map((u) => (
          <Card key={u.uid} sx={{ mb: 3 }}>
            <CardContent>
              <Typography>Role: {u.role}</Typography>
              <Typography>Name: {u.name}</Typography>
            </CardContent>
          </Card>
        ))}

      <Typography variant="h4" gutterBottom>
        Pending Room Approvals
      </Typography>

      <Grid container spacing={3}>
        {pendingRooms.map((room) => (
          <Grid item xs={12} sm={6} md={4} key={room.id}>
            <Card sx={{ cursor: "pointer" }}>
              <Box
                onClick={() => navigate(`/room/${room.id}`)}
                sx={{ cursor: "pointer" }}
              >
                <CardContent>
                  {room.imageUrl && (
                    <Box
                      component="img"
                      src={room.imageUrl}
                      alt={room.name}
                      sx={{
                        width: "100%",
                        height: 150,
                        objectFit: "cover",
                        borderRadius: 1,
                        mb: 1,
                      }}
                    />
                  )}
                  <Typography variant="h6">{room.name}</Typography>
                  <Typography>฿{room.price}/month</Typography>
                  <Typography>{room.location}</Typography>
                  <Typography>Requested by: {room.adminName}</Typography>
                  <Typography>Status: {room.status}</Typography>
                  <Typography>
                    Created At: {room.createdAt.toDate().toLocaleString()}
                  </Typography>
                </CardContent>
              </Box>

              <Box sx={{ px: 2, pb: 2 }}>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApprove(room.id);
                  }}
                  color="success"
                >
                  Approve
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReject(room.id);
                  }}
                  color="error"
                  sx={{ ml: 2 }}
                >
                  Reject
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default AdminPage;
