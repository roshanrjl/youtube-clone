import axios from "axios";

// Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URI,
  withCredentials: true, // REQUIRED for cookies
  timeout: 120000,
});

// ---------------- RESPONSE INTERCEPTOR ----------------
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loop
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt refresh token
        await apiClient.post("/auth/refresh-token");

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed → let frontend handle logout
        // e.g., redirect to login page
        // window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
