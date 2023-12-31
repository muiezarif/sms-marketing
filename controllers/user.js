import ContactFile from "../models/ContactFile.js"
import User from "../models/User.js"
import csvParser from "csv-parser"
import path from "path"
import fs from "fs"
import Stripe from "stripe";
import twilio from "twilio"
import Subscriptions from "../models/Subscriptions.js"
import BoughtPhoneNumbers from "../models/BoughtPhoneNumbers.js"
import PhoneNumberBuyingFailureReport from "../models/PhoneNumberBuyingFailureReport.js"
import cron from "node-cron"
import PhoneSubscription from "../models/PhoneSubscription.js"
import dotenv from "dotenv"
dotenv.config();
// const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
// const stripe = Stripe("sk_live_OKIox1szlbVdrY8ODbX62vf900FYE9MyGb")
const stripe = Stripe(process.env.STRIPE_TEST_SECRET_KEY)
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

const messagingServiceSid = 'MGc510e563f78cab9012e89a8c7ef3a620';
export const createUser = async (req, res, next) => {
  const newUser = new User(req.body)
  try {
    const savedUser = await newUser.save()
    res.status(200).json({ success: true, message: "Success", result: savedUser, error: {} })
  } catch (error) {
    res.status(200).json({ success: false, message: "Failure", result: {}, error: error })
    // res.status(500).json(error)
  }
}

export const updateUser = async (req, res, next) => {
  try {
    // console.log(req.file)
    if (req.file) {
      const filePath = `${req.protocol}://${req.hostname}/` + req.file.path
      const updatedUser = await User.findByIdAndUpdate(req.params.id, { $set: req.body, $set: { img: filePath, img_path: req.file.destination } }, { new: true })
      res.status(200).json({ success: true, message: "Success", result: updatedUser, error: {} })
    } else {
      const updatedUser = await User.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
      res.status(200).json({ success: true, message: "Success", result: updatedUser, error: {} })
    }


  } catch (error) {
    res.status(200).json({ success: false, message: "Failure", result: {}, error: error })
  }
}

export const deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.status(200).json({ success: true, message: "User Deleted", result: {}, error: {} })
  } catch (error) {
    res.status(200).json({ success: false, message: "Failure", result: {}, error: error })
  }
}

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
    res.status(200).json({ success: true, message: "Success", result: user, error: {} })
  } catch (error) {
    res.status(200).json({ success: false, message: "Failure", result: {}, error: error })
  }
}

export const getUserByUsername = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: { $regex: new RegExp('^' + req.params.username, 'i') } });
    if (!user) {
      // Handle case where no user is found
      res.status(404).json({ success: false, message: "User not found", result: {}, error: {} });
      return;
    }
    res.status(200).json({ success: true, message: "Success", result: user, error: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failure", result: {}, error: error });
  }
}

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
    res.status(200).json({ success: true, message: "Success", result: users, error: {} })
  } catch (error) {
    res.status(200).json({ success: false, message: "Failure", result: {}, error: error })
  }
}


export const uploadContactFile = async (req, res, next) => {
  console.log(req.file)
  var newPhotos = []
  // const photosArray = JSON.parse(req.body.photos)
  if (req.files) {
    req.files.map(item => {
      // console.log(item)
      newPhotos.push(`${req.protocol}://${req.hostname}:${req.socket.localPort}/` + item.path)
    })
  }
  const filePath = `${req.protocol}://${req.hostname}:${req.socket.localPort}/` + req.file.path

  const data = {
    title: req.body.title,
    file: filePath,
    file_path: req.file.path,
    user: req.body.user
  }
  console.log(data)
  const newContactFile = new ContactFile(data)
  try {
    const savedContactFile = await newContactFile.save()
    res.status(200).json({ success: true, message: "Success", result: savedContactFile, error: {} })
  } catch (error) {
    res.status(200).json({ success: false, message: "Failure", result: {}, error: error })
    // res.status(500).json(error)
  }
}

export const getAllUserContactFiles = async (req, res, next) => {
  try {
    const users_contact_files = await ContactFile.find({ user: req.params.userid })
    const filePath = "contactfiles/" +req.params.userid+ "/file/digitvl_public/digitvl_sms_public_contacts.csv"
    const default_file = {
      title:"Public",
      file:filePath,
      filePath:filePath,
      user:req.params.userid
    }
    res.status(200).json({ success: true, message: "Success", result: {users_contact_files,default_file}, error: {} })
  } catch (error) {
    res.status(200).json({ success: false, message: "Failure", result: {}, error: error })
  }
}

export const getUserContactsFromFile = async (req, res, next) => {
  try {
    const contact_file = await ContactFile.findById(req.params.id)
    const contacts = []
    fs.createReadStream(contact_file.file_path).pipe(csvParser({})).on('data', (data) => {
      contacts.push(data)
    }).on('end', () => {
      res.status(200).json({ success: true, message: "Success", result: contacts, error: {} })
    })

  } catch (error) {
    res.status(200).json({ success: false, message: "Failure", result: {}, error: error })
  }
}

export const getUserDashboardData = async (req, res, next) => {
  try {
    const contacts = await ContactFile.find({ user: req.params.userid })
    const user = await User.findById(req.params.userid)
    // console.log(user.twilio_phone_number)
    let successMessageLogs
    let failureMessageLogs
    let subTwilioClient
    // Fetch the message logs for the specified phone number
    await twilioClient.api.accounts(user.twilio_sub_account).fetch()
      .then(subaccount => {
        console.log('Account SID:', subaccount.sid);
        console.log('Auth Token:', subaccount.authToken);
        subTwilioClient = twilio(subaccount.sid, subaccount.authToken)
      })
      .catch(error => {
        console.error('Error fetching subaccount details:', error);
      });
    await subTwilioClient.messages.list({ from: user.twilio_phone_number })
      .then((messages) => {
        // Store the message logs in an array
        successMessageLogs = messages.filter((message) => message.status === 'delivered').map((message) => ({
          sid: message.sid,
          from: message.from,
          to: message.to,
          body: message.body,
          dateSent: message.dateSent,
        }));

        failureMessageLogs = messages.filter((message) => message.status === 'undelivered').map((message) => ({
          sid: message.sid,
          from: message.from,
          to: message.to,
          body: message.body,
          dateSent: message.dateSent,
        }));

      })
      .catch((err) => {
        console.error('Error fetching message logs:', err);
      });

    const result = { contacts, successMessageLogs, failureMessageLogs, available_sms: user.available_sms, user }
    res.status(200).json({ success: true, message: "Success", result: result, error: {} })

  } catch (error) {
    console.log(error)
    res.status(200).json({ success: false, message: "Failure", result: {}, error: error })
  }
}

export const getPaginatedUserContactsFromFile = async (req, res, next) => {
  try {
    let filePath
    if(req.params.id === "public"){
      filePath = "contactfiles//" +req.params.userid+ "//file//digitvl_public//digitvl_sms_public_contacts.csv"
    }else{
      const contact_file = await ContactFile.findById(req.params.id);
      filePath = contact_file.file_path
    }
    const contacts = [];
    const pageSize = 30; // Number of contacts per page
    const pageNumber = parseInt(req.params.page) || 1; // Get the requested page number from query params (default: 1)
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = pageNumber * pageSize;
    fs.createReadStream(filePath)
      .pipe(csvParser({}))
      .on('data', (data) => {
        contacts.push(data);
      })
      .on('end', () => {
        const paginatedContacts = contacts.slice(startIndex, endIndex);
        const paginatedResult = paginatedContacts.map((contact, index) => ({
          ...contact,
          originalIndex: startIndex + index // Add originalIndex property to each contact
        }));

        res.status(200).json({
          success: true,
          message: "Success",
          result: paginatedResult,
          pagination: {
            totalContacts: contacts.length,
            pageSize,
            pageNumber,
            totalPages: Math.ceil(contacts.length / pageSize)
          },
          error: {}
        });
      });
  } catch (error) {
    res.status(200).json({
      success: false,
      message: "Failure",
      result: {},
      error: error
    });
  }
};

export const editUserContactFromFile = async (req, res, next) => {
  try {
    const contact_file = await ContactFile.findById(req.params.id);
    const results = [];
    const updatedData = [];
    const rowToEdit = req.body.rowId; // Row index to edit
    const rowData = req.body.rowData; // Updated row data

    fs.createReadStream(contact_file.file_path)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        // Copy existing data and update the specific column of the specific row
        for (let i = 0; i < results.length; i++) {
          if (i === rowToEdit) {
            const updatedRow = { ...results[i], ...rowData };
            updatedData.push(updatedRow);
          } else {
            updatedData.push(results[i]);
          }
        }

        const writeStream = fs.createWriteStream(contact_file.file_path);

        // Write column names
        const columnNames = Object.keys(updatedData[0]);
        writeStream.write(columnNames.join(',') + '\n');

        // Write each row
        for (const row of updatedData) {
          const rowValues = columnNames.map((column) => row[column] !== undefined ? row[column] : '');
          writeStream.write(rowValues.join(',') + '\n');
        }

        writeStream.end();
        console.log('CSV file edited successfully.');

        res.status(200).json({ success: true, message: 'Success', result: updatedData, error: {} });
      });
  } catch (error) {
    console.log(error);
    res.status(200).json({ success: false, message: 'Failure', result: {}, error: error });
  }
};

export const removeUserContactFromFile = async (req, res, next) => {
  try {
    const contact_file = await ContactFile.findById(req.params.id);
    const results = [];
    const rowToRemove = req.body.rowId; // Row index to remove

    fs.createReadStream(contact_file.file_path)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        // Remove the specific row from the results array
        results.splice(rowToRemove, 1);

        const writeStream = fs.createWriteStream(contact_file.file_path);

        // Write column names
        const columnNames = Object.keys(results[0]);
        writeStream.write(columnNames.join(',') + '\n');

        // Write each row
        for (const row of results) {
          const rowValues = columnNames.map((column) => row[column]);
          writeStream.write(rowValues.join(',') + '\n');
        }

        writeStream.end();
        console.log('CSV file updated successfully - row removed.');

        res.status(200).json({ success: true, message: 'Success', result: {}, error: {} });
      });
  } catch (error) {
    console.log(error);
    res.status(200).json({ success: false, message: 'Failure', result: {}, error: error });
  }
};

export const addUserContactToFile = async (req, res, next) => {
  try {
    const contact_file = await ContactFile.findById(req.params.id);
    const results = [];
    const newRowData = req.body.rowData; // New row data to add

    fs.createReadStream(contact_file.file_path)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        // Add the new row data at the beginning of the results array
        results.unshift(newRowData);

        const writeStream = fs.createWriteStream(contact_file.file_path);

        // Write column names
        const columnNames = Object.keys(results[0]);
        writeStream.write(columnNames.join(',') + '\n');

        // Write each row
        for (const row of results) {
          const rowValues = columnNames.map((column) => row[column]);
          writeStream.write(rowValues.join(',') + '\n');
        }

        writeStream.end();
        console.log('CSV file updated successfully - row added at the start.');

        res.status(200).json({ success: true, message: 'Success', result: {}, error: {} });
      });
  } catch (error) {
    console.log(error);
    res.status(200).json({ success: false, message: 'Failure', result: {}, error: error });
  }
};

export const addUserContactToPublicFile = async (req, res, next) => {
  try {
    const contact_file_path = `contactfiles/${req.body.userId}/file/digitvl_public/digitvl_sms_public_contacts.csv`;
    const results = [];
    const newRowData = req.body.rowData; // New row data to add

    fs.createReadStream(contact_file_path)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        // Add the new row data at the beginning of the results array
        results.unshift(newRowData);

        const writeStream = fs.createWriteStream(contact_file_path);

        // Write column names
        const columnNames = Object.keys(results[0]);
        writeStream.write(columnNames.join(',') + '\n');

        // Write each row
        for (const row of results) {
          const rowValues = columnNames.map((column) => row[column]);
          writeStream.write(rowValues.join(',') + '\n');
        }

        writeStream.end();
        console.log('CSV file updated successfully - row added at the start.');

        res.status(200).json({ success: true, message: 'Success', result: {}, error: {} });
      });
  } catch (error) {
    console.log(error);
    res.status(200).json({ success: false, message: 'Failure', result: {}, error: error });
  }
};

export const getPaymentClientSecret = async (req, res, next) => {
  try {
    const newAmount = req.body.amount * 1000
    const paymentIntent = await stripe.paymentIntents.create({
      amount: newAmount, // Set the desired amount for the subscription
      currency: 'usd', // Set the desired currency
      payment_method_types: ['card'],
    });

    res.status(200).json({ success: true, message: "Success", result: { clientSecret: paymentIntent.client_secret }, error: {} });
  } catch (error) {
    console.log(error)
    res.status(200).json({ success: false, message: "Failure", result: {}, error: error })
  }
}

export const subscribeToPlatform = async (req, res, next) => {
  try {
    // Parse the expiry month and year from the "MM/YY" format
    const [expMonth, expYear] = req.body.expiry.split('/').map((item) => parseInt(item.trim(), 10));
    if (isNaN(expMonth) || expMonth < 1 || expMonth > 12) {
      throw new Error('Invalid expiry month');
    }

    // Create a payment method with the collected card details
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: req.body.cardNumber,
        exp_month: expMonth,
        exp_year: expYear,
        cvc: req.body.cvv,
      },
    });

    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: req.body.customerId,
    });

    await stripe.customers.update(req.body.customerId, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    // Create a new subscription using the customer and payment method
    const subscription = await stripe.subscriptions.create({
      customer: req.body.customerId,
      items: [{ price: req.body.priceId }],
      default_payment_method: paymentMethod.id
    });
    let newSubscription
    const checkSubscription = await Subscriptions.findOne({ user: req.body.userId })
    if (checkSubscription) {
      newSubscription = await Subscriptions.findOneAndUpdate({ user: req.body.userId }, { $set: { subscription: subscription } })
    } else {
      newSubscription = new Subscriptions({
        subscription: subscription,
        user: req.body.userId
      })
    }


    await newSubscription.save()
    await User.findByIdAndUpdate(req.body.userId, { $set: { isSubscribed: true } }, { new: true })

    // */5 * * * * (5 minutes)
    // 0 0 1 * * (1 month)
    // Schedule the cron job to unsubscribe the user after a month
    // const unsubscribeJob = cron.schedule('0 0 1 * *', async () => {
    //   try {
    //     // Retrieve the subscription ID from the saved subscription document
    //     const subscriptionId = newSubscription.subscription.id;

    //     // Cancel the subscription
    //     await stripe.subscriptions.del(subscriptionId);

    //     // Update the user's subscription status in the database
    //     await User.findByIdAndUpdate(req.body.userId, { $set: { isSubscribed: false } }, { new: true });

    //     console.log('User unsubscribed successfully!');
    //   } catch (error) {
    //     console.error('Error unsubscribing user:', error);
    //   }
    // });

    res.status(200).json({ success: true, message: "Success", result: subscription, error: {} });
  } catch (error) {
    console.log(error)
    res.status(200).json({ success: false, message: "Failure", result: {}, error: error })
  }
}

export const getTwilioAvailablePhoneNumbers = async (req, res, next) => {
  try {
    // twilioClient.acc

    const numbers = await twilioClient.api.account.availablePhoneNumbers('US').local.list({ status: 'available' });

    res.status(200).json({ success: true, message: "Success", result: numbers, error: {} });
  } catch (error) {
    console.log(error)
    res.status(200).json({ success: false, message: "Failure", result: {}, error: error })
  }
}

export const getTwilioAvailablePhoneNumbersByFilter = async (req, res, next) => {
  try {
    const countryCode = 'US';

    // Define the filters you want to apply
    const filters = {
      status: 'available',
      areaCode: req.body.areaCode,
      contains: req.body.contains
      // Add more filters here if needed
    };

    // Fetch available phone numbers with the specified filters
    const numbers = await twilioClient.api.account
      .availablePhoneNumbers(countryCode)
      .local.list(filters);



    res.status(200).json({
      success: true,
      message: 'Success',
      result: numbers,
      error: {},
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      success: false,
      message: 'Failure',
      result: {},
      error: error,
    });
  }
};
// Function to add a phone number to a messaging service
async function addPhoneNumberToMessagingService(req, phoneNumberSid, subTwilioClient) {
  try {
    const policies = await subTwilioClient.trusthub.v1.policies('RNdfbf3fae0e1107f8aded0e7cead80bf5').fetch()
    const customer_profile = await subTwilioClient.trusthub.v1.customerProfiles
      .create({
        statusCallback: policies.url,
        friendlyName: 'acme-inc',
        email: 'acme-inc@acme.com',
        policySid: policies.sid
      })



    const twimlWebhookUrl = `${req.protocol}://${req.hostname}/reply/twiml`
    const messagingService = await subTwilioClient.messaging.services.create({
      friendlyName: 'Reply SMS',
      inboundRequestUrl: twimlWebhookUrl, // Specify a name for your Messaging Service
    });
    const messagingServiceSid = messagingService.sid; // Store the Messaging Service SID for future use
    const number = await subTwilioClient.messaging
      .services(messagingServiceSid)
      .phoneNumbers.create({
        phoneNumberSid: phoneNumberSid,
        complianceData: {
          campaignName: 'Your Campaign Name', // Replace with your campaign name
          bundleId: 'Your Bundle ID', // Replace with your bundle ID
          preferredRoute: '1', // Replace with the preferred route number
          autoWarmUp: true,
        },
      });

    console.log('Phone number added to messaging service:', number.sid);
  } catch (error) {
    console.error('Error adding phone number to messaging service:', error);
  }
}



export const buyTwilioPhoneNumber = async (req, res, next) => {
  // console.log(req.body)
  try {
    // Parse the expiry month and year from the "MM/YY" format
    const [expMonth, expYear] = req.body.expiry.split('/').map((item) => parseInt(item.trim(), 10));
    if (isNaN(expMonth) || expMonth < 1 || expMonth > 12) {
      throw new Error('Invalid expiry month');
    }
    try {

      // Create a payment method with the collected card details
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: req.body.cardNumber,
          exp_month: expMonth,
          exp_year: expYear,
          cvc: req.body.cvv,
        },
      });

      // Attach the payment method to the customer
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: req.body.customerId,
      });

      await stripe.customers.update(req.body.customerId, {
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      });

      // Create a new subscription using the customer and payment method
      const subscription = await stripe.subscriptions.create({
        customer: req.body.customerId,
        items: [{ price: req.body.priceId }],
        default_payment_method: paymentMethod.id
      });

      if (subscription) {
        // Payment successful

        try {
          // Fetch the subaccount details using the Twilio API
          const subaccount = await twilioClient.api.accounts(req.body.subAccount).fetch();

          // Create a new Twilio client using the subaccount credentials
          const subTwilioClient = twilio(subaccount.sid, subaccount.authToken);
          const purchasedNumber = await subTwilioClient.incomingPhoneNumbers.create({ phoneNumber: req.body.phoneNumber });


          const boughtPhoneNumber = new BoughtPhoneNumbers({
            phoneNumber: req.body.phoneNumber,
            user: req.body.userId
          })
          boughtPhoneNumber.save()
          await User.findByIdAndUpdate(req.body.userId, { $set: { twilio_phone_number: req.body.phoneNumber, twilio_phone_subscribed: true } }, { new: true })
          addPhoneNumberToMessagingService(req, purchasedNumber.sid, subTwilioClient)
          enableSmsCapabilities(req, purchasedNumber.sid, subTwilioClient)
          let newSubscription
          const checkSubscription = await PhoneSubscription.findOne({ user: req.body.userId })
          if (checkSubscription) {
            newSubscription = await PhoneSubscription.findOneAndUpdate({ user: req.body.userId }, { $set: { subscription: subscription } })
          } else {
            newSubscription = new PhoneSubscription({
              subscription: subscription,
              user: req.body.userId
            })
            newSubscription.save()
          }
          res.status(200).json({ success: true, message: "Success", result: purchasedNumber, error: {} });
        } catch (error) {
          console.log(error)
          const failureReport = new PhoneNumberBuyingFailureReport({
            title: "Number Purchase Error",
            errorInfo: `Error buying Phone Number ${req.body.phoneNumber} (Payment Successfully received for buying the phone number)`,
            phoneNumber: req.body.phoneNumber,
            user: req.body.userId
          })
          await failureReport.save()
          res.status(200).json({ success: false, message: "Error buying phone number", result: {}, error: error })
        }
      } else {
        // Payment failed
        res.status(200).json({ success: false, message: "Payment Failed", result: {}, error: {} })
      }

    } catch (error) {
      console.log(error)
      res.status(200).json({ success: false, message: "Failure", result: {}, error: error })
    }



  } catch (error) {
    console.log(error)
    res.status(200).json({ success: false, message: "Failure", result: {}, error: error })
  }
}
// Function to enable SMS capabilities for a phone number
const enableSmsCapabilities = async (req, phoneNumber, subTwilioClient) => {
  try {


    // Fetch the incoming phone number and update SMS capabilities with dynamic TwiML URL
    const incomingPhoneNumber = await subTwilioClient.incomingPhoneNumbers(phoneNumber).fetch();
    const twimlWebhookUrl = `https://${req.hostname}/reply/twiml`
    const updatedPhoneNumber = await incomingPhoneNumber.update({
      smsUrl: twimlWebhookUrl,
    });

    console.log(`SMS capabilities enabled for phone number ${phoneNumber}`);
    // console.log('TwiML Bin URL:', twiMLBinUrl);
    console.log('Updated phone number details:', updatedPhoneNumber);

  } catch (error) {
    console.error('Error enabling SMS capabilities:', error);
  }
};
// Function to create a TwiML Bin
const createTwiMLBin = async (subTwilioClient, twiml) => {
  try {

    const twiMLBin = await subTwilioClient.twiml.v1.bins.create({ code: twiml });
    return twiMLBin.sid;
  } catch (error) {
    console.error('Error creating TwiML Bin:', error);
    return null;
  }
};
export const sendSms = async (req, res, next) => {
  try {
    const { userTwilioPhone, contactFile, smsMessage } = req.body;

    const results = [];
    let successfulSmsCount = 0;
    // Get the user's available_sms value
    const user = await User.findById(req.body.userId);
    let availableSmsCount = user.available_sms;
    const dataPromises = [];

    // Fetch the subaccount details for the user
    const subaccount = await twilioClient.api.accounts(user.twilio_sub_account).fetch();

    const subTwilioClient = twilio(subaccount.sid, subaccount.authToken);

    // const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    console.log(availableSmsCount)
    fs.createReadStream(contactFile)
      .pipe(csvParser())
      .on('data', async (data) => {
        const phoneNumber = data.phone_number;

        // await delay(1000);
        const promise = subTwilioClient.messages
          .create({
            body: smsMessage,
            from: userTwilioPhone,
            to: phoneNumber
          })
          .then((smsResult) => {
            results.push({ phoneNumber, smsResult });
            successfulSmsCount++;
            availableSmsCount--;
            // console.log(smsResult.status)
            // if (smsResult.status === 'delivered') {

            // }
          })
          .catch((error) => {
            console.error(`Error sending SMS to ${phoneNumber}:`, error);
            results.push({ phoneNumber, error });
          });

        dataPromises.push(promise);
      })
      .on('end', async () => {
        await Promise.all(dataPromises);
        try {
          // Update available_sms for the user
          console.log(availableSmsCount)
          console.log(successfulSmsCount)
          const usernew = await User.findByIdAndUpdate(req.body.userId, { $set: { available_sms: availableSmsCount } }, { new: true })
          console.log(usernew)
          res.json({ success: true, message: 'SMS sent successfully', result: results, error: {} });
        } catch (error) {
          res.status(200).json({ success: false, message: 'Error updating available_sms', result: {}, error });
        }

      });
  } catch (error) {
    console.error(error);
    res.status(200).json({ success: false, message: 'Failed to send SMS', result: {}, error });
  }
};

export const buySmsBundle = async (req, res, next) => {
  try {
    // Parse the expiry month and year from the "MM/YY" format
    const [expMonth, expYear] = req.body.expiry.split('/').map((item) => parseInt(item.trim(), 10));
    if (isNaN(expMonth) || expMonth < 1 || expMonth > 12) {
      throw new Error('Invalid expiry month');
    }

    // Create a payment intent to charge the customer
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: req.body.cardNumber,
        exp_month: expMonth,
        exp_year: expYear,
        cvc: req.body.cvv,
      },
    });

    // Create a payment intent to charge the customer
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: 'usd',
      payment_method: paymentMethod.id,
      confirmation_method: 'manual',
      confirm: true,
    });

    if (paymentIntent.status === 'succeeded') {
      // Payment successful
      const newSmsAvailable = req.body.smsAddition + req.body.currentSmsAmount
      await User.findByIdAndUpdate(req.body.userId, { $set: { available_sms: newSmsAvailable } }, { new: true })
      res.status(200).json({ success: true, message: "SMS bucket added", result: {}, error: {} })
    } else {
      // Payment failed
      res.status(200).json({ success: false, message: "Payment Failed", result: {}, error: {} })
    }
  } catch (error) {
    res.status(200).json({ success: false, message: error.message, result: {}, error: {} })
  }

}

export const getFailureMessages = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userid)
    let failureMessageLogs
    // Fetch the subaccount details for the user
    const subaccount = await twilioClient.api.accounts(user.twilio_sub_account).fetch();

    const subTwilioClient = twilio(subaccount.sid, subaccount.authToken);
    await subTwilioClient.messages.list({ from: user.twilio_phone_number })
      .then((messages) => {
        // Store the message logs in an array

        failureMessageLogs = messages.filter((message) => message.status === 'undelivered').map((message) => ({
          sid: message.sid,
          from: message.from,
          to: message.to,
          body: message.body,
          dateSent: message.dateSent,
        }));

      })
      .catch((err) => {
        console.error('Error fetching message logs:', err);
      });
    const result = { failureMessageLogs }
    res.status(200).json({ success: true, message: "Success", result: result, error: {} })

  } catch (error) {
    res.status(200).json({ success: false, message: error.message, result: {}, error: error })

  }
}

export const getSuccessMessages = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userid)
    let successMessageLogs
    // Fetch the subaccount details for the user
    const subaccount = await twilioClient.api.accounts(user.twilio_sub_account).fetch();

    const subTwilioClient = twilio(subaccount.sid, subaccount.authToken);
    await subTwilioClient.messages.list({ from: user.twilio_phone_number })
      .then((messages) => {
        // Store the message logs in an array

        successMessageLogs = messages.filter((message) => message.status === 'delivered').map((message) => ({
          sid: message.sid,
          from: message.from,
          to: message.to,
          body: message.body,
          dateSent: message.dateSent,
        }));

      })
      .catch((err) => {
        console.error('Error fetching message logs:', err);
      });
    const result = { successMessageLogs }
    res.status(200).json({ success: true, message: "Success", result: result, error: {} })
  } catch (error) {
    res.status(200).json({ success: false, message: error.message, result: {}, error: error })
  }
}

export const getInboundMessages = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userid)
    let successMessageLogs
    // Fetch the subaccount details for the user
    const subaccount = await twilioClient.api.accounts(user.twilio_sub_account).fetch();

    const subTwilioClient = twilio(subaccount.sid, subaccount.authToken);
    await subTwilioClient.messages.list({ to: user.twilio_phone_number })
      .then((messages) => {
        // Store the message logs in an array

        successMessageLogs = messages.filter((message) => message.direction === 'inbound').map((message) => ({
          sid: message.sid,
          from: message.from,
          to: message.to,
          body: message.body,
          dateSent: message.dateSent,
          status: message.status
        }));

      })
      .catch((err) => {
        console.error('Error fetching message logs:', err);
      });
    const result = { successMessageLogs }
    res.status(200).json({ success: true, message: "Success", result: result, error: {} })
  } catch (error) {
    res.status(200).json({ success: false, message: error.message, result: {}, error: error })
  }
}

export const getReportsLogs = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userid)
    let successMessageLogs
    // Fetch the subaccount details for the user
    const subaccount = await twilioClient.api.accounts(user.twilio_sub_account).fetch();

    const subTwilioClient = twilio(subaccount.sid, subaccount.authToken);
    await subTwilioClient.messages.list({ from: user.twilio_phone_number })
      .then((messages) => {
        // Store the message logs in an array

        successMessageLogs = messages.map((message) => ({
          sid: message.sid,
          from: message.from,
          to: message.to,
          body: message.body,
          dateSent: message.dateSent,
          status: message.status
        }));

      })
      .catch((err) => {
        console.error('Error fetching message logs:', err);
      });
    const result = { successMessageLogs }
    res.status(200).json({ success: true, message: "Success", result: result, error: {} })
  } catch (error) {
    res.status(200).json({ success: false, message: error.message, result: {}, error: error })
  }
}

export const getUserSubscriptionDetail = async (req, res, next) => {
  try {
    const subscription = await Subscriptions.findOne({ user: req.params.userid })

    res.status(200).json({ success: true, message: "Success", result: subscription, error: {} })
  } catch (error) {
    res.status(200).json({ success: false, message: error.message, result: {}, error: error })
  }
}

export const getUserPhoneSubscriptionDetail = async (req, res, next) => {
  try {
    const subscription = await PhoneSubscription.findOne({ user: req.params.userid })

    res.status(200).json({ success: true, message: "Success", result: subscription, error: {} })
  } catch (error) {
    res.status(200).json({ success: false, message: error.message, result: {}, error: error })
  }
}

export const sendSingleSms = async (req, res, next) => {
  try {
    const { userTwilioPhone, toPhone, smsMessage, userId } = req.body;

    // Get the user's available_sms value
    const user = await User.findById(userId);
    let availableSmsCount = user.available_sms;
    // Fetch the subaccount details for the user
    const subaccount = await twilioClient.api.accounts(user.twilio_sub_account).fetch();

    const subTwilioClient = twilio(subaccount.sid, subaccount.authToken);

    // Check if the user has available SMS credits
    if (availableSmsCount <= 0) {
      return res.status(200).json({ success: false, message: 'No available SMS credits', result: {}, error: {} });
    }

    // Send the SMS using Twilio
    const smsResult = await subTwilioClient.messages.create({
      body: smsMessage,
      from: userTwilioPhone,
      to: toPhone
    });

    // Update available_sms count for the user
    availableSmsCount--;
    await User.findByIdAndUpdate(userId, { $set: { available_sms: availableSmsCount } }, { new: true });

    // Prepare the response
    const result = { phoneNumber: toPhone, smsResult };
    res.json({ success: true, message: 'SMS sent successfully', result, error: {} });
  } catch (error) {
    console.error(error);
    res.status(200).json({ success: false, message: 'Failed to send SMS', result: {}, error });
  }
};

// API endpoint to cancel the subscription
export const cancelSubscriptionToPlatform = async (req, res, next) => {
  try {
    const userId = req.body.userId;
    // Find the user's subscription in the database
    const userSubscription = await Subscriptions.findOne({ user: userId });
    if (!userSubscription) {
      res.status(200).json({ success: false, message: 'Failed to cancel subscription', result: {}, error: {} });
    }

    // Retrieve the subscription ID from the saved subscription document
    const subscriptionId = userSubscription.subscription.id;

    // Cancel the subscription in Stripe
    await stripe.subscriptions.del(subscriptionId);

    // Update the user's subscription status in the database
    await User.findByIdAndUpdate(userId, { $set: { isSubscribed: false } }, { new: true });

    console.log('User unsubscribed successfully!');

    res.status(200).json({ success: true, message: 'Subscription canceled successfully', result: {}, error: {} });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(200).json({ success: false, message: 'Failed to cancel subscription', result: {}, error: error.message });
  }
};

// API endpoint to cancel the subscription of phone number
export const cancelPhoneSubscriptionToPlatform = async (req, res, next) => {
  try {
    const userId = req.body.userId;
    // Find the user's subscription in the database
    const userSubscription = await PhoneSubscription.findOne({ user: userId });
    if (!userSubscription) {
      res.status(200).json({ success: false, message: 'Failed to cancel subscription', result: {}, error: {} });
    }

    // Retrieve the subscription ID from the saved subscription document
    const subscriptionId = userSubscription.subscription.id;

    // Cancel the subscription in Stripe
    await stripe.subscriptions.del(subscriptionId);

    // Update the user's subscription status in the database
    await User.findByIdAndUpdate(userId, { $set: { twilio_phone_subscribed: false } }, { new: true });

    console.log('User unsubscribed successfully!');

    res.status(200).json({ success: true, message: 'Subscription canceled successfully', result: {}, error: {} });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(200).json({ success: false, message: 'Failed to cancel subscription', result: {}, error: error.message });
  }
};


export const resubscribePhoneNumber = async (req, res, next) => {
  // console.log(req.body)
  try {
    // Parse the expiry month and year from the "MM/YY" format
    const [expMonth, expYear] = req.body.expiry.split('/').map((item) => parseInt(item.trim(), 10));
    if (isNaN(expMonth) || expMonth < 1 || expMonth > 12) {
      throw new Error('Invalid expiry month');
    }
    try {

      // Create a payment method with the collected card details
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: req.body.cardNumber,
          exp_month: expMonth,
          exp_year: expYear,
          cvc: req.body.cvv,
        },
      });

      // Attach the payment method to the customer
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: req.body.customerId,
      });

      await stripe.customers.update(req.body.customerId, {
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      });

      // Create a new subscription using the customer and payment method
      const subscription = await stripe.subscriptions.create({
        customer: req.body.customerId,
        items: [{ price: req.body.priceId }],
        default_payment_method: paymentMethod.id
      });

      if (subscription) {
        // Payment successful
        await PhoneSubscription.findOneAndUpdate({ user: req.body.userId }, { $set: { subscription: subscription } })
        await User.findByIdAndUpdate(req.body.userId, { $set: { twilio_phone_subscribed: true } }, { new: true })

        res.status(200).json({ success: true, message: "Success", result: subscription, error: {} });

      } else {
        // Payment failed
        res.status(200).json({ success: false, message: "Payment Failed", result: {}, error: {} })
      }

    } catch (error) {
      console.log(error)
      res.status(200).json({ success: false, message: "Failure", result: {}, error: error })
    }



  } catch (error) {
    console.log(error)
    res.status(200).json({ success: false, message: "Failure", result: {}, error: error })
  }
}

export const registerBusiness = async (req, res, next) => {
  const { userId, company_name, company_email,business_name,website_url,business_type,business_registration_identifier,business_identity,business_industry,business_registration_number,business_regions_operations,customer_name,street,city,region,iso_country,postal_code } = req.body;
  try {
      // Get the user's available_sms value
  const user = await User.findById(userId);
  let availableSmsCount = user.available_sms;
  // Fetch the subaccount details for the user
  const subaccount = await twilioClient.api.accounts(user.twilio_sub_account).fetch();

  const subTwilioClient = twilio(subaccount.sid, subaccount.authToken);
  const policy = await subTwilioClient.trusthub.v1.policies('RNdfbf3fae0e1107f8aded0e7cead80bf5')
    .fetch()
  const customerProfile = await subTwilioClient.trusthub.v1.customerProfiles.create({
    statusCallback: policy.url,
    friendlyName: company_name,
    email: company_email,
    policySid: policy.sid
  }).catch(err =>{
    console.log("customer profile error")
    console.log(err)
  })
  
  const endUser = await subTwilioClient.trusthub.v1.endUsers
    .create({
      attributes: {
        business_name: business_name,
        social_media_profile_urls: '@acme_biz',
        website_url: website_url,
        business_regions_of_operation: business_regions_operations,
        business_type: business_type,
        business_registration_identifier: business_registration_identifier,
        business_identity: business_identity,
        business_industry: business_industry,
        business_registration_number: business_registration_number
      },
      friendlyName: company_name,
      type: 'customer_profile_business_information'
    }).catch(err =>{
      console.log("end user error")
      console.log(err)
    })
  const clientAddress = await subTwilioClient.addresses
    .create({
      customerName: customer_name,
      street: street,
      city: city,
      region: region,
      postalCode: postal_code,
      isoCountry: iso_country
    }).catch(err =>{
      console.log("client address error")
      console.log(err)
    })
    const supportingDocument=await subTwilioClient.trusthub.v1.supportingDocuments
    .create({
      attributes: {
        address_sids: clientAddress.sid
      }, friendlyName: company_name, type: 'customer_profile_address'
    })
    .then(supporting_document => console.log(supporting_document.sid));
    const customerProfilesEntityAssignments = await subTwilioClient.trusthub.v1.customerProfiles(customerProfile.sid)
  .customerProfilesEntityAssignments
  .create({objectSid: endUser.sid})
  .then(customer_profiles_entity_assignments => console.log(customer_profiles_entity_assignments.sid));
  const customerProfilesEvaluations = await subTwilioClient.trusthub.v1.customerProfiles(customerProfile.sid)
  .customerProfilesEvaluations
  .create({policySid: 'RNdfbf3fae0e1107f8aded0e7cead80bf5'})
  .then(customer_profiles_evaluations => console.log(customer_profiles_evaluations.sid));
  res.status(200).json({ success: true, message: "Success", result: {}, error: {} });

  } catch (error) {
    console.log(error)
    res.status(200).json({ success: false, message: "Failure", result: {}, error: error })
  }

}




