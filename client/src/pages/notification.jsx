import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiBell } from "react-icons/fi";
import { setNotifications } from "../redux/notificationSlice";
import { getUserNotifications } from "../api/notificationApi/notificationApi";

export default function Notification() {
  const dispatch = useDispatch();

  // Get notifications and loading state from Redux
  const notifications = useSelector((state) => state.notification.items);
  const loading = useSelector((state) => state.notification.loading);

  useEffect(() => {
    // Fetch notifications from backend on page load
    const fetchNotifications = async () => {
      try {
        const res = await getUserNotifications();
        dispatch(setNotifications(res.data.data));
      } catch (error) {
        console.error("❌ Failed to load notifications:", error);
      }
    };

    fetchNotifications();
  }, [dispatch]);

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        Loading notifications...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 min-h-screen bg-gray-50 dark:bg-slate-950">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
        <FiBell /> Notifications
      </h1>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((n, idx) => (
            <div
              key={n._id || idx}
              className="p-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm dark:shadow-none"
            >
              <div className="font-medium text-slate-900 dark:text-white">
                {n.message || "New Notification"}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {n.sender?.username
                  ? `${n.sender.username} • ${new Date(
                      n.createdAt
                    ).toLocaleString()}`
                  : new Date(n.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            No notifications yet
          </div>
        )}
      </div>
    </div>
  );
}
