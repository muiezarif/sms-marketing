import mongoose from "mongoose";

const {Schema} = mongoose

const BoughtPhoneNumbersSchema = new mongoose.Schema({
    phoneNumber:{
        type:String,
        required:true
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
},{timestamps:true})

export default mongoose.model("BoughtPhoneNumbers",BoughtPhoneNumbersSchema)