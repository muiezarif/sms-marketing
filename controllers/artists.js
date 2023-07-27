import Artists from "../models/Artists.js"
export const createArtists = async (req,res,next) => {
    const newArtists = new Artists(req.body)
    try {
        const savedArtists = await newArtists.save()
        res.status(200).json({success:true,message:"Success",result:savedArtists, error:{}})    
    } catch (error) {
        res.status(200).json({success:false,message:"Failure",result:{},error:error})
        // res.status(500).json(error)
    }
}

export const updateArtists = async (req,res,next) => {
    try {
        const updatedArtists = await Artists.findByIdAndUpdate(req.params.id, {$set: req.body},{new:true})
        res.status(200).json({success:true,message:"Success",result:updatedArtists, error:{}})    
    } catch (error) {
        res.status(200).json({success:false,message:"Failure",result:{},error:error})
    }
}

export const deleteArtists = async (req,res,next) => {
    try {
        await Artists.findByIdAndDelete(req.params.id)
        res.status(200).json({success:true,message:"Artists Deleted",result:{}, error:{}})     
    } catch (error) {
        res.status(200).json({success:false,message:"Failure",result:{},error:error})
    }
}

export const getArtists = async (req,res,next) => {
    try {
        const artists = await Artists.findById(req.params.id)
        res.status(200).json({success:true,message:"Success",result:artists, error:{}})    
    } catch (error) {
        res.status(200).json({success:false,message:"Failure",result:{},error:error})
    }
}

export const getAllArtists = async (req,res,next) => {
    try {
        const artists = await Artists.find()
        res.status(200).json({success:true,message:"Success",result:artists, error:{}})    
    } catch (error) {
        res.status(200).json({success:false,message:"Failure",result:{},error:error})
    }
}
