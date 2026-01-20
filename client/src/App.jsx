import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { refreshTokenOnLoad } from "./redux/authSlice";
import Navbar from "./components/Navbar";
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { initSocket } from "./socketClient/socket";

function App() {
  const dispatch = useDispatch();
  const { user, isloading } = useSelector((state) => state.auth);

  useEffect(() => {
    // Only try to refresh if we have a user in localStorage
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser && JSON.parse(storedUser)) {
        dispatch(refreshTokenOnLoad());
      }
    } catch (error) {
      // If localStorage is corrupted, skip refresh
      console.error("Failed to parse user from localStorage:", error);
    }
  }, [dispatch]);

    useEffect(() => {
    // Initialize global socket connection
    initSocket();
  }, []); 

  if (isloading) return <div>Loading...</div>;

  return (
    <>
        <Toaster position="top-right" reverseOrder={false}/>
        <Navbar user={user} />
        <Outlet />
    </>
  );
}

export default App;
