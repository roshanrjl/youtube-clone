// src/ApiClient/apiClient.js
import axios from "axios";
import { Localstorage } from "../../utils/index.js";
import { refreshAccessToken } from "../userApi/userapi.jsx";

// Flag to prevent multiple refresh calls simultaneously
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Create Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URI,
  withCredentials: true, // important for refresh token cookie
  headers: {
    "Content-type": "application/json",
  },
  timeout: 120000,
});

// Request interceptor to attach access token
apiClient.interceptors.request.use(
  config => {
    const token = Localstorage.get("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor to handle 401 (expired token)
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue failed requests while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const refreshResponse = await refreshAccessToken();
        const newAccessToken = refreshResponse.data?.data?.accessToken;

        if (!newAccessToken) throw new Error("No new access token");

        Localstorage.set("accessToken", newAccessToken);

        // Update original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken); // resolve all queued requests
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Clear storage and redirect to login
        Localstorage.remove("accessToken");
        Localstorage.remove("user");
        Localstorage.remove("role");
        window.location.href = "/login";

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
