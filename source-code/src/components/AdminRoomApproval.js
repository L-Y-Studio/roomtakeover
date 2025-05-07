import React from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import useUserRole from "../hooks/useUserRole";
// import { Navigate } from "react-router-dom";
import AdminPage from "./AdminPage"; // The main component UI logic

const AdminRoomApproval = () => {
  const [user, loading] = useAuthState(auth);
  const role = useUserRole(user);

  if (loading || role === null) return <div>Loading...</div>;
  if (role !== "admin") 
  return <div>You are not admin. Please sign in with Admin Google Account.</div>;

  return <AdminPage/>;
};

export default AdminRoomApproval;
