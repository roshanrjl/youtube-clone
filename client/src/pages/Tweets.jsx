import React, { useEffect, useState } from "react";
import { allTweets } from "../api/tweetsApi/tweetsapi";

function Tweets({ userId }) {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch tweets of the logged-in user
  const fetchUserTweets = async () => {
    setLoading(true);
    try {
      const response = await allTweets();
      // 🟢 Defensive check in case response isn't array
     
      const fetchedTweets = response?.data?.data?.tweets;
      if (Array.isArray(fetchedTweets)) {
        setTweets(fetchedTweets);
      } else {
        setTweets([]);
      }
    } catch (error) {
      console.error("❌ Could not fetch tweets:", error);
      setTweets([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserTweets();
  }, [userId]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Tweets</h1>

      {loading ? (
        <p>Loading tweets...</p>
      ) : tweets.length === 0 ? (
        <p>You haven’t posted any tweets yet.</p>
      ) : (
        <div className="space-y-4">
          {tweets.map((tweet) => (
            <div
              key={tweet._id}
              className="border rounded-lg p-3 bg-white shadow-sm"
            >
              {/* 🔹 User info (logo + username) */}
              <div className="flex items-center mb-2">
                <img
                  src={
                    tweet.owner?.avatar ||
                    "/default-avatar.png" // fallback if no logo
                  }
                  alt="User avatar"
                  className="w-10 h-10 rounded-full mr-3 object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-800">
                    {tweet.owner.username || "Unknown User"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(tweet.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* 🔹 Tweet content */}
              <p className="text-gray-800 whitespace-pre-wrap">{tweet.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Tweets;
