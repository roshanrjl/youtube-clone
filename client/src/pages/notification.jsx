import React, { useEffect, useState } from "react";
import { Localstorage } from "../utils";
import { FiBell } from "react-icons/fi";
import { connectSocket } from "../socketClient/socket";
import axios from "axios";
import { getUserNotifications } from "../api/notificationApi/notificationApi";

export default function NotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Localstorage.get("accessToken");
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        const res = await getUserNotifications()
        console.log("checking the data",res.data.data)
        setNotifications(res.data.data);
      } catch (error) {
        console.error("❌ Failed to load notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    const socket = connectSocket(token);
    if (!socket) return;

    // ✅ Listen for real-time notifications
    socket.on("new_notification", (data) => {
      setNotifications((prev) => [data, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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
              key={idx}
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
