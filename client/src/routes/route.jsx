import { createBrowserRouter } from "react-router-dom";
import Layout from "../layout";
import Home from "../pages/home";
import Login from "../components/login";
import Signup from "../components/signup";
import Video from "../pages/video";
import Yourvideo from "../pages/dashboad/Dashboard";
import UploadVideo from "../components/uploadVideo";
import CreatePost from "../components/createPost";
import Profile from "../pages/profile";
import Changepassword from "../pages/passwordpages/Changepassword";
import Account from "../pages/account";
import Premium from "../pages/Premium";
import LikedVideo from "../pages/likedVideo";
import Update from "../pages/dashboad/update";
import GoogleCallback from "../utils/googleGithublogin";
import ResetPassword from "../pages/passwordpages/ResetPassword.jsx";
import SendEmails from "../pages/passwordpages/sendEmail";
import SendOtp from "../pages/passwordpages/sendOtp";
import SearchPage from "../pages/search.jsx"
import Videos from "../pages/dashboad/videos.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "",
        element: <Home />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "signup",
        element: <Signup />,
      },
      {
        path: "search",
        element: <SearchPage />,
      },
      {
        path: "video/:id",
        element: <Video />,
      },
      {
        path: "yourVideo",
        element: <Yourvideo />,
      },
      {
        path: "upload-video",
        element: <UploadVideo />,
      },
      {
        path: "create-post",
        element: <CreatePost />,
      },
      {
        path: "profile/:id",
        element: <Profile />,
      },
      {
        path: "/settings/change-password",
        element: <Changepassword />,
      },
      {
        path: "/settings/sendEmail",
        element: <SendEmails />,
      },
      {
        path: "/settings/sendOtp/:email",
        element: <SendOtp />,
      },
      {
        path: "/settings/resetPassword",
        element: <ResetPassword />,
      },
      {
        path: "/settings/account",
        element: <Account />,
      },
      {
        path: "/settings/premium",
        element: <Premium />,
      },
      {
        path: "/likeVideo",
        element: <LikedVideo />,
      },
      {
        path: "/update/:id",
        element: <Update />,
      },
      {
        path: "/google/callback",
        element: <GoogleCallback />, // handle OAuth callback
      },
      {
        path: "dashboad/video",
        element: <Videos />, // handle OAuth callback
      },
    ],
  },
]);

export default router;
