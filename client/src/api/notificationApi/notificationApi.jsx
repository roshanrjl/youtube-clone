import apiClient from "../ApiClient/ApiClinet";

export const getUserNotifications= ()=>{
  return apiClient.get("/notification")
}