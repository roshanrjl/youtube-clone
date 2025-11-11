import React, { useEffect, useState } from "react";
import { initSocket, watchBroadcast } from "../socketClient/socket";

function LiveStreamDashboard() {
  const [socket, setSocket] = useState(null);
  const [liveBroadcasters, setLiveBroadcasters] = useState([]);
  const [watching, setWatching] = useState(null);

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
      if (watching === broadcasterId) setWatching(null);
    });

    return () => {
      s.off("newBroadcaster");
      s.off("broadcasterEnded");
    };
  }, [watching]);

  const handleWatch = (broadcasterId) => {
    console.log("👁️ Watching broadcaster:", broadcasterId);
    setWatching(broadcasterId);
    watchBroadcast(broadcasterId);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
        🎥 Live Streams
      </h2>

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
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700"
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

            <video
              id={`video_${broadcasterId}`}
              autoPlay
              playsInline
              className="w-full aspect-video bg-black rounded mb-3"
            />

            <button
              onClick={() => handleWatch(broadcasterId)}
              disabled={watching === broadcasterId}
              className={`w-full py-2 px-4 rounded font-medium transition ${
                watching === broadcasterId
                  ? "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {watching === broadcasterId
                ? "👁️ Watching..."
                : "▶️ Watch Stream"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LiveStreamDashboard;
