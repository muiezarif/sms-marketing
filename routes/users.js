import express from "express";
import { addUserContactToFile, addUserContactToPublicFile, buySmsBundle, buyTwilioPhoneNumber, cancelPhoneSubscriptionToPlatform, cancelSubscriptionToPlatform, deleteUser, editUserContactFromFile, getAllUserContactFiles, getAllUsers, getFailureMessages, getInboundMessages, getPaginatedUserContactsFromFile, getPaymentClientSecret, getReportsLogs, getTwilioAvailablePhoneNumbers, getUser, getUserByUsername, getUserContactsFromFile, getUserDashboardData, getUserPhoneSubscriptionDetail, getUserSubscriptionDetail, removeUserContactFromFile, resubscribePhoneNumber, sendSingleSms, sendSms, subscribeToPlatform, updateUser, uploadContactFile } from "../controllers/user.js";
import { verifyUser } from "../utils/verifyToken.js";
import multer from "multer"
import path from "path"
import fs from "fs"

const router = express.Router();

const storage = multer.diskStorage({
    destination:(req,file,cb) => {
        // console.log("innnnn")
        // console.log(req)
        const userId = req.user.id
        // const userId = "dlddd"
        const fileName = req.body.title
        const destinationPath = `./contactfiles/${userId}/file/${fileName}`
        fs.mkdirSync(destinationPath, { recursive: true });
        cb(null,destinationPath)
    },
    filename:(req,file,cb) => {
        console.log("gg")
        console.log(file)
        cb(null,Date.now() + path.extname(file.originalname))
    }
})
const imageStorage = multer.diskStorage({
    destination:(req,file,cb) => {
        const userId = req.user.id
        // const fileName = req.file.filename
        const destinationPath = `./images/${userId}/profile_img/`
        fs.mkdirSync(destinationPath, { recursive: true });
        cb(null,destinationPath)
    },
    filename:(req,file,cb) => {
        const userId = req.user.id;
        const filename = `${userId}${path.extname(file.originalname)}`
        cb(null,filename)
    }
})
const upload = multer({storage:storage})
const imageUpload = multer({storage:imageStorage})

//UPDATE 
router.put("/:id/update",verifyUser, updateUser)
//DELETE 
router.delete("/:id/delete",verifyUser, deleteUser)
//GET 
router.get("/:id", getUser)
//GET ALL 
router.get("/", getAllUsers)

// upload contact file
router.post("/upload-contact-file/",verifyUser,upload.single('contactfiles'),uploadContactFile)
router.get("/get-contact-list/:userid",verifyUser,getAllUserContactFiles)
router.get("/get-dashboard-details/:userid",verifyUser,getUserDashboardData)
router.get("/get-user-info/:id",verifyUser,getUser)
router.put("/update-user-info/:id",verifyUser,imageUpload.single('images'),updateUser)
router.get("/get-contacts-from-file/:id",verifyUser,getUserContactsFromFile)
router.get("/get-contacts-from-file/:id/:page",verifyUser,getPaginatedUserContactsFromFile)
router.post("/add-contact-to-file/:id",verifyUser,addUserContactToFile)
router.post("/add-contact-to-public-file",addUserContactToPublicFile)
router.post("/edit-contact-from-file/:id",verifyUser,editUserContactFromFile)
router.post("/delete-contact-from-file/:id",verifyUser,removeUserContactFromFile)
router.post("/get-payment-secret",verifyUser,getPaymentClientSecret)
router.post("/platform-subscription",verifyUser,subscribeToPlatform)
router.post("/cancel-platform-subscription",verifyUser,cancelSubscriptionToPlatform)
router.post("/cancel-phone-subscription",verifyUser,cancelPhoneSubscriptionToPlatform)
router.get("/twilio/get-phone-numbers",verifyUser,getTwilioAvailablePhoneNumbers)
router.post("/twilio/buy-phone-number",verifyUser,buyTwilioPhoneNumber)
router.post("/twilio/resubscribe-phone-number",verifyUser,resubscribePhoneNumber)
router.post("/send-sms",verifyUser,sendSms)
router.post("/send-single-sms",verifyUser,sendSingleSms)
router.post("/buy-sms-bundle",verifyUser,buySmsBundle)
router.get("/get-failure-logs/:userid",verifyUser,getReportsLogs)
router.get("/get-inbound-messages/:userid",verifyUser,getInboundMessages)
router.get("/get-subscription-detail/:userid",verifyUser,getUserSubscriptionDetail)
router.get("/get-phone-subscription-detail/:userid",verifyUser,getUserPhoneSubscriptionDetail)
router.get("/get-user/:username",getUserByUsername)
// Route to handle incoming SMS messages
router.post('/twiml', (req, res) => {
     // Extract the SMS message content from the request
    // Generate your desired TwiML response based on the received SMS message
    const twimlResponse = `
      <Response>
        <Message>Thanks for your response. We will get back to you shortly</Message>
      </Response>
    `;
    res.type('text/xml');
    res.send(twimlResponse);
  });

export default router