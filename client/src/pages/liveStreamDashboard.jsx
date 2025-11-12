import React, { useEffect, useState, useRef } from "react";
import {
  initSocket,
  watchBroadcast,
  setupChatListeners,
  sendChatMessage,
  removeChatListeners,
} from "../socketClient/socket";
import { Localstorage } from "../utils";

function LiveStreamDashboard() {
  const [socket, setSocket] = useState(null);
  const [liveBroadcasters, setLiveBroadcasters] = useState([]);
  const [watching, setWatching] = useState(null);

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
    const s = initSocket();
    if (!s) {
      console.error("Failed to initialize socket");
      return;
    }

    setSocket(s);

    // Update live broadcasters list when a new broadcaster goes live
    s.on("newBroadcaster", (broadcaster) => {
      console.log("📢 New broadcaster:", broadcaster);
      setLiveBroadcasters((prev) => {
        // Avoid duplicates
        if (prev.some((b) => b.broadcasterId === broadcaster.broadcasterId))
          return prev;
        return [...prev, broadcaster];
      });
    });

    // Remove broadcaster from list when they end stream
    s.on("broadcasterEnded", (broadcasterId) => {
      console.log("📴 Broadcaster ended:", broadcasterId);
      setLiveBroadcasters((prev) =>
        prev.filter((b) => b.broadcasterId !== broadcasterId)
      );
      if (watching === broadcasterId) {
        setWatching(null);
        setChatMessages([]);
      }
    });

    return () => {
      s.off("newBroadcaster");
      s.off("broadcasterEnded");
    };
  }, [watching]);

  // Setup chat listeners when watching a stream
  useEffect(() => {
    if (watching) {
      setupChatListeners((message) => {
        setChatMessages((prev) => [...prev, message]);
      });
    }

    return () => {
      if (watching) {
        removeChatListeners();
      }
    };
  }, [watching]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleWatch = (broadcasterId) => {
    console.log("👁️ Watching broadcaster:", broadcasterId);
    setWatching(broadcasterId);
    setChatMessages([]);

    // Small delay to ensure video element is rendered
    setTimeout(() => {
      watchBroadcast(broadcasterId);
    }, 100);
  };

  const handleStopWatching = () => {
    setWatching(null);
    setChatMessages([]);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentUser || !watching) return;

    const username = currentUser.username || currentUser.email || "Viewer";

    // Add to local chat immediately
    const newMessage = {
      username,
      message: messageInput,
      timestamp: Date.now(),
      isBroadcaster: false,
    };

    setChatMessages((prev) => [...prev, newMessage]);

    // Send to broadcaster and other viewers via socket
    sendChatMessage(watching, messageInput, username);

    setMessageInput("");
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-6 max-w-full mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
        🎥 Live Streams
      </h2>

      {/* When watching a specific stream - Large view with chat */}
      {watching && (
        <div className="mb-6">
          <button
            onClick={handleStopWatching}
            className="mb-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2"
          >
            ← Back to all streams
          </button>

          <div className="flex gap-6 h-[80vh]">
            {/* Video Player - 60% width */}
            <div className="w-[60%] flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-300 dark:border-gray-700">
              <div className="px-4 py-3 border-b border-gray-300 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
                      LIVE
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {liveBroadcasters.find(
                        (b) => b.broadcasterId === watching
                      )?.userId || watching}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center bg-black">
                <video
                  id={`video_${watching}`}
                  autoPlay
                  playsInline
                  muted={false}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Live Chat - 40% width */}
            <div className="w-[40%] flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-300 dark:border-gray-700">
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
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <p>No messages yet.</p>
                    <p className="text-sm">Start chatting!</p>
                  </div>
                )}

                {chatMessages.map((msg, index) => (
                  <div key={index} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">{msg.username}</span>
                      {msg.isBroadcaster && (
                        <span className="px-1.5 py-0.5 bg-red-500 text-white rounded text-xs">
                          HOST
                        </span>
                      )}
                      <span>{formatTime(msg.timestamp)}</span>
                    </div>
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-lg ${
                        msg.isBroadcaster
                          ? "bg-red-100 dark:bg-red-900 text-gray-900 dark:text-white"
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
          </div>
        </div>
      )}

      {/* All Live Streams Grid - Show when not watching specific stream */}
      {!watching && (
        <>
          {liveBroadcasters.length === 0 && (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              <p className="text-lg">No one is live right now.</p>
              <p className="text-sm mt-2">
                Check back later or start your own stream!
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveBroadcasters.map(({ broadcasterId, userId }) => (
              <div
                key={broadcasterId}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-blue-500 transition"
                onClick={() => handleWatch(broadcasterId)}
              >
                <div className="mb-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
                    LIVE
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Broadcaster: {userId || broadcasterId}
                  </p>
                </div>

                <div className="w-full aspect-video bg-black rounded mb-3 flex items-center justify-center text-white">
                  <span className="text-4xl">▶️</span>
                </div>

                <button className="w-full py-2 px-4 rounded font-medium transition bg-blue-600 hover:bg-blue-700 text-white">
                  ▶️ Watch Stream
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default LiveStreamDashboard;
