import React, { useEffect, useState, useRef } from "react";
import {
  initSocket,
  startBroadcast,
  stopBroadcast,
  switchStreamSource,
  setupChatListeners,
  sendChatMessage,
  removeChatListeners,
} from "../socketClient/socket";
import { Localstorage } from "../utils";

function Broadcaster() {
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [streamType, setStreamType] = useState("camera"); // "camera" or "screen"
  const [hasStarted, setHasStarted] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const chatEndRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get current user info
    const user = Localstorage.get("user");
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  useEffect(() => {
    // Setup chat listeners
    if (streaming) {
      setupChatListeners((message) => {
        setChatMessages((prev) => [...prev, message]);
      });
    }

    return () => {
      removeChatListeners();
    };
  }, [streaming]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleStartBroadcast = async (useScreenShare = false) => {
    // Initialize socket first
    const socket = initSocket();
    if (!socket) {
      setError("Failed to connect to server. Please login first.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await startBroadcast(useScreenShare);
      setStreaming(true);
      setHasStarted(true);
      setStreamType(useScreenShare ? "screen" : "camera");
      setLoading(false);
      console.log(
        `✅ Broadcasting started with ${
          useScreenShare ? "screen share" : "camera"
        }`
      );
    } catch (err) {
      console.error("❌ Failed to start broadcast:", err);
      setError(`Failed to start: ${err.message}`);
      setLoading(false);
    }
  };

  const handleSwitchSource = async (useScreenShare) => {
    try {
      setLoading(true);
      setError(null);
      await switchStreamSource(useScreenShare);
      setStreamType(useScreenShare ? "screen" : "camera");
      setLoading(false);
      console.log(
        `✅ Switched to ${useScreenShare ? "screen share" : "camera"}`
      );
    } catch (err) {
      console.error("❌ Failed to switch source:", err);
      setError(`Failed to switch: ${err.message}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup: stop broadcast when component unmounts
      if (streaming) {
        stopBroadcast();
      }
    };
  }, [streaming]);

  const handleStopBroadcast = () => {
    stopBroadcast();
    setStreaming(false);
    setChatMessages([]);
    console.log("🛑 Broadcast stopped by user");
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentUser) return;

    const username = currentUser.username || currentUser.email || "Broadcaster";

    // Add to local chat immediately
    const newMessage = {
      username,
      message: messageInput,
      timestamp: Date.now(),
      isBroadcaster: true,
    };

    setChatMessages((prev) => [...prev, newMessage]);

    // Send to viewers via socket
    sendChatMessage("broadcaster", messageInput, username);

    setMessageInput("");
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          🔴 Live Broadcast
        </h2>

        {streaming && (
          <button
            onClick={handleStopBroadcast}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center gap-2"
          >
            <span>⏹️</span>
            <span>Stop Broadcast</span>
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Main broadcast area */}
        <div className="flex-1">
          {/* Start Broadcast Options */}
          {!hasStarted && !loading && (
            <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Choose broadcast source:
              </h3>
              <div className="flex gap-4">
                <button
                  onClick={() => handleStartBroadcast(false)}
                  className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors flex flex-col items-center gap-2"
                >
                  <span className="text-3xl">📹</span>
                  <span>Start with Camera</span>
                </button>
                <button
                  onClick={() => handleStartBroadcast(true)}
                  className="flex-1 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md transition-colors flex flex-col items-center gap-2"
                >
                  <span className="text-3xl">🖥️</span>
                  <span>Start with Screen Share</span>
                </button>
              </div>
            </div>
          )}

          {/* Switch Source Buttons (when streaming) */}
          {streaming && (
            <div className="mb-4 flex gap-3">
              <button
                onClick={() => handleSwitchSource(false)}
                disabled={streamType === "camera" || loading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  streamType === "camera"
                    ? "bg-blue-600 text-white cursor-default"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span>📹</span>
                <span>
                  {streamType === "camera"
                    ? "Using Camera"
                    : "Switch to Camera"}
                </span>
              </button>
              <button
                onClick={() => handleSwitchSource(true)}
                disabled={streamType === "screen" || loading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  streamType === "screen"
                    ? "bg-purple-600 text-white cursor-default"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span>🖥️</span>
                <span>
                  {streamType === "screen"
                    ? "Sharing Screen"
                    : "Switch to Screen Share"}
                </span>
              </button>
            </div>
          )}

          {loading && (
            <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 p-4 rounded mb-4">
              ⏳ {streaming ? "Switching source..." : "Starting broadcast..."}
            </div>
          )}

          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded mb-4">
              ❌ {error}
            </div>
          )}

          {streaming && (
            <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 p-4 rounded mb-4 flex items-center gap-2">
              <span className="inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              <span>
                ✅ You are live! Viewers can now watch your{" "}
                {streamType === "screen" ? "screen" : "camera"}.
              </span>
            </div>
          )}

          <video
            id="myLocalVideo"
            autoPlay
            muted
            playsInline
            className="w-full rounded-lg shadow-lg border border-gray-300 dark:border-gray-700 bg-black"
          />

          {!streaming && !loading && !error && hasStarted && (
            <div className="mt-4 text-center text-gray-600 dark:text-gray-400">
              <p>Broadcast ended.</p>
            </div>
          )}
        </div>

        {/* Live Chat Sidebar */}
        {streaming && (
          <div className="w-96 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-300 dark:border-gray-700">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-gray-300 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                💬 Live Chat
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({chatMessages.length})
                </span>
              </h3>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 h-96">
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <p>No messages yet.</p>
                  <p className="text-sm">Chat with your viewers!</p>
                </div>
              )}

              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col gap-1 ${
                    msg.isBroadcaster ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">
                      {msg.isBroadcaster ? "You" : msg.username}
                    </span>
                    {msg.isBroadcaster && (
                      <span className="px-1.5 py-0.5 bg-red-500 text-white rounded text-xs">
                        HOST
                      </span>
                    )}
                    <span>{formatTime(msg.timestamp)}</span>
                  </div>
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-lg ${
                      msg.isBroadcaster
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-300 dark:border-gray-700">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Broadcaster;
