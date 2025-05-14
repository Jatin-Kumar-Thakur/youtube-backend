import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";



const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {
        video: videoId
    }

    const comment = await Comment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

    const totalComment = await Comment.countDocuments(filter);

    return res.status(200).json(new ApiResponse(200, {
        comment,
        totalComment,
        page: pageNumber,
        totalPages: Math.ceil(totalComment / limitNumber),
        totalResults: totalComment
    },
        "Comment retrived Successfully."
    ))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid Video ID");
    }
    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required");
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const newComment = await Comment.create({
        video: videoId,
        content: content.trim(),
        owner: userId,
    })

    if (!newComment) {
        throw new ApiError(400, "Something went when add new comment.")
    }

    return res.status(201).json(new ApiResponse(201, newComment, "Comment added successfully"));

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params
    const { content } = req.body;
    const userId = req.user?._id;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }
    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    const existingComment = await Comment.findById(commentId);
    if (!existingComment) {
        throw new ApiError(404, "Comment not Found");
    }
    if (!existingComment.owner.equals(userId)) {
        throw new ApiError(403, "You are not authorized to update this comment");
    }

    existingComment.content = content.trim();
    await existingComment.save();

    return res.status(200).json(new ApiResponse(200, existingComment, "Comment updated successfully"));

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params
    const userId = req.user?._id;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }
    const existingComment = await Comment.findById(commentId);
    if (!existingComment) {
        throw new ApiError(404, "Comment not Found");
    }
    if (!existingComment.owner.equals(userId)) {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }

    const deleteComment = await Comment.findByIdAndDelete(commentId);
    if (!deleteComment) {
        throw new ApiError(400, "Something wentwrong while deleting comment");
    }

    return res.status(200).json(new ApiResponse(200, "Comment deleted successfully"));
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}