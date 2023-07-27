import mongoose from "mongoose";

const {Schema} = mongoose

const ContactFileSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    file:{
        type:String,
        required:true
    },
    file_path:{
        type:String,
        required:true
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
},{timestamps:true})

export default mongoose.model("ContactFile",ContactFileSchema)