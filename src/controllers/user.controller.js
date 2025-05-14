
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.models.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/apiResponse.js';
import mongoose from 'mongoose';
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, username, email, password } = req.body;

    //validation
    if (
        [fullName, username, email, password].some((field) =>
            field.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }



    //Check whether user is exixting or not
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }


    //Here we Deal with the file data
    const avatarLocalImage = req.files?.avatar?.[0].path
    const coverLocalImage = req.files?.coverImage?.[0].path
    console.log("Avatar local path:", avatarLocalImage);

    if (!avatarLocalImage) {
        throw new ApiError(400, "Avatar Image is required");
    }

    let avatar;
    try {
        avatar = await uploadOnCloudinary(avatarLocalImage);
        console.log("Avatar uploaded Successfully", avatar);
    } catch (error) {
        console.log("Error uploading Avatar", error);
        throw new ApiError(500, "Avatar upload failed");
    }

    let coverImage;
    try {
        coverImage = await uploadOnCloudinary(coverLocalImage);
        console.log("CoverImage uploaded Successfully", coverImage);
    } catch (error) {
        console.log("Error uploading coverImage", error);
        throw new ApiError(500, "coverImage upload failed");
    }

    //register user in DB
    try {
        const user = await User.create({
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        })

        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )
        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering a user");
        }

        return res.status(201).json(new ApiResponse(200, createdUser, "User Registed Successfully"));
    } catch (error) {
        console.log("User creation failed");
        if (avatar) {
            await deleteFromCloudinary(avatar.public_id);
        }
        if (coverImage) {
            await deleteFromCloudinary(coverImage.public_id)
        }
        throw new ApiError(500, "Something went wrong while registering a user");
    }

})

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError("404", "User not found");
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.genereateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save();
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token");
    }
}

const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    console.log(username)
    console.log(email)
    console.log(password)
    if (!email || !password) {
        throw new ApiError(400, "Email and Password are required.");
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    //validate password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid crenditials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    const options = {
        httpOnly: true,
        secure: process.env.Node_ENV === "production"
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200,
            {
                user: loggedInUser, accessToken, refreshToken
            }
            , "User logged in successfully."));
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh Token is required")
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh Token")
        }
        console.log(user)
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Invalid refresh token")
        }
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        }
        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken
                    },
                    "Access Token refreshed successfully."
                )
            )
    } catch (error) {
        console.log(error)
        throw new ApiError(500, "Something went wrong while refreshing access Token", error)
    }
})

const logoutUser = asyncHandler(async (req, res) => {
    //TODO
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User loggedOut successfully"))

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, againNewPassword } = req.body
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    if (!oldPassword || !newPassword || !againNewPassword) {
        throw new ApiError(401, "All change password fields are required");
    }
    if (newPassword !== againNewPassword) {
        throw new ApiError(404, "new password dont not match with the reentered password");
    }
    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordValid) {
        throw new ApiError(401, "Old password is incorrect")
    }
    user.password = newPassword;
    user.save({ validateBeforeSave: false });

    res.status(200).json(new ApiResponse(200, {}, "Password Updated Successfully"));
})

const getCurrentUser = asyncHandler(async (req, res) => {
    res.status(200).json(new ApiResponse(200, req.user, "Current User Details"));
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;
    if (!fullName || !email) {
        throw new ApiError(400, "Both fullName and Email are required");
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"));
})

const updateUserAvatarImage = asyncHandler(async (req, res) => {

    const avatarLocalImage = req.file?.path
    if (!avatarLocalImage) {
        throw new ApiError(400, "Avatar Image is required");
    }
    let avatar = await uploadOnCloudinary(avatarLocalImage);
    if (!avatar.url) {
        throw new ApiError(500, "Something went wrong while uploading new avatar Image");
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken");
    res.status(200).json(new ApiResponse(200, user, "Avatar Updated Successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverLocalImage = req.file?.path;
    if (!coverLocalImage) {
        throw new ApiError(400, "Coverimage file is required");
    }
    const coverImage = await uploadOnCloudinary(coverLocalImage);
    if (!coverImage.url) {
        throw new ApiError(500, "Something went wrong while uploading new cover Image");
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    res.status(200).json(new ApiResponse(200, user, "Cover Image updated Successfully"));
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username?.trim()) {
        throw new ApiError(400, "Username is required");
    }
    const channel = await User.aggregate(
        [
            {
                $match: {
                    username: username?.toLowerCase()
                }
            },
            {
                $lookup: {
                    from: "subscription",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },
            {
                $lookup: {
                    from: "subscription",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscriberedTo"
                }
            },
            {
                $addFields: {
                    subscribersCount: {
                        $size: "$subscribers"
                    },
                    channelsSubscriberdToCount: {
                        $size: "$subscriberedTo"
                    },
                    isSubscribed: {
                        $cond: {
                            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                //Project only the necessary data
                $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                    subscribersCount: 1,
                    channelsSubscriberdToCount: 1,
                    isSubscribed: 1,
                    coverImage: 1,
                    email: 1,
                }
            }

        ]
    )

    if (!channel.length) {
        throw new ApiError(404, "Channel not found.")
    }
    return res.status(200).json(new ApiResponse(
        200,
        channel[0],
        "Channel profile fetched successfully"
    ))
})
const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "User",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            },
        }
    ])

    return res.status(200).json(new ApiResponse(
        200,
        user[0]?.watchHistory,
        "Watch History fetched successfully."
    ))
})

export {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatarImage,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};