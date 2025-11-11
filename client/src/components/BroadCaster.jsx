import React, { useEffect, useState } from "react";
import {
  initSocket,
  startBroadcast,
  stopBroadcast,
} from "../socketClient/socket";

function Broadcaster() {
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize socket first
    const socket = initSocket();
    if (!socket) {
      setError("Failed to connect to server. Please login first.");
      return;
    }

    // Start broadcast
    const startStream = async () => {
      try {
        setLoading(true);
        await startBroadcast();
        setStreaming(true);
        setLoading(false);
        console.log("✅ Broadcasting started");
      } catch (err) {
        console.error("❌ Failed to start broadcast:", err);
        setError(`Camera/microphone access denied: ${err.message}`);
        setLoading(false);
      }
    };

    startStream();

    return () => {
      // Cleanup: stop all tracks when component unmounts
      if (streaming) {
        stopBroadcast();
      }
    };
  }, []);

  const handleStopBroadcast = () => {
    stopBroadcast();
    setStreaming(false);
    console.log("🛑 Broadcast stopped by user");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
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

      {loading && (
        <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 p-4 rounded mb-4">
          ⏳ Starting broadcast...
        </div>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded mb-4">
          {error}
        </div>
      )}

      {streaming && (
        <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 p-4 rounded mb-4 flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          <span>✅ You are live! Viewers can now watch your stream.</span>
        </div>
      )}

      <video
        id="myLocalVideo"
        autoPlay
        muted
        playsInline
        className="w-full max-w-2xl rounded-lg shadow-lg border border-gray-300 dark:border-gray-700 bg-black"
      />

      {!streaming && !loading && !error && (
        <div className="mt-4 text-center text-gray-600 dark:text-gray-400">
          <p>Broadcast ended.</p>
        </div>
      )}
    </div>
  );
}

export default Broadcaster;
