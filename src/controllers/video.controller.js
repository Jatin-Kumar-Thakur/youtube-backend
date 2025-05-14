import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import getVideoDuration from "../utils/videoDuration.js";


// const getAllVideos = asyncHandler(async (req, res) => {
//     const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
//     //TODO: get all videos based on query, sort, pagination
//     const video=await Video.find();

//     if(!video){
//         throw new ApiError(404,"Video not found");
//     }

//     return res.status(200).json(new ApiResponse(200,video,"Videos retrived successfully."))
// })
const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "createdAt",
        sortType = "desc",
        userId
    } = req.query;

    // Convert to numbers
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Build dynamic filter
    const filter = {
        isPublished: true
    };

    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }

    if (userId) {
        filter.owner = userId;
    }

    // Build sort option
    const sortOption = {
        [sortBy]: sortType === "asc" ? 1 : -1
    };

    // Query database
    const videos = await Video.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNumber)
        .populate("owner", "fullName username avatar"); // optional populate

    const total = await Video.countDocuments(filter);

    return res.status(200).json(new ApiResponse(200, {
        videos,
        page: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        totalResults: total
    }, "Videos retrieved successfully."));
});


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video
    if(!title || !description) {
        throw new ApiError(400, "Both title and description is required");
    }
    const userId=req.user._id;
    if(!userId){
        throw new ApiError(400,"User id not found")
    }

    const videoLocalFile=req.files?.videofile?.[0]?.path
    const thumbnailLocalImage = req.files?.thumbnail?.[0]?.path

    if(!videoLocalFile || !thumbnailLocalImage ){
        throw new ApiError(500,"Both video and thumbnail is required");
    }
    console.log("video- ",videoLocalFile,)

    const duration =await getVideoDuration(videoLocalFile);
    
    let videofile;
    let thumbnail;
    try {
        videofile = await uploadOnCloudinary(videoLocalFile);
        thumbnail = await uploadOnCloudinary(thumbnailLocalImage)

        console.log("Video file and thumbnail",videofile , thumbnail)
    } catch (error) {
        console.log("Error uploading video and thumbnail",error);
        throw new ApiError(500,"Failed uploading video and thumbnail");
    }

    try {
        const video=await Video.create({
            videofile : videofile.url,
            thumbnail : thumbnail.url,
            title,
            description,
            duration : duration,
            owner : userId,
        })
        const createdVideo = await Video.findById(video._id);
        if(!createdVideo){
            throw new ApiError(500,"Something went wrong while uploading video")
        }

        return res.status(201).json(new ApiResponse(201,createdVideo , "Video uploaded successfully"))
    } catch (error) {
        console.log("Video uploading failed",error);
        if (videofile) {
            await deleteFromCloudinary(videofile.public_id);
        }
        if (thumbnail) {
            await deleteFromCloudinary(thumbnail.public_id)
        }
        throw new ApiError(500,"Something went wrong while uploading video");
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(new ApiResponse(200, video, "Video retrived by ID"));
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if (!videoId) {
        throw new ApiError(400, "VideoId is not found");
    }
    const { title, description } = req.body;
    if (!title || !description) {
        throw new ApiError(400, "Both fields are required.");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(400, "Video not found");
    }
    video.title = title;
    video.description = description;

    const thumbnailLocalImage = req.file?.path
    let thumbnail;
    if (thumbnailLocalImage) {
        thumbnail = await uploadOnCloudinary(thumbnailLocalImage);
        if (!thumbnail.url) {
            throw new ApiError(500, "Something went wrong while uploading thumbnail");
        }
        video.thumbnail = thumbnail.url;
    }


    await video.save();

    return res.status(200).json(new ApiResponse(200, video, "Video details updated successfully"));

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!videoId) {
        throw new ApiError(400, "VideoId is required");
    }
    const video = await Video.findByIdAndDelete(videoId);
    if (!video) {
        throw new ApiError(404, "Error while deleting video");
    }

    return res.status(200).json(new ApiResponse(200, video, "Video Deleted successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "VideoId not found");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found");
    }

    video.isPublished = !video.isPublished
    await video.save();

    return res.status(200).json(new ApiResponse(200, video, `Video published status changed to - ${video.isPublished}`));
})


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
};