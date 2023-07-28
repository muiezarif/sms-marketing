import express from "express"
import dotenv from "dotenv"
import mongoose from "mongoose"
import cookieParser from "cookie-parser"
import cors from "cors"
import bodyParser from "body-parser"
import authRoute from "./routes/auth.js"
import userRoute from "./routes/users.js"
import AdminBro from 'admin-bro'
import AdminBroExpress from '@admin-bro/express'
import AdminBroMongoose from '@admin-bro/mongoose'

AdminBro.registerAdapter(AdminBroMongoose)

import path,{dirname,join} from "path"
import { fileURLToPath } from 'url';
import User from "./models/User.js"
import Businesses from "./models/Businesses.js"
import Artists from "./models/Artists.js"
import ContactFile from "./models/ContactFile.js"
import BoughtPhoneNumbers from "./models/BoughtPhoneNumbers.js"
import PhoneNumberBuyingFailureReport from "./models/PhoneNumberBuyingFailureReport.js"
import PhoneSubscription from "./models/PhoneSubscription.js"
import Subscriptions from "./models/Subscriptions.js"
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
dotenv.config();


  

// DB Connection
const db_connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_DB_URL,{
            useNewUrlParser:true,
            useUnifiedTopology:true,
            tls:true,
        })
        console.log("Connected to mongodb")
    } catch (error) {
        throw error
    }
}



// Serve the static files from the upload folder
app.use('/images', express.static(join(__dirname, 'images')));
app.use('/contactfiles', express.static(join(__dirname, 'contactfiles')));
app.use("/api/auth", authRoute)
app.use("/api/users", userRoute)
app.use("/api/artists", userRoute)
app.use("/api/businesses", userRoute)

app.use((err,req,res,next) => {
    const errorStatus = err.status || 500
    const errorMessage = err.message || "Something went wrong!"
    return res.status(200).json({success:false,message:errorMessage,result:{},error:err})
})




app.get("/", (req,res) => {
    res.send("First request")
})
app.listen(process.env.PORT || 3030,"::", function(){
    db_connect()
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
    const AdminBroOptions = {
        resources: [User,Artists,BoughtPhoneNumbers,Businesses,ContactFile,PhoneNumberBuyingFailureReport,PhoneSubscription,Subscriptions],
        databases: [mongoose],
        rootPath: '/admin',
        branding: {
            companyName: 'Notify',
        }
      }
      const adminBro = new AdminBro(AdminBroOptions)
      const ADMIN = {
        email:"admin@gmail.com",
        password:"admin"
    }
      const router = AdminBroExpress.buildAuthenticatedRouter(adminBro,{
        cookieName: 'admin',
        cookiePassword: "admin",
        authenticate: async (email,password) => {
        if(email === ADMIN.email && password === ADMIN.password){
            return ADMIN
        }
        return null
    },
      })
    app.use(adminBro.options.rootPath, router)
    // Middlewares
    app.use(cors())
    app.use(cookieParser())
    app.use(express.json())
    app.use(bodyParser.urlencoded({extended:true}))
  });