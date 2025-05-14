import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"
import { Comment } from "../models/comment.models.js"
import { Tweet } from "../models/tweet.models.js";


const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user?._id;
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "invalid video ID");
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    let existingLike = await Like.findOne({ video: videoId, likedBy: userId })
    if (!existingLike) {
        const newLike = await Like.create({ video: videoId, likedBy: userId })
        return res.status(201).json(
            new ApiResponse(201, newLike, "Video liked successfully")
        );
    }
    else {
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(
            new ApiResponse(200, null, "Video unliked successfully")
        );
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const userId = req.user?._id;
    //TODO: toggle like on comment
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    const existingLike = await Like.findOne({ comment: commentId, likedBy: userId })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(201).json(new ApiResponse(201, null, "Comment unLiked SuccessFully"));
    }
    else {
        const newLike = await Like.create({
            comment: commentId,
            likedBy: userId,
        })
        return res.status(201).json(new ApiResponse(201, newLike, "Comment liked successfully"));
    }


})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const userId = req.user?._id;
    //TODO: toggle like on tweet
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404, "Invalid tweetId");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: userId,
    })
    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id); return res.status(200).json(new ApiResponse(200, null, "Tweet unliked successfully"));
    }
    else {
        const newLike = await Like.create({
            tweet: tweetId,
            likedBy: userId,
        })
        return res.status(201).json(new ApiResponse(201, newLike, "Tweet Liked successfully"));
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user?._id;
    if (!isValidObjectId(userId)) {
        throw new ApiError(404, "Invalid userID")
    }

    const liked = await Like.find({
        likedBy: userId,
        video: { $ne: null }
    }).populate("video")

    if (!liked) {
        throw new ApiError(404, "Something went wrong while getting liked video")
    }

    const likedVideo = liked.map(like => like.video);

    return res.status(200).json(new ApiResponse(200, likedVideo, "Liked videos"));
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}