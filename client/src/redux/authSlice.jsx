// redux/authSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Localstorage } from "../utils/index";
import { registerUser, loginUser, logoutUser } from "../api/userApi/userapi.jsx";
import apiClient from  "../api/ApiClient/ApiClinet"; // Axios instance with interceptor

// -------------------- THUNKS --------------------

// Register user
export const registers = createAsyncThunk(
  "auth/register",
  async (credentials, thunkAPI) => {
    try {
      await registerUser(credentials);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Registration failed"
      );
    }
  }
);

// Login user
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, thunkAPI) => {
    try {
      const res = await loginUser(credentials);
      const { accessToken, user } = res.data.data;

      // Store accessToken + user in LocalStorage
      Localstorage.set("accessToken", accessToken);
      Localstorage.set("user", user);

      return { accessToken, user };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Login failed"
      );
    }
  }
);

// Logout user
export const logout = createAsyncThunk(
  "auth/logout",
  async (_, thunkAPI) => {
    try {
      await logoutUser();

      // Clear LocalStorage
      Localstorage.remove("accessToken");
      Localstorage.remove("user");

      return true;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Logout failed"
      );
    }
  }
);

// -------------------- SLICE --------------------
const initialState = {
  user: Localstorage.get("user") || null,
  accessToken: Localstorage.get("accessToken") || null,
  registered: false,
  error: null,
  isloading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // ---------------- LOGIN ----------------
    builder
      .addCase(login.pending, (state) => {
        state.isloading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isloading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isloading = false;
        state.error = action.payload;
      });

    // ---------------- REGISTER ----------------
    builder
      .addCase(registers.pending, (state) => {
        state.isloading = true;
        state.error = null;
      })
      .addCase(registers.fulfilled, (state) => {
        state.isloading = false;
        state.registered = true;
        state.error = null;
      })
      .addCase(registers.rejected, (state, action) => {
        state.isloading = false;
        state.error = action.payload;
      });

    // ---------------- LOGOUT ----------------
    builder
      .addCase(logout.pending, (state) => {
        state.isloading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isloading = false;
        state.user = null;
        state.accessToken = null;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isloading = false;
        state.error = action.payload;
      });
  },
});

export default authSlice.reducer;
