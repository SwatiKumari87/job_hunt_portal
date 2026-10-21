import mongoose from "mongoose";
import { createDualModel } from "../utils/dualModel.js";

const applicationSchema = new mongoose.Schema({
    job:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Job',
        required:true
    },
    applicant:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    status:{
        type:String,
        enum:['pending', 'accepted', 'rejected'],
        default:'pending'
    }
},{timestamps:true});

const MongooseApplication = mongoose.model("Application", applicationSchema);
export const Application = createDualModel("applications", MongooseApplication);