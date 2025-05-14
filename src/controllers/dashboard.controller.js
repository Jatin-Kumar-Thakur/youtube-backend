import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.models.js"
import { Subscription } from "../models/subscription.models.js"
import { Like } from "../models/like.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user?._id;
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User id");
    }

    const totalViews = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" }
            }
        }
    ])
    const totalVideoViews = totalViews[0]?.totalViews || 0;

    const totalSubscribers = await Subscription.countDocuments({
        channel: new mongoose.Types.ObjectId(userId)
    });

    const totalVideos = await Video.countDocuments({
        owner: new mongoose.Types.ObjectId(userId)
    });

    const totalLikesAgg = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: { $sum: "$likes" }
            }
        }
    ]);
    const totalLikes = totalLikesAgg[0]?.totalLikes || 0;
    return res.status(200).json(new ApiResponse(200, {
        totalViews: totalVideoViews,
        totalSubscribers,
        totalVideos,
        totalLikes
    }, "Channel statistics fetched successfully."));

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user?._id;
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid UserId");
    }
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
        throw new ApiError(404, "User not found");
    }

    const videos = await Video.find({
        owner: new mongoose.Types.ObjectId(userId)
    }).sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, videos, "Retrived all Videos Successfully"));
})

export {
    getChannelStats,
    getChannelVideos
}