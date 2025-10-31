import React, { useEffect, useState } from "react";
import { yourvideos, deleteVideo } from "../../api/videosapi/videoapi";
import {
  getUserTweets,
  updateTweet,
  deleteTweet,
} from "../../api/tweetsApi/tweetsapi";
import Mycard from "../../components/Card";
import { Input } from "../../components/components/ui/input";
import { Button } from "../../components/components/ui/button";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getChannelStats } from "../../api/dashboardApi/dashboardapi";

function Dashboard() {
  const [myvideo, setMyVideo] = useState([]);
  const user = useSelector((state) => state.auth.user);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("Videos"); // track active tab
  const [tweets, setTweets] = useState([]);
  const [stats, setStats] = useState();

  const handleStats = async () => {
    try {
      const response = await getChannelStats();
      console.log("checking if i got channel stats:", response.data.data);
      setStats(response.data.data);
    } catch (error) {
      console.error("something went wrong could not fetch channel stats");
    }
  };

  const yourvideo = async () => {
    try {
      const response = await yourvideos();
      setMyVideo(response.data.data);
    } catch (error) {
      console.log("could not fetch your videos " + error);
    }
  };
  const yourPost = async () => {
    try {
      const response = await getUserTweets();

      setTweets(response.data.data);
    } catch (error) {
      console.error("something went wrong..." + error);
    }
  };

  const handleDelete = async (videoId) => {
    try {
      await deleteVideo(videoId);
      setToast("Video deleted successfully!");
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setToast("Failed to delete video.");
      setTimeout(() => setToast(null), 3000);
    }
  };

  useEffect(() => {
    yourvideo();
    yourPost();
    handleStats();
  }, [user]);

  const tabs = ["Videos", "Live", "Post", "Playlists", "Analytics"];

  return (
    <>
      {/* Top Tabs */}
      <div className="mt-6 border-b border-gray-300 dark:border-gray-700 flex flex-wrap items-center gap-2 sm:gap-4">
        {tabs.map((tab) => (
          <Button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md font-medium text-sm sm:text-base ${
              activeTab === tab
                ? "bg-red-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-red-500 hover:text-white"
            } transition-colors duration-200`}
          >
            {tab}
          </Button>
        ))}

        <div className="ml-auto">
          <Input
            type="text"
            placeholder="Search"
            className="w-32 sm:w-48 md:w-64 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-md"
          />
        </div>
      </div>

      {/* Video List */}
      {activeTab === "Videos" &&
        myvideo.length > 0 &&
        myvideo.map((userObj) =>
          userObj.videos.map((video) => (
            <div
              key={video._id}
              className="flex gap-4 mb-6 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors duration-200"
            >
              <Mycard
                className="w-60 h-36 rounded-xl overflow-hidden group-hover:scale-105 transition-transform duration-200"
                contentclass="p-0 w-full h-36 -mt-13"
                content={
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                }
              />

              <div className="flex flex-1 justify-between">
                {/* Video Info */}
                <div className="flex flex-col justify-start">
                  <p className="text-base font-medium text-black dark:text-white line-clamp-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                    {video.title}
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                    {userObj.username}
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {video.views} views • 2 weeks ago
                  </p>
                </div>

                <div className="flex gap-2 justify-start">
                  <Button
                    onClick={() => handleDelete(video._id)}
                    className="bg-red-500 text-white hover:bg-red-600"
                  >
                    Delete
                  </Button>
                  <Link to={`/update/${video._id}`}>
                    <Button className="bg-blue-500 text-white hover:bg-blue-600">
                      Update
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}

      {/* section for tweets of user */}
      {activeTab === "Post" &&
        tweets.length > 0 &&
        tweets.map((tweet, index) => (
          <div
            key={index}
            className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md"
          >
            <p className="text-gray-700 dark:text-gray-300">{tweet.content}</p>
            <div className="flex gap-2 justify-start">
              <Button
                onClick={() => handleDelete()}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </Button>
              <Link to={`/update/`}>
                <Button className="bg-blue-500 text-white hover:bg-blue-600">
                  Update
                </Button>
              </Link>
            </div>
          </div>
        ))}

      {/* section for playlist of user  */}
      {activeTab === "Playlists" && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
          <p className="text-gray-700 dark:text-gray-300">
            No Playlists to show.
          </p>
        </div>
      )}

      {/* Post Tab Placeholder */}
      {activeTab === "Analytics" && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 p-4">
          {/* Total Views */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6 flex flex-col items-center justify-center hover:scale-105 transition-transform hover:shadow-lg">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Total Views
            </p>
            <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
              {stats.totalViews}
            </h3>
          </div>

          {/* Total Likes */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6 flex flex-col items-center justify-center hover:scale-105 transition-transform hover:shadow-lg">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Total Likes
            </p>
            <h3 className="text-3xl font-bold text-pink-600 dark:text-pink-400 mt-2">
              {stats.totalLikes}
            </h3>
          </div>

          {/* Total Subscribers */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6 flex flex-col items-center justify-center hover:scale-105 transition-transform hover:shadow-lg">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Total Subscribers
            </p>
            <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
              {stats.totalSubscribers}
            </h3>
          </div>

          {/* Total Videos */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6 flex flex-col items-center justify-center hover:scale-105 transition-transform hover:shadow-lg">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Total Videos
            </p>
            <h3 className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
              {stats.totalVideos}
            </h3>
          </div>
        </div>
      )}
    </>
  );
}

export default Dashboard;
