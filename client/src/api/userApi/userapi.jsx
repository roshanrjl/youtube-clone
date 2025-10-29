import apiClient from "../ApiClient/ApiClinet";
import axios from "axios";


export const registerUser =(formData)=>{
  return apiClient.post('users/register',formData)
}

export const loginUser =(data)=>{
  return apiClient.post('users/login',data,{
    withCredentials:true
  });
};

export const logoutUser =()=>{
  return apiClient.post("users/logout")
}

export const refreshAccessToken = () => {
  return axios.post(
    `${import.meta.env.VITE_SERVER_URI}/users/refresh-token`,
    {},
    { withCredentials: true } // send cookies
  );
};

export const changeCurrentPassword =(newpassword , oldPassword)=>{
  return apiClient.post("users/change-password",newpassword,oldPassword)
}

export const getCurrentUser =()=>{
  return apiClient.get("users/current-user")
}

export const updateAccountDetails =()=>{
  return apiClient.patch("users/update-account")
}

export const updateUserAvatar =()=>{
  return apiClient.patch("users/avatar")
}

export const updateUserCoverImage =()=>{
  return apiClient.patch("users/cover-image")
}

export const getUserChannelProfile =(username)=>{
  return apiClient.get(`users/c/${username}`)
}

export const getWatchHistory =()=>{
  return apiClient.get("users/history")
}

export const googlelogin=()=>{
  return apiClient.get("users/google")
}

export const githublogin=()=>{
  return apiClient.get("users/github")
}
export const SendEmail=(email)=>{
  return apiClient.post("users/requestOtp",email)
}

export const verifyOtp=(otp,email)=>{
  return apiClient.post("users/verifyOtp",otp,email)
}

export const resetPassword = (password)=>{
  return apiClient.post("users/resetpassword", password)
}