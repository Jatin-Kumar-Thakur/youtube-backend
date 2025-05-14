import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo
} from "../controllers/video.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/").get(getAllVideos);
router.route("/").post(upload.fields(
    [
        {
            name: "videofile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
    ]),
    publishAVideo
)
router.route("/:videoId").get(getVideoById);
router.route("/:videoId").patch(upload.single("thumbnail"),updateVideo)
router.route("/:videoId").delete(deleteVideo)
router.route("/toggle/publish/:videoId").patch(togglePublishStatus)

export default router;