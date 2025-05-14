
import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    const userId = req.user?._id;
    //TODO: create playlist
    if (!name || !description) {
        throw new ApiError(400, "Both fields are required");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid UserID");
    }

    const existingPlayList = await Playlist.findOne({
        name: name.trim(),
        owner: userId
    })
    if (existingPlayList) {
        throw new ApiError(409, "PlayList with this description and user name already exists");
    }
    const playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: userId,
    });
    if (!playlist) {
        throw new ApiError(500, "Something went wrong while creating new Playlist");
    }

    return res.status(201).json(new ApiResponse(201, playlist, "Playlist created Successfully"));
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User ID");
    }

    const playlists = await Playlist.find({
        owner: userId
    });

    return res.status(200).json(new ApiResponse(200, playlists, "Playlist retrived."));
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(500, "something went wrong while getting playlist");
    }

    return res.status(200).json(new ApiResponse(200, playlist, "PLaylist retrived successfully"));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlistId or videoId");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found.");
    }
    if (playlist.video.includes(videoId)) {
        return res.status(200).json(
            new ApiResponse(200, playlist, "Video already exists in playlist")
        );
    }

    playlist.video.push(videoId);
    await playlist.save()

    return res.status(200).json(new ApiResponse(200, playlist, "Video added successfully"));
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlistId or videoId");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found.");
    }
    if (playlist.video.includes(videoId)) {
        const index = playlist.video.indexOf(videoId);
        if (index > -1) {
            playlist.video.splice(index, 1);
            await playlist.save();
        }
        return res.status(200).json(
            new ApiResponse(200, playlist, "Video removed Successfully")
        );
    }



    return res.status(200).json(new ApiResponse(200, playlist, "Video not found in the playlist"));

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }

    const deletePlaylist = await Playlist.findByIdAndDelete(playlistId);
    if (!deletePlaylist) {
        return res.status(404).json(new ApiResponse(500, null, "Playlist not found or already deleted"));
    }
    return res.status(200).json(new ApiResponse(200, deletePlaylist
        , "Playlist deleted successfully."));


})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist
    if (!isValidObjectId(playlistId)) {
        throw new Error(400, "Invalid playlistId");
    }
    if (!name?.trim() || !description?.trim()) {
        throw new ApiError(400, "Both fields are required");
    }

    const existedPlaylist = await Playlist.findById(playlistId);
    if (!existedPlaylist) {
        throw new ApiError(404, "Playlist not found");
    }

    existedPlaylist.name = name.trim();
    existedPlaylist.description = description.trim();
    existedPlaylist.save();

    return res.status(200).json(new ApiResponse(200, existedPlaylist, "Playlist updated successfully"));
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
