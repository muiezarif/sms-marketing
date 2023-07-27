import jwt from "jsonwebtoken";


export const verifyToken = (req,res,next) => {
    const token = req.headers.authorization;
    if(!token){
        return res.status(401).json({success:false,message:"Not Authenticated",result:{},error:{}})
    }
    jwt.verify(token,process.env.JWT_SECRET_KEY,(err,user) => {
        if(err){
            return res.status(403).json({success:false,message:"Token Not Valid!",result:{},error:{}})
        }
        req.user = user
        next()
    })
}


export const verifyUser = (req,res,next) => {
    verifyToken(req,res,next, () => {
        if(req.user.id === req.params.id){
            next()
        }else{
            return res.status(403).json({success:false,message:"Not Authorized!",result:{},error:{}})
        }
    })    
}
