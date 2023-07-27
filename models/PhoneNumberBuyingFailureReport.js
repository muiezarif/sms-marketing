import mongoose from "mongoose";

const {Schema} = mongoose

const PhoneNumberBuyingFailureReportSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    errorInfo:{
        type:String,
        required:true
    },
    phoneNumber:{
        type:String
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
},{timestamps:true})

export default mongoose.model("PhoneNumberBuyingFailureReport",PhoneNumberBuyingFailureReportSchema)