// id string pk 
// subscriber ObjectId users 
// channel Objectid users 
// createdAt Date 
// updatedAt Date 

import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, //One who is subscribing
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, //onw to whom 'subscriber' is subscribing
        ref: "User"
    }

},
    {
        timestamps: true
    }

);

export const Subscription = new mongoose.model("Subscription", subscriptionSchema);