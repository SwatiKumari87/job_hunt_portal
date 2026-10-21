import mongoose from "mongoose";
import { createDualModel } from "../utils/dualModel.js";

const companySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    description:{
        type:String, 
    },
    website:{
        type:String 
    },
    location:{
        type:String 
    },
    logo:{
        type:String // URL to company logo
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    }
},{timestamps:true})

const MongooseCompany = mongoose.model("Company", companySchema);
export const Company = createDualModel("companies", MongooseCompany);