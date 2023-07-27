import mongoose from "mongoose";

const {Schema} = mongoose

const PhoneSubscriptionsSchema = new mongoose.Schema({
    subscription:{
        type:Object,
        required:true
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
},{timestamps:true})

export default mongoose.model("PhoneSubscriptions",PhoneSubscriptionsSchema)