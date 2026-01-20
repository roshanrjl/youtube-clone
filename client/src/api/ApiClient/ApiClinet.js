import axios from "axios";
import { Localstorage } from "../../utils/index.js";
import { refreshAccessToken } from "../userApi/userapi.jsx";

// make this instance of axios
const apiClient = axios.create({
    baseURL:import.meta.env.VITE_SERVER_URI,
    withCredentials: true,
    headers: {
        "Content-type": "application/json",
    },
    timeout: 120000,
})

// Response incterceptor
apiClient.interceptors.response.use(
    (response)=> response,
    async (error)=>{
        const originalRequest = error.config;
        if(error.response?.status === 401 && !originalRequest._retry){   
            originalRequest._retry = true;
            try{
                const refreshResponse = await refreshAccessToken();
                
                // Update localStorage with new access token if available
                const newAccessToken = refreshResponse.data?.data?.accessToken;
                if (newAccessToken) {
                    Localstorage.set("accessToken", newAccessToken);
                }
                
                return apiClient(originalRequest);
            }catch(refreshError){
                // Clear localStorage and redirect to login on refresh failure
                Localstorage.remove("accessToken");
                Localstorage.remove("user");
                Localstorage.remove("role");
                window.location.href="/login";
                return Promise.reject(refreshError)
            }
        }
        return Promise.reject(error);
 }
)

export default apiClient;