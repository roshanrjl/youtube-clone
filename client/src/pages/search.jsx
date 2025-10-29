import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchVideo } from '../api/videosapi/videoapi';

function SearchPage() {
  const [searchParams] = useSearchParams();
  const [videos, setVideos] = useState([]);
  const query = searchParams.get("query")?.toLowerCase() || "";

  useEffect(() => {
    const fetchVideos = async () => {
      if (query !== "") {
        try {
          const response = await searchVideo(query);
          console.log("response from backend:", response.data.data);
          setVideos(response.data.data || []);
        } catch (error) {
          console.error("Could not search videos: " + error);
        }
      }
    };
    fetchVideos();
  }, [query]);

  if (!query) {
    return (
      <div className="min-h-screen px-4 py-6 text-black dark:text-white">
        <h1 className="text-2xl font-semibold">Please enter a search query.</h1>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen px-4 py-6 text-black dark:text-white">
        <h1 className="text-2xl font-semibold">No videos found for "{query}"</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6 text-black dark:text-white">
        Search Results for "{query}"
      </h1>

      <div className="flex flex-col gap-6">
        {videos.map((video, index) => (
          <Link
            key={index}
            to={`/video/${video._id}`}
            className="flex gap-4 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors duration-200"
          >
            {/* Thumbnail */}
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-64 h-36 rounded-xl object-cover flex-shrink-0"
            />

            {/* Video Info */}
            <div className="flex flex-col justify-start">
              <p className="text-base font-medium text-black dark:text-white line-clamp-2">
                {video.title}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {video.owner?.username || "Unknown Channel"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {video.views || 0} views • {new Date(video.createdAt).toLocaleDateString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default SearchPage;
