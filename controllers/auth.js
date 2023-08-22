import User from "../models/User.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import nodemailer from "nodemailer"
import Randomstring from "randomstring";
import Stripe from "stripe";
import twilio from "twilio"
import fs from "fs"
import path,{dirname,join} from "path";
import dotenv from "dotenv"
dotenv.config();
// const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
// const stripe = Stripe("sk_live_OKIox1szlbVdrY8ODbX62vf900FYE9MyGb")
const stripe = Stripe(process.env.STRIPE_TEST_SECRET_KEY)
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);
//q1034412@gmail.com
//yoyo@1234
// ddbkfkjykddoytum
// klonrrhulcbwlkbw
const sendResetPasswordEmail = async (req,name,email,token) => {
    try {
        const transporter = nodemailer.createTransport({
            service:"gmail",
            // host:"smtp.gmail.com",
            // port:8800,
            // secure:false,
            // requireTLS:true,
            auth:{
                user:"q1034412@gmail.com",
                pass:"klonrrhulcbwlkbw"
            }
        });
        const mailOptions = {
            from:"q1034412@gmail.com",
            to:email,
            subject:"Reset Password",
            html:"<p> Hi "+ name+ ", Please Go to the <a href="+`https://my.digitvl.com/`+"reset-password?token="+token+">link<a/> and reset your password</p>"
        }

        transporter.sendMail(mailOptions,function(error,info){
            if(error){
                console.log(error)
            }else{
                // res.status(200).json({success:true,message:"Reset Email sent",result:{}, error:error})
                console.log("Reset Email Sent" + info.response)
            }
        })
        
    } catch (error) {
        res.status(200).json({success:false,message:"Failed to send reset email",result:{}, error:error})
    }
}


export const registerUser = async (req,res,next) => {
    try {
        const salt = bcrypt.genSaltSync(10)
        const hash = bcrypt.hashSync(req.body.password,salt)
        const customer = await stripe.customers.create({
            email: req.body.email
          });
          let newUser
          if(customer){
            const subaccount =await twilioClient.api.accounts.create({
                friendlyName: req.body.username
              })
            newUser = new User({
                username:req.body.username,
                email:req.body.email,
                password:hash,
                phone:req.body.phone,
                customer_id:customer.id,
                twilio_sub_account:subaccount.sid
            })
          }else{
            return res.status(200).json({success:false,message:"Try Again! Something went wrong",result:{}, error:{}})
          }
        
        // const newAdmin = new Admin(req.body)
        const savedUser = await newUser.save()
        // Create the CSV content
        const csvContent = `first_name,last_name,email,phone_number`;

        // Define the file path and name
        const userId = savedUser._id.toString(); // Convert the ObjectId to a string
        const fileName = 'digitvl_sms_public_contacts.csv';
        const folderName = 'contactfiles';

        // Get the root directory (where your Node.js script is running)
        const rootDirectory = process.cwd();

        // Create the full path to the user folder and file
        const userFolderPath = path.join(rootDirectory, folderName, userId, 'file','digitvl_public');
        const filePath = path.join(userFolderPath, fileName);

        // Create the directory along with any parent directories if they don't exist
        fs.mkdirSync(userFolderPath, { recursive: true });

        // Write the CSV content to the file
        fs.writeFileSync(filePath, csvContent);
        res.status(200).json({success:true,message:"Success",result:savedUser, error:{}})     
    } catch (error) {
        console.log(error)
        res.status(200).json({success:false,message:error.message,result:{}, error:error})
    }
}



export const loginUser = async (req,res,next) => {
    try {
        const user = await User.findOne({email:req.body.email})
        if(!user){
            return res.status(200).json({success:false,message:"This user cannot be found",result:{}, error:{}})  
        }
        const isPasswordCorrect = await bcrypt.compare(req.body.password,user.password)
        if(!isPasswordCorrect){
            return res.status(200).json({success:false,message:"Wrong password",result:{}, error:{}})  
        }
        const {password, ...otherDetails} = user._doc
        const token = jwt.sign({id:user._id},process.env.JWT_SECRET_KEY)
        res.cookie("access_token",token,{httpOnly:true,}).status(200).json({success:true,message:"Success",result:{token:token,...otherDetails}, error:{}})     
    } catch (error) {
        console.log(error)
        res.status(200).json({success:false,message:"Failure",result:{}, error:error})
    }
}


export const forgotUserPassword = async (req,res,next) => {
    try {
        const user = await User.findOne({email:req.body.email})
        if(user){
            try {
                const rs = Randomstring.generate()
            await User.updateOne({email:req.body.email},{$set:{fp:rs}})
            sendResetPasswordEmail(req,user.username,user.email,rs)
            res.status(200).json({success:true,message:"Please check inbox of email",result:{}, error:{}})   
            } catch (error) {
                console.log(error)
                res.status(200).json({success:false,message:"Failure",result:{}, error:error})   
            }     
        }else{
            res.status(200).json({success:false,message:"Email does not exist",result:{}, error:{}})            
        }
    } catch (error) {
        console.log(error)
        res.status(200).json({success:false,message:"Failure",result:{}, error:error})
    }
}
export const resetUserPassword = async (req,res,next) => {
    console.log(req.body)
    try {
        const user = await User.findOne({fp:req.body.fp}).maxTimeMS(50000)
        console.log(user)
        if(user){
            const password = req.body.password
            const salt = bcrypt.genSaltSync(10)
            const hash = bcrypt.hashSync(password,salt)
            console.log(hash)
            await User.findByIdAndUpdate({_id:user._id},{$set:{password:hash,token:""}},{new:true})
            res.status(200).json({success:true,message:"Password Update Successful",result:{}, error:{}})
        }else{
            res.status(200).json({success:false,message:"This link is expired",result:{}, error:{}})
        }        
    } catch (error) {
        console.log(error)
        res.status(200).json({success:false,message:"Failure",result:{}, error:error})
    }
}





