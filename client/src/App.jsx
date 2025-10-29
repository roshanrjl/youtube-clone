import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { refreshTokenOnLoad } from "./redux/authSlice";
import Navbar from "./components/Navbar";
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";


function App() {
  const dispatch = useDispatch();
  const { user, isloading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(refreshTokenOnLoad());
  }, [dispatch]);

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
