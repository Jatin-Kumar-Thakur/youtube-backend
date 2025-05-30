import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log(`DB is connected ! DB host : ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("Mongodb connection Error");
        process.exit(1);
    }
}

export default connectDB;