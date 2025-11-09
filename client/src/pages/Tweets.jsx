import React, { useEffect, useState } from "react";

function Tweets({ userId }) {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch tweets of the logged-in user
  const fetchUserTweets = async () => {
    setLoading(true);
    
    setLoading(false);
  };

  useEffect(() => {
    if (userId) {
      
    }
  }, [userId]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4"> Tweets</h1>

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
              <p className="text-gray-800">{tweet.content}</p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(tweet.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Tweets;
