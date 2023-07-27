import mongoose from "mongoose";

const {Schema} = mongoose

const ArtistsSchema = new mongoose.Schema({
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
    insta_url:{
        type:String,
        required:true
    },
    fb_url:{
        type:String,
        required:true
    },
    twitter_url:{
        type:String,
        required:true
    },
    snapchat_url:{
        type:String,
        required:true
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
},{timestamps:true})

export default mongoose.model("Artists",ArtistsSchema)