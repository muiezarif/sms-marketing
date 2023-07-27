import Businesses from "../models/Businesses.js"
export const createBusinesses = async (req,res,next) => {
    const newBusinesses = new Businesses(req.body)
    try {
        const savedBusinesses = await newBusinesses.save()
        res.status(200).json({success:true,message:"Success",result:savedBusinesses, error:{}})    
    } catch (error) {
        res.status(200).json({success:false,message:"Failure",result:{},error:error})
        // res.status(500).json(error)
    }
}

export const updateBusinesses = async (req,res,next) => {
    try {
        const updatedBusinesses = await Businesses.findByIdAndUpdate(req.params.id, {$set: req.body},{new:true})
        res.status(200).json({success:true,message:"Success",result:updatedBusinesses, error:{}})    
    } catch (error) {
        res.status(200).json({success:false,message:"Failure",result:{},error:error})
    }
}

export const deleteBusinesses = async (req,res,next) => {
    try {
        await Businesses.findByIdAndDelete(req.params.id)
        res.status(200).json({success:true,message:"Businesses Deleted",result:{}, error:{}})     
    } catch (error) {
        res.status(200).json({success:false,message:"Failure",result:{},error:error})
    }
}

export const getBusinesses = async (req,res,next) => {
    try {
        const businesses = await Businesses.findById(req.params.id)
        res.status(200).json({success:true,message:"Success",result:businesses, error:{}})    
    } catch (error) {
        res.status(200).json({success:false,message:"Failure",result:{},error:error})
    }
}

export const getAllBusinesses = async (req,res,next) => {
    try {
        const businesses = await Businesses.find()
        res.status(200).json({success:true,message:"Success",result:businesses, error:{}})    
    } catch (error) {
        res.status(200).json({success:false,message:"Failure",result:{},error:error})
    }
}
