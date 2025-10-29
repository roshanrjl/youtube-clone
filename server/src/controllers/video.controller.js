import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { getVideoDurationInSeconds } from "get-video-duration";

//controller for getall videos
const getAllVideos = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;
  const sortDirection = sortType === "desc" ? -1 : 1;

  const result = await Video.aggregate([
    // 1️⃣ Filter videos
    {
      $match: {
        ...(query && {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
        }),
        ...(userId && {
          owner: new mongoose.Types.ObjectId(userId),
        }),
      },
    },
    // 2️ Join with User collection to get owner info
    {
      $lookup: {
        from: "users", // collection name in MongoDB (usually lowercase + plural)
        localField: "owner", // field in Video that stores userId
        foreignField: "_id", // field in User collection
        as: "owner",
      },
    },
    // 3️ Unwind the owner array to get a single object
    { $unwind: "$owner" },

    // 4️ Sort videos
    {
      $sort: {
        [sortBy]: sortDirection,
      },
    },

    //Pagination and total count
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              title: 1,
              description: 1,
              createdAt: 1,
              videoFile: 1,
              thumbnail: 1,
              username: "$owner.username",
              avatar: "$owner.avatar",
              ownerId: "$owner._id",
            },
          },
        ],
      },
    },
  ]);

  const videos = result[0].data;
  const total = result[0].metadata[0]?.total || 0;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { total, page, limit, videos },
        "All videos fetched successfully"
      )
    );
});

//controller for publishing video
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!req.files || !req.files.video) {
    return res
      .status(400)
      .json({ success: false, message: "No video file uploaded" });
  }
  const thumbnailpath = req.files.thumbnail?.[0].path;

  if (!thumbnailpath) {
    throw new ApiError(400, "couldnot found the thumbnail");
  }
  const thumbnailresult = await uploadOnCloudinary(thumbnailpath);

  if (!thumbnailresult) {
    throw new ApiError(
      500,
      "something went wrong while uploading to the cloudinary"
    );
  }
  const videopath = req.files.video?.[0].path;

  if (!videopath) {
    throw new ApiError(400, "videopath didn't found");
  }
  let duration;
  try {
    duration = await getVideoDurationInSeconds(videopath);
    console.log("Duration in seconds:", duration);
  } catch (error) {
    console.error("Error getting duration:", error);
    duration = 0; // fallback if needed
  }
  const coudinaryresult = await uploadOnCloudinary(videopath);
  console.log("checking response from cloudinary for video:", coudinaryresult);

  if (!coudinaryresult.url) {
    throw new ApiError(400, "couldn't found the video url from cloudinary");
  }
  const myvideo = await Video.create({
    videoFile: coudinaryresult.url,
    thumbnail: thumbnailresult.url,
    duration,
    title: title,
    description: description,
    owner: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, myvideo, "video created successfully"));
});
//controller for getting video by id
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const user = req.user._id;
  if (!videoId) {
    throw new ApiError(400, "didn't get video id");
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(403, "vidoeId is not valid");
  }

  const getvideo = await Video.findById(videoId);

  if (!getvideo) {
    throw new ApiError(400, "could get the video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, getvideo, "video by id fetched successfully"));
});
//controller for getting your video (i.e the video you have upload)
const yourVideos = asyncHandler(async (req, res) => {
  const owner = req.user._id;
  console.log("checking if controlled reached or not");

  if (!owner) {
    throw new ApiError(400, "Did not receive owner id");
  }

  const videoowner = await User.findById(owner);
  if (!videoowner) {
    throw new ApiError(
      400,
      "Could not find the owner matching with the provided id"
    );
  }

  const result = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos", // collection name in MongoDB
        localField: "_id", // user _id
        foreignField: "owner", // matches with Video.owner
        as: "videos",
        pipeline: [
          {
            $project: {
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              views: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        username: 1,
        avatar: 1,
        videos: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Your videos fetched successfully"));
});

//controller for updating the video
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const user = req.user._id;
  const { title, description } = req.body;

  // 1. Validate videoId
  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  // 2. Find the video
  const findVideo = await Video.findById(videoId);
  if (!findVideo) {
    throw new ApiError(404, "Video not found");
  }

  // 3. Check ownership (⚠️ Your schema uses 'user', not 'owner'?)
  if (findVideo.owner.toString() !== user.toString()) {
    throw new ApiError(403, "Unauthorized: You cannot edit this video");
  }

  // 4. Optional thumbnail upload
  let thumbnailUrl = findVideo.thumbnail;
  const newThumbnail = req.files?.thumbnail?.[0]?.path;

  if (newThumbnail) {
    const uploadThumbnail = await uploadOnCloudinary(newThumbnail);
    if (uploadThumbnail?.url) {
      thumbnailUrl = uploadThumbnail.url;
    }
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnailUrl,
      },
    },
    { new: true }
  );

  // 6. Send response
  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

//controller for deleting video
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const user = req.user._id;
  if (!videoId) {
    throw new ApiError(400, "could not found videoId");
  }
  const findvideo = await Video.findById(videoId);

  if (!findvideo) {
    throw new ApiError(400, "could not found the video");
  }
  if (findvideo.owner.toString() !== user.toString()) {
    throw new ApiError(
      403,
      "invalid user don't have right to delete the video"
    );
  }

  await Video.findByIdAndDelete(videoId);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "Unauthorized to toggle publish status");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        video,
        `Video is now ${video.isPublished ? "published" : "unpublished"}`
      )
    );
});

const addViews = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  // console.log("checking from addViews controller:",videoId)
  if (!videoId) {
    throw new ApiError(400, "videoId is required");
  }
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "video not found");
  }

  video.views += 1;
  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video.views, "views added successfully"));
});

const getSearchedVideo = asyncHandler(async (req, res) => {
  const query = req.query.q?.toLowerCase() || "";
  console.log("query from frontend:", query)
  if(!query){
    return new ApiError(400 , "didn't got any query from frontend please provide search query")
  }
  const videos = await Video.find({
    $or: [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ],
  });
  return res 
           .status(200)
           .json(new ApiResponse(200 , videos , "video found successfully"))

});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  addViews,
  yourVideos,
  getSearchedVideo
};
