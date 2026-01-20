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
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      dispatch(refreshTokenOnLoad());
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
