import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
} from "../components/components/ui/card";
import Mycard from "../components/Card";
import { Link, useParams, useLocation } from "react-router-dom";
import {
  getVideoById,
  getAllVideos,
  addViews,
} from "../api/videosapi/videoapi";
import { toggleVideoLike } from "../api/likedApi/likedapi";
import { Input } from "../components/components/ui/input";
import {
  getVideoComments,
  addComment as addCommentApi,
} from "../api/commentsApi/commentapi";
import { useSelector } from "react-redux";
import {
  toggleSubscription as toggleSubscriptionApi,
  getUserChannelSubscribers,
} from "../api/subscriptionApi/subscriptionapi";
import { profileData } from "../api/profileApi/profileApi";

function Video() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allvideo, setAllVideo] = useState(null);
  const [views, setViews] = useState();
  const location = useLocation();
  const fromHome = location.state?.fromHome || false;
  const [videoLike, setVideoLike] = useState(0);
  const [commentLike, setCommentLike] = useState();
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const currentUser = useSelector((state) => state.auth?.user);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [channelProfile, setChannelProfile] = useState(null);

  const channelId = video?.owner || video?.ownerId; // adapt depending on video object shape

  const fetchSubscribers = async () => {
    if (!channelId) return;
    try {
      const res = await getUserChannelSubscribers(channelId);
      const list = res.data.data || [];
      setSubscribersCount(list.length);
      if (currentUser) {
        setIsSubscribed(
          list.some(
            (s) =>
              s.subscriber?._id === currentUser._id ||
              s.subscriber === currentUser._id
          )
        );
      }
    } catch (err) {
      console.error("Failed to fetch subscribers", err?.response?.data || err);
    }
  };

  const fetchChannelProfile = async () => {
    if (!channelId) return;
    try {
      const res = await profileData(channelId);
      const info = res.data.data?.[0];
      if (info) setChannelProfile(info);
    } catch (err) {
      console.error(
        "Failed to fetch channel profile",
        err?.response?.data || err
      );
    }
  };

  const handleToggleSubscribe = async () => {
    if (!currentUser || !channelId) return;
    try {
      // Optimistic toggle
      setIsSubscribed((prev) => !prev);
      setSubscribersCount((prev) => prev + (isSubscribed ? -1 : 1));
      await toggleSubscriptionApi(channelId);
      // Re-fetch to ensure accuracy
      fetchSubscribers();
    } catch (err) {
      console.error("Subscription toggle failed", err?.response?.data || err);
      // Rollback on error
      setIsSubscribed((prev) => !prev);
      setSubscribersCount((prev) => prev + (isSubscribed ? 1 : -1));
    }
  };

  // Add comment handler (optimistic update)
  const handleAddComment = async () => {
    const text = newComment.trim();
    if (!text || posting || !currentUser) return;
    setPosting(true);

    // Optimistic local comment
    const optimistic = {
      tempId: `temp-${Date.now()}`,
      content: text,
      owner: {
        username: currentUser.username,
        avatar: currentUser.avatar,
        _id: currentUser._id,
      },
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [optimistic, ...prev]);
    setNewComment("");

    try {
      const res = await addCommentApi(id, text);
      const saved = res.data.data; // newcomment from backend
      // Replace optimistic temp comment with real one
      setComments((prev) => {
        return prev.map((c) => (c.tempId === optimistic.tempId ? saved : c));
      });
      // Refresh to get populated owner fields
      fetchComments();
    } catch (error) {
      console.error("Failed to add comment", error?.response?.data || error);
      // Rollback optimistic comment
      setComments((prev) => prev.filter((c) => c.tempId !== optimistic.tempId));
      setNewComment(text); // restore text so user can retry
    } finally {
      setPosting(false);
    }
  };

  useEffect(() => {
    const lastViewedVideo = sessionStorage.getItem("lastViewedVideo");

    const incrementViews = async () => {
      try {
        if (lastViewedVideo !== id) {
          const response = await addViews(id);
          setViews(response.data.data);
          sessionStorage.setItem("lastViewedVideo", id);
        } else {
          const response = await getVideoById(id);
          setViews(response.data.data.views);
        }
      } catch (error) {
        console.error("Error handling views:", error);
      }
    };

    incrementViews();
  }, [id]);

  // fetch toggle video like
  const handleVideoLike = async () => {
    try {
      const response = await toggleVideoLike(id);
      setVideoLike(response.data.data);
    } catch (error) {
      console.log(
        "something went wrong while liking/disliking the video" + error
      );
    }
  };

  // fetch comment
  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const res = await getVideoComments(id, { page: 1, limit: 20 });
      setComments(res.data.data || []);
    } catch (error) {
      console.error("Error fetching comments:", error?.response?.data || error);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Fetch video by ID
  const fetchVideo = async () => {
    try {
      const response = await getVideoById(id);
      setVideo(response.data.data);
    } catch (error) {
      console.error("Error fetching video:", error);
    } finally {
      setLoading(false);
    }
  };
  //featch all video
  const fetchAllVideo = async () => {
    try {
      const response = await getAllVideos();

      setAllVideo(response.data.data.videos);
    } catch (error) {
      console.log("something went wrong" + error);
    }
  };
  useEffect(() => {
    fetchVideo();
    fetchAllVideo();
    handleVideoLike();
    fetchComments();
    // fetchSubscribers will run again once video loaded (channelId)
  }, [id]);

  useEffect(() => {
    fetchSubscribers();
    fetchChannelProfile();
  }, [channelId, currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
        Loading video...
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
        Video not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-500 p-4 lg:p-8 gap-6">
      {/* Left Side: Video Player */}
      <div className="flex-1 flex flex-col gap-4">
        <Card className="rounded-2xl shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Video Player */}
          <CardContent className="flex-1 bg-gray-300 dark:bg-gray-700 rounded-xl flex items-center justify-center">
            <video
              src={video.videoFile}
              controls
              poster={video.thumbnail}
              className="w-full h-[60vh] object-contain rounded-xl"
            />
          </CardContent>

          {/* Video Title & Description */}
          <CardFooter className="flex flex-col -p-4 -mb-2.5">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {video.title}
            </h3>
          </CardFooter>

          {/* Channel info + Like/Subscribe */}
          <CardFooter className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-gray-200 dark:border-gray-700 -p-4 -mt-3 gap-4">
            {/* Profile & Subscribe */}
            <div className="flex items-center gap-3">
              <img
                src={channelProfile?.avatar || "https://via.placeholder.com/40"}
                alt={channelProfile?.username || "channel"}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex flex-col">
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {channelProfile?.username || "Channel"}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {subscribersCount} subscriber
                  {subscribersCount === 1 ? "" : "s"}
                </span>
              </div>
              <button
                onClick={handleToggleSubscribe}
                disabled={!currentUser || !channelId}
                className={`ml-3 px-4 py-2 rounded-full text-sm transition ${
                  isSubscribed
                    ? "bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600"
                    : "bg-red-600 text-white hover:bg-red-700"
                } disabled:opacity-60`}
                title={
                  !currentUser
                    ? "Login to subscribe"
                    : isSubscribed
                    ? "Unsubscribe"
                    : "Subscribe"
                }
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </button>
            </div>

            {/* Like & Comment */}
            <div className="flex gap-3">
              <button
                className="px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                onClick={handleVideoLike}
              >
                👍 {videoLike.likesCount}
              </button>
            </div>
          </CardFooter>
        </Card>

        <div>
          <textarea
            placeholder="your description"
            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm sm:text-base"
            value={video.description}
            readOnly
          />
        </div>
        <hr />
        <div className="flex flex-col gap-3">
          <div className="flex items-center w-full border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
            <input
              type="text"
              placeholder={currentUser ? "Add a comment" : "Login to comment"}
              className="flex-1 p-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base outline-none bg-white dark:bg-gray-900"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
              disabled={!currentUser || posting}
            />
            <button
              type="button"
              className="px-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-60"
              onClick={handleAddComment}
              disabled={!currentUser || posting || !newComment.trim()}
              title={!currentUser ? "Login required" : "Add comment"}
            >
              {posting ? "…" : "💬"}
            </button>
          </div>

          {/* Comments List */}
          <div className="flex flex-col gap-3">
            {commentsLoading && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Loading comments…
              </div>
            )}
            {!commentsLoading && comments?.length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No comments yet. Be the first!
              </div>
            )}
            {comments?.map((c) => (
              <div key={c._id || c.tempId} className="flex gap-3 items-start">
                <img
                  src={c.owner?.avatar || "https://via.placeholder.com/32"}
                  alt={c.owner?.username || "user"}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {c.owner?.username || "You"}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 break-words">
                    {c.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Related Videos / Sidebar */}
      <div className="w-full lg:w-[35%] h-auto flex flex-col gap-4">
        {allvideo?.map((v) =>
          v._id !== id ? (
            <Link key={v._id} to={`/video/${v._id}`} className="flex gap-3">
              <img
                src={v.thumbnail}
                alt={v.title}
                className="w-40 h-28 rounded-xl object-cover flex-shrink-0 hover:scale-[1.02] transition-transform"
              />
              <div className="flex flex-col justify-start overflow-hidden">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                  {v.title}
                </h4>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate">
                  {v.username || "Channel"}
                </div>
              </div>
            </Link>
          ) : null
        )}
      </div>
    </div>
  );
}

export default Video;
