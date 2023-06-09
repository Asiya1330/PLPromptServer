require('dotenv').config()
const fs = require('fs');
const AWS = require('aws-sdk');
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const promptRoute = require('./routes/prompts');
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const cron = require('node-cron')
const userRoute = require("./routes/user");
require("./cronJobs/scehduleCronJobs");
const stripeRoute = require("./routes/stripeRoute");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const { calculateRankings, makeStripeIdAndcustomeridTonull, addStatusColumnInPrompts, addPurchaseRecordtoPetio } = require('./cronJobs/weekly-monthly-daily')
const path = require('path');

const app = express();
const socket = require("socket.io");
const { RedirectCallback } = require('./controllers/stripe');
const bodyParser = require('body-parser');
const promptModel = require('./models/promptModel');
const userModel = require('./models/userModel');
const purchaseModel = require('./models/purchaseModel');
const { sendEmailToSeller } = require('./nodemailer/emailTemplates/sendPurchaseEmailToSeller');
require("dotenv").config();


const PORT = process.env.PORT || 50000;
const org = process.env.org;
const env = process.env.env;
const bucketName = process.env.bucket_name;

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connetion Successfull");
  })
  .catch((err) => {
    console.log(err.message);
  });

// app.get('/oauth/callback', RedirectCallback);

const s3 = new AWS.S3({
  accessKeyId: process.env.aws_access_key_id,
  secretAccessKey: process.env.aws_secret_access_key,
  region: process.env.aws_region
});

const fulfillOrder = async (lineItems, customerEmail) => {
  try {
    const PromptDetails = await promptModel.findOneAndUpdate({ name: lineItems.data[0].description }, {
      $inc: { purchaseCount: 1 }
    });
    const customerDetails = await userModel.findOne({ email: customerEmail })
    const InsertPayment = await purchaseModel.create({ promptId: PromptDetails._id, buyerId: customerDetails._id });
    await sendEmailToSeller(customerDetails, PromptDetails);
    console.log('InsertPrompt', InsertPayment);
    console.log("Fulfilling order", lineItems.data[0].description, customerEmail);
  }
  catch (err) {
    console.log('ErrorOcuured:', err);
  }
}

app.post('/webhook', bodyParser.raw({ type: "application/json" }), async (request, response) => {
  const sig = request.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(request.body, sig, process.env.WEBHOOK_SECRET_KEY);

    let customerEmail;
    let sellerStripeId
    let lineItems
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        sellerStripeId = paymentIntent.transfer_data.destination;
        console.log(sellerStripeId);
        break;
      case 'checkout.session.completed':
        const checkoutSession = event.data.object;
        customerEmail = checkoutSession.customer_details.email;
        const sessionsWithLineItems = await stripe.checkout.sessions.retrieve(
          event.data.object.id,
          {
            expand: ['line_items'],
          }
        );
        lineItems = sessionsWithLineItems.line_items;
        await fulfillOrder(lineItems, customerEmail);
        console.log(lineItems);
      default:
        console.log(`${event.type} event occur`);
    }

    response.status(200).end();
  }
  catch (err) {
    console.log(err);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }
});


app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
  res.json('hello workd!')
})

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/prompt", promptRoute)
app.use("/api/user", userRoute);
app.use("/api/payment", stripeRoute)

app.post("/api/uploadfile", upload.single('file'), async (req, res) => {
  const { userId } = req.body;
  if (req.file == null) {
    return res.status(400).json({ 'message': 'Please choose the file' })
  }
  if (!userId) return res.json({ msg: 'user is not logged in' });

  var file = req.file;
  const fileKey = `${org}-${env}-${userId}/${Date.now()}-${file.originalname}`

  const fileStream = fs.createReadStream(file.path);
  const fileExtension = path.extname(req.file.originalname);
  const supportedExt = 'png,jpg,jpeg';
  const contentType = fileExtension === 'jpg' || fileExtension === 'jpeg' ? 'image/jpeg' : 'image/png';
  console.log(contentType);
  const params = {
    Bucket: bucketName,
    Key: fileKey,
    Body: fileStream,
    ContentType: contentType
  };

  const data = await s3.upload(params).promise();
  return res.json(data)
})

// var task = cron.schedule('*/5 * * * * *', () => {
//   console.log('task started');
//   lol();
// });

// function lol() {
//   const a ='123';
//   setTimeout(() => {
//     console.log('task stopped after 1 sec');
//     task.stop();
//   }, 1000)
// }

// cron.schedule('*/20 * * * * *', async () => {
//   await makeStripeIdAndcustomeridTonull()
// })

cron.schedule('0 0 * * *', async () => {

  await calculateRankings('weekly')
  await calculateRankings('monthly')
  console.log("running a task every 24 hours");
});

const server = app.listen(PORT, () =>
  console.log(`Server started on ${PORT}`)
);

const io = socket(server, {
  cors: {
    origin: process.env.Remote_Base,
    credentials: true,
  },
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
});
