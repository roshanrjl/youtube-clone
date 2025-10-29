import { Router } from "express";
import{
GenerateTitle
} from "../controllers/AI_Related.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()
router.use(verifyJWT)

router.route("/ai").post( upload.single("video"),GenerateTitle)

export default router;