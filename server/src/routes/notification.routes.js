import express from "express";
import { Router } from "express";
import { getUserNotifications } from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/").get(getUserNotifications);
export default router;
