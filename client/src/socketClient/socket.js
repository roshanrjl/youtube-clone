import { io } from "socket.io-client";
import store from "../redux/store";
import { addNotification } from "../redux/notificationSlice";
import { Localstorage } from "../utils";

let socket;
const peers = {}; // store RTCPeerConnections for multiple broadcasters/viewers

export const initSocket = () => {
  if (socket) return socket;

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

  // =========================
  // Notifications
  // =========================
  socket.on("new_notification", (notification) => {
    store.dispatch(addNotification(notification));
  });

  // =========================
  // Streaming - Broadcaster / Viewer
  // =========================

  // When a new broadcaster goes live
  socket.on("newBroadcaster", ({ broadcasterId, userId }) => {
    console.log("New broadcaster available:", broadcasterId, userId);
    // You can update state/store to show live broadcaster list
  });

  // WebRTC: Viewer gets offer from broadcaster
  socket.on("offer", async (broadcasterId, offer) => {
    console.log("📥 Received offer from broadcaster:", broadcasterId);

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });
    peers[broadcasterId] = pc;

    pc.ontrack = (event) => {
      console.log("🎥 Received track from broadcaster:", event.track.kind);
      const videoEl = document.getElementById(`video_${broadcasterId}`);
      if (videoEl) {
        videoEl.srcObject = event.streams[0];
        console.log("✅ Set video source for broadcaster:", broadcasterId);
      } else {
        console.warn(`⚠️ Video element 'video_${broadcasterId}' not found`);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("candidate", broadcasterId, event.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(
        `🔗 Peer connection state (${broadcasterId}):`,
        pc.connectionState
      );
    };

    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("answer", broadcasterId, answer);
    console.log("📤 Sent answer to broadcaster:", broadcasterId);
  });

  // WebRTC: Candidate received
  socket.on("candidate", (id, candidate) => {
    const pc = peers[id];
    if (pc) pc.addIceCandidate(new RTCIceCandidate(candidate));
  });

  // Broadcaster ends stream
  socket.on("broadcasterEnded", (broadcasterId) => {
    const pc = peers[broadcasterId];
    if (pc) pc.close();
    delete peers[broadcasterId];

    const videoEl = document.getElementById(`video_${broadcasterId}`);
    if (videoEl) videoEl.srcObject = null;

    console.log("Broadcaster ended:", broadcasterId);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket disconnected:", reason);
  });

  return socket;
};

// =========================
// Broadcaster helper
// =========================
export const startBroadcast = async () => {
  if (!socket) {
    console.error("❌ Socket not initialized. Call initSocket() first.");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    console.log("✅ Got media stream", stream);

    const videoEl = document.getElementById("myLocalVideo");
    if (videoEl) {
      videoEl.srcObject = stream;
    } else {
      console.warn("⚠️ Video element 'myLocalVideo' not found");
    }

    // Tell server I'm a broadcaster
    socket.emit("broadcaster");
    console.log("📡 Emitted 'broadcaster' event");

    // When a viewer connects, create peer connection
    socket.on("watcher", async (viewerId) => {
      console.log("👁️ New viewer:", viewerId);

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });
      peers[viewerId] = pc;

      // Add all tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
        console.log("➕ Added track:", track.kind);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("candidate", viewerId, event.candidate);
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(
          `🔗 Peer connection state (${viewerId}):`,
          pc.connectionState
        );
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", viewerId, offer);
      console.log("📤 Sent offer to viewer:", viewerId);
    });

    return stream;
  } catch (err) {
    console.error("❌ Failed to get media stream:", err);
    throw err;
  }
};

// =========================
// Stop Broadcasting helper
// =========================
export const stopBroadcast = () => {
  if (!socket) {
    console.warn("⚠️ Socket not initialized");
    return;
  }

  // Stop all media tracks
  const videoEl = document.getElementById("myLocalVideo");
  if (videoEl && videoEl.srcObject) {
    videoEl.srcObject.getTracks().forEach((track) => {
      track.stop();
      console.log("🛑 Stopped track:", track.kind);
    });
    videoEl.srcObject = null;
  }

  // Close all peer connections
  Object.keys(peers).forEach((peerId) => {
    if (peers[peerId]) {
      peers[peerId].close();
      console.log("🔌 Closed peer connection:", peerId);
    }
    delete peers[peerId];
  });

  // Notify server to end broadcast
  socket.emit("disconnect-broadcast");
  console.log("📡 Emitted 'disconnect-broadcast' event");

  // Remove watcher listener
  socket.off("watcher");
};

// =========================
// Viewer helper
// =========================
export const watchBroadcast = (broadcasterId) => {
  if (!socket) return;
  socket.emit("watcher", broadcasterId);
};

// =========================
// Disconnect socket
// =========================
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
