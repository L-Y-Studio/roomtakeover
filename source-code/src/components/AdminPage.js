
import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

import { db } from "../firebase";
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

const AdminPage = () => {
  const [pendingRooms, setPendingRooms] = useState([]);
  const [users, setusers] = useState([]);
  const [user, setUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);


useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
  });
  return () => unsubscribe();
}, []);

  
  useEffect(() => {    
  const q = query(collection(db, "users"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setusers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
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
    await deleteDoc(roomRef); // Or update status to "rejected" instead
  };

  return (
    <Container sx={{ py: 4 }}>
      
      {users
  .filter((u) => u.uid === user?.uid)
  .map((u) => (
    <Card key={u.uid}><CardContent>Role : {u.role}<br></br>Name : {u.name}</CardContent></Card>
  ))}
      <br></br>
      <Typography variant="h4" gutterBottom>
        Pending Room Approvals
      </Typography>
      <Grid container spacing={3}>
        {pendingRooms.map((room) => (
          <Grid item xs={12} sm={6} md={4} key={room.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{room.name}</Typography>
                <Typography>${room.price}/month</Typography>
                <Typography>{room.location}</Typography>
                <Typography>Requested by: {room.adminName}</Typography>
                <Typography>Status: {room.status}</Typography>
                <Typography>Created At: {room.createdAt.toDate().toLocaleString()}</Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Button onClick={() => handleApprove(room.id)} color="success">
                    Approve
                  </Button>
                  <Button onClick={() => handleReject(room.id)} color="error" sx={{ ml: 2 }}>
                    Reject
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default AdminPage;
