import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "./components/navbar";
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { initSocket } from "./socketClient/socket";

function App() {
  const dispatch = useDispatch();
  const { user, isloading } = useSelector((state) => state.auth);

 

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
