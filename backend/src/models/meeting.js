import mongoose from "mongoose";
import { Schema } from "mongoose";

const meetingSchema = new Schema({
    user_id: {
        type: String, required: true
    },
    meetingCode: {
        type: String, required: true
    },
    meetigDate:{
        type: Date, default: Date.now
    }
});

const Meeting = mongoose.model("Meeting", meetingSchema);

export {Meeting};