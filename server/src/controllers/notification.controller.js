// controllers/notification.controller.js
import { Notification } from "../models/notification.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getUserNotifications = asyncHandler(async (req, res) => {
  console.log("testing if controller reached or not....")
  const notifications = await Notification.find({ receiver: req.user._id })
    .sort({ createdAt: -1 })
    .populate("sender", "username");

  return res
    .status(200)
    .json(new ApiResponse(200, notifications, "Fetched notifications"));
});
