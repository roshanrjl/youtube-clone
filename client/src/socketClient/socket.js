import { io } from "socket.io-client";
import store from "../redux/store";
import { addNotification } from "../redux/notificationSlice";
import { Localstorage } from "../utils";

let socket;
const peers = {}; // store RTCPeerConnections for multiple broadcasters/viewers
let currentStream = null; // store current media stream (camera or screen)

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

  // =========================
  // Chat Messages
  // =========================
  // These handlers will be set up by components that need them
  // using setupChatListeners()

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
    console.log("🔄 Received ICE candidate from:", id);
    const pc = peers[id];
    if (pc) {
      pc.addIceCandidate(new RTCIceCandidate(candidate))
        .then(() => console.log("✅ Added ICE candidate for:", id))
        .catch((err) => console.error("❌ Error adding ICE candidate:", err));
    } else {
      console.warn("⚠️ No peer connection found for:", id);
    }
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
export const startBroadcast = async (useScreenShare = false) => {
  if (!socket) {
    console.error("❌ Socket not initialized. Call initSocket() first.");
    return;
  }

  try {
    let stream;

    if (useScreenShare) {
      // Get screen sharing stream
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always", // Show cursor in screen share
        },
        audio: true, // Include system audio if available
      });
      console.log("✅ Got screen share stream", stream);

      // Add microphone audio to screen share
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        audioStream.getAudioTracks().forEach((track) => {
          stream.addTrack(track);
          console.log("🎤 Added microphone audio to screen share");
        });
      } catch (audioErr) {
        console.warn("⚠️ Could not add microphone audio:", audioErr.message);
      }
    } else {
      // Get camera stream
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log("✅ Got camera stream", stream);
    }

    currentStream = stream;

    const videoEl = document.getElementById("myLocalVideo");
    if (videoEl) {
      videoEl.srcObject = stream;
    } else {
      console.warn("⚠️ Video element 'myLocalVideo' not found");
    }

    // Handle screen share stop (when user clicks browser's stop sharing button)
    if (useScreenShare) {
      stream.getVideoTracks()[0].onended = () => {
        console.log("📺 Screen sharing stopped by user");
        // You can emit an event or trigger cleanup here
      };
    }

    // Tell server I'm a broadcaster
    socket.emit("broadcaster");
    console.log("📡 Emitted 'broadcaster' event");

    // Handle answers from viewers
    socket.on("answer", async (viewerId, answer) => {
      console.log("📥 Received answer from viewer:", viewerId);
      const pc = peers[viewerId];
      if (pc) {
        await pc.setRemoteDescription(answer);
        console.log("✅ Set remote description for viewer:", viewerId);
      }
    });

    // Handle ICE candidates from viewers (broadcaster-specific)
    socket.on("candidate", (viewerId, candidate) => {
      console.log("🔄 Received ICE candidate from viewer:", viewerId);
      const pc = peers[viewerId];
      if (pc) {
        pc.addIceCandidate(new RTCIceCandidate(candidate))
          .then(() =>
            console.log("✅ Added ICE candidate for viewer:", viewerId)
          )
          .catch((err) => console.error("❌ Error adding ICE candidate:", err));
      }
    });

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
// Switch between camera and screen share
// =========================
export const switchStreamSource = async (useScreenShare = false) => {
  if (!socket) {
    console.error("❌ Socket not initialized");
    return;
  }

  if (!currentStream) {
    console.error("❌ No active stream to switch");
    return;
  }

  try {
    let newStream;

    if (useScreenShare) {
      newStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
        },
        audio: true,
      });
      console.log("✅ Switched to screen share");

      // Add microphone audio
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        audioStream.getAudioTracks().forEach((track) => {
          newStream.addTrack(track);
        });
      } catch (audioErr) {
        console.warn("⚠️ Could not add microphone audio");
      }
    } else {
      newStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log("✅ Switched to camera");
    }

    // Stop old stream tracks
    currentStream.getTracks().forEach((track) => {
      track.stop();
    });

    // Update video element
    const videoEl = document.getElementById("myLocalVideo");
    if (videoEl) {
      videoEl.srcObject = newStream;
    }

    // Replace tracks in all peer connections
    Object.keys(peers).forEach((peerId) => {
      const pc = peers[peerId];
      const senders = pc.getSenders();

      newStream.getTracks().forEach((newTrack) => {
        const sender = senders.find((s) => s.track?.kind === newTrack.kind);
        if (sender) {
          sender.replaceTrack(newTrack);
          console.log(`🔄 Replaced ${newTrack.kind} track for peer ${peerId}`);
        }
      });
    });

    // Handle screen share stop
    if (useScreenShare) {
      newStream.getVideoTracks()[0].onended = () => {
        console.log("📺 Screen sharing stopped by user");
      };
    }

    currentStream = newStream;
    return newStream;
  } catch (err) {
    console.error("❌ Failed to switch stream source:", err);
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
  if (currentStream) {
    currentStream.getTracks().forEach((track) => {
      track.stop();
      console.log("🛑 Stopped track:", track.kind);
    });
    currentStream = null;
  }

  const videoEl = document.getElementById("myLocalVideo");
  if (videoEl) {
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
// Live Chat Functions
// =========================
export const setupChatListeners = (onMessageReceived) => {
  if (!socket) return;

  socket.on("chat_message", (message) => {
    console.log("💬 Received chat message:", message);
    if (onMessageReceived) {
      onMessageReceived(message);
    }
  });
};

export const sendChatMessage = (broadcasterId, message, username) => {
  if (!socket) return;

  socket.emit("chat_message", {
    broadcasterId,
    message,
    username,
    timestamp: Date.now(),
  });

  console.log("📤 Sent chat message:", message);
};

export const removeChatListeners = () => {
  if (!socket) return;
  socket.off("chat_message");
};

// =========================
// Viewer helper
// =========================
export const watchBroadcast = (broadcasterId) => {
  if (!socket) {
    console.error("❌ Socket not initialized in watchBroadcast");
    return;
  }
  console.log("📡 Requesting to watch broadcaster:", broadcasterId);
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
