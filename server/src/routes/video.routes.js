import { Router } from "express";
import {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  addViews,
  yourVideos,
  getSearchedVideo
} from "../controllers/video.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/search/").get(getSearchedVideo)

router.use(verifyJWT);

router
  .route("/")
  .get(getAllVideos)
  .post(
    upload.fields([
      {
        name: "video",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishAVideo
  );
router.route("/yourVideo").get(yourVideos);
router.route("/:videoId").get(getVideoById).delete(deleteVideo);

router.route("/:videoId").patch(
  upload.fields([
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  updateVideo
);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);
router.route("/increment-views/:videoId").post(addViews);


export default router;
