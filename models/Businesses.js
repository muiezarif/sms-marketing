import mongoose from "mongoose";

const {Schema} = mongoose

const BusinessesSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    bio:{
        type:String,
        required:true
    },
    img_url:{
        type:String,
        required:true
    },
    website_url:{
        type:String,
        required:true
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
},{timestamps:true})

export default mongoose.model("Businesses",BusinessesSchema)