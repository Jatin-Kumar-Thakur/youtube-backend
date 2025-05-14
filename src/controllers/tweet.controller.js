import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.models.js"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const userId = req.user?._id;
    const { content } = req.body;
    if (!content || !content.trim()) {
        throw new ApiError(400, "Content is required");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
        throw new ApiError(404, "User not found.");
    }

    const tweet = await Tweet.create({
        content: content.trim(),
        owner: userId
    })
    if (!tweet) {
        throw new ApiError(500, "Something went wrong while creating tweet");
    }

    return res.status(201).json(new ApiResponse(201, tweet, "Tweet created Successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params;
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
        throw new ApiError(404, "User not found.");
    }

    const userTweets = await Tweet.find({
        owner: userId
    }).sort({ createdAt: -1 });



    return res.status(200).json(new ApiResponse(200,
        {
            userTweets,
            TotalUserTweets: userTweets.length
        },
        "Retrived all tweets of a User."
    ))

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { content } = req.body;
    const { tweetId } = req.params;
    const userId = req.user?._id;

    if (!content || !content.trim()) {
        throw new ApiError(400, "Content is required");
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found.")
    }

    if (!tweet.owner.equals(userId)) {
        throw new ApiError(403, "You are not allowed to update this tweet");
    }

    tweet.content = content.trim();

    const updatedTweet = await tweet.save();
    if (!updatedTweet) {
        throw new ApiError(500, "Something went wrong while updating tweet")
    }

    return res.status(200).json(new ApiResponse(200, updateTweet, "Tweet Updated Succesfully"));
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;
    const userId = req.user?._id;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (!tweet.owner.equals(userId)) {
        throw new ApiError(403, "You are not authorized to delete this tweet");
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    return res.status(200).json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}