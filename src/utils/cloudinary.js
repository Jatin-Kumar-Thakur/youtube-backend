import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'
import dotenv from 'dotenv';
// Configuration cloundinary
dotenv.config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
// console.log("Cloud name:", process.env.CLOUDINARY_CLOUD_NAME);
// console.log("API Key:", process.env.CLOUDINARY_API_KEY);
// console.log("API Secret:", process.env.CLOUDINARY_API_SECRET ? "Loaded" : "Missing");

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(
            localFilePath, {
            resource_type: "auto"
        }
        )
        console.log("File uploaded on cloudinary. File src" + response.url)

        //once the file is uploaded we eould like to delete it from our server
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
}

const deleteFromCloudinary= async (publicId)=>{
    try {
        const result=await cloudinary.uploader.destroy(publicId);
        console.log("Deleted from cloudinary",publicId);
    } catch (error) {
        console("Error deleting cloudinary",error);
        return null;
    }
}
export { uploadOnCloudinary , deleteFromCloudinary }