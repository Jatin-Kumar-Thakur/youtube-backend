import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"



const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    const userId = req.user?._id;
    if (!isValidObjectId(channelId) || !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User or Channel ID")
    }

    if (channelId === String(userId)) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    const channel = await User.findById(channelId);
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

    const subscribed = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    })
    if (subscribed) {
        const unSubscribed = await Subscription.findByIdAndDelete(subscribed?._id);
        if (!unSubscribed) {
            throw new ApiError(500, "Something went wrong while unsubscribe channel");
        }
        return res.status(200).json(new ApiResponse(200, unSubscribed, "Channel UnSubscribed successfully"));
    }
    else {
        const subscribe = await Subscription.create({
            subscriber: userId,
            channel: channelId
        })
        if (!subscribe) {
            throw new ApiError(500, "Something went wrong while subscribing channel")
        }
        return res.status(200).json(new ApiResponse(200, subscribe, "Channel subscribed successfully"))
    }

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { subscriberId : channelId } = req.params
    if (!isValidObjectId(channelId)) {
        throw new ApiError(500, "Invalid Channel ID");
    }

    const existingChannel = await User.findById(channelId);
    if (!existingChannel) {
        throw new ApiError(500, "Channel Not Found")
    }

    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "username email avatar") // You can populate additional fields if needed
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, subscribers, "Subscriber list fetched successfully")
    );
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId:subscriberId } = req.params;

    // Validate subscriber ID
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid Subscriber ID");
    }

    // Check if subscriber exists
    const existingUser = await User.findById(subscriberId);
    if (!existingUser) {
        throw new ApiError(404, "Subscriber user not found");
    }

    // Find all subscriptions where the user is the subscriber
    const subscriptions = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "username email avatar") // populate channel details
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, subscriptions, "Subscribed channels fetched successfully")
    );
});


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}