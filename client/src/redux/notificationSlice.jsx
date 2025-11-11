import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  unreadCount: 0,
};

const notificationslice = createSlice({
  name: "notification", // make sure this matches the key in your store
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
    setNotifications: (state, action) => {
      state.items = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.isRead).length;
    },
    markAllRead: (state) => {
      state.items = state.items.map((n) => ({ ...n, isRead: true }));
      state.unreadCount = 0;
    },
  },
});

export const { addNotification, setNotifications, markAllRead } = notificationslice.actions;
export default notificationslice.reducer;
