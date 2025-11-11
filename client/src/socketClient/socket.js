import { io } from "socket.io-client";
import store from "../redux/store";
import { addNotification} from "../redux/notificationSlice";
import { Localstorage } from "../utils";

let socket;

export const initSocket = () => {
  if (socket) return socket; // singleton

  const token = Localstorage.get("accessToken");
  if (!token) return null;

  socket = io(import.meta.env.VITE_SOCKET_URL, {
    transports: ["websocket"],
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
    socket.emit("register", token);
  });

  socket.on("new_notification", (notification) => {
    store.dispatch(addNotification(notification));
  });

  // socket.on("new_chat_message", (data) => {
  //   store.dispatch(addChatMessage(data));
  // });

  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket disconnected:", reason);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
