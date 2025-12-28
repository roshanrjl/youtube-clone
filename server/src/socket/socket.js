import jwt from "jsonwebtoken";

const initializeSocketio = (io) => {
  const broadcasters = {}; // { socketId: userId }
    // { broadcasterSocketId: [viewerSocketId1, ...] }

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("register", (token) => {
      if (!token) {
        socket.emit("error", { message: "No token provided" });
        return socket.disconnect();
      }

      try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userId = decoded._id;
        socket.join(userId);
        socket.userId = userId;
        socket.emit("registered", { userId, socketId: socket.id });
        console.log("User authenticated:", userId);

        // Send list of active broadcasters to the newly connected user
        const activeBroadcasters = Object.keys(broadcasters).map(
          (socketId) => ({
            broadcasterId: socketId,
            userId: broadcasters[socketId],
          })
        );

        if (activeBroadcasters.length > 0) {
          socket.emit("activeBroadcasters", activeBroadcasters);
          console.log(
            `Sent ${activeBroadcasters.length} active broadcasters to ${userId}`
          );
        }
      } catch (error) {
        socket.emit("error", { message: "Invalid token" });
        socket.disconnect();
      }
    });

    socket.on("broadcaster", () => {
      broadcasters[socket.id] = socket.userId || socket.id;
      viewers[socket.id] = [];
      console.log("📡 Broadcaster started:", socket.id, "User:", socket.userId);
      console.log("📢 Broadcasting to all other clients...");

      socket.broadcast.emit("newBroadcaster", {
        broadcasterId: socket.id,
        userId: socket.userId,
      });

      console.log("✅ Total broadcasters:", Object.keys(broadcasters).length);
    });

    socket.on("watcher", (broadcasterId) => {
      if (broadcasters[broadcasterId]) {
        viewers[broadcasterId].push(socket.id);
        io.to(broadcasterId).emit("watcher", socket.id);
        console.log(
          `Viewer ${socket.id} watching broadcaster ${broadcasterId}`
        );
      }
    });

    socket.on("offer", (id, message) =>
      io.to(id).emit("offer", socket.id, message)
    );
    socket.on("answer", (id, message) =>
      io.to(id).emit("answer", socket.id, message)
    );
    socket.on("candidate", (id, message) =>
      io.to(id).emit("candidate", socket.id, message)
    );

    // Chat message handling
    socket.on("chat_message", (data) => {
      const { broadcasterId, message, username, timestamp } = data;
      console.log(
        `💬 Chat message from ${username} (${socket.id}): ${message}`
      );
      console.log(`   Target broadcaster: ${broadcasterId}`);

      // Broadcast to the broadcaster
      if (broadcasterId === "broadcaster") {
        // Message from broadcaster - send to all viewers
        const broadcasterSocketId = socket.id;
        const viewersList = viewers[broadcasterSocketId] || [];

        console.log(
          `   📤 Sending to ${viewersList.length} viewers:`,
          viewersList
        );

        viewersList.forEach((viewerId) => {
          io.to(viewerId).emit("chat_message", {
            username,
            message,
            timestamp,
            isBroadcaster: true,
          });
          console.log("     ✅ Emitted to viewer:", viewerId);
        });
      } else {
        // Message from viewer - send to broadcaster and all other viewers
        console.log(`   📤 Sending to broadcaster: ${broadcasterId}`);
        io.to(broadcasterId).emit("chat_message", {
          username,
          message,
          timestamp,
          isBroadcaster: false,
        });
        console.log("     ✅ Emitted to broadcaster:", broadcasterId);

        const viewersList = viewers[broadcasterId] || [];
        console.log(`   📤 Sending to ${viewersList.length - 1} other viewers`);

        viewersList.forEach((viewerId) => {
          if (viewerId !== socket.id) {
            io.to(viewerId).emit("chat_message", {
              username,
              message,
              timestamp,
              isBroadcaster: false,
            });
            console.log("     ✅ Emitted to other viewer:", viewerId);
          }
        });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("User disconnected:", socket.id, "Reason:", reason);

      if (broadcasters[socket.id]) {
        const affectedViewers = viewers[socket.id] || [];
        affectedViewers.forEach((vSocketId) => {
          io.to(vSocketId).emit("broadcasterEnded", socket.id);
        });
        delete broadcasters[socket.id];
        delete viewers[socket.id];
      }

      Object.keys(viewers).forEach((bId) => {
        viewers[bId] = viewers[bId].filter((vId) => vId !== socket.id);
      });

      socket.broadcast.emit("disconnectPeer", socket.id);
    });
  });
};

export const emitSocketEvent = (req, roomId, event, payload) => {
  const io = req.app.get("io");
  if (!io) return console.error("Socket.io instance not found");
  io.to(roomId).emit(event, payload);
};

export { initializeSocketio };
