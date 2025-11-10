import jwt from "jsonwebtoken";

const initializeSocketio = (io) => {
  io.on("connection", async (socket) => {
    console.log("🔌 User connected:", socket.id);

    socket.on("register", (token) => {
      if (!token) {
        console.log("❌ No token provided. Disconnecting...");
        socket.emit("error", { message: "No token provided" });
        socket.disconnect();
        return;
      }

      try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userId = decoded._id;
        console.log("✅ User authenticated:", userId);

        socket.join(userId);
        socket.userId = userId;
        socket.emit("registered", { userId, socketId: socket.id });
      } catch (error) {
        console.log("❌ Invalid token. Disconnecting user:", error.message);
        socket.emit("error", { message: "Invalid token" });
        socket.disconnect();
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 User disconnected:", socket.id, "Reason:", reason);
    });
  });
};

export const emitSocketEvent = (req, roomId, event, payload) => {
  const io = req.app.get("io");
  if (!io) {
    console.error("❌ Socket.io instance not found in app");
    return;
  }
  io.to(roomId).emit(event, payload);
};

export { initializeSocketio };
