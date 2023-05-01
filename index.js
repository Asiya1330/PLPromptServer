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
const { addStatusColumnInPrompts, calculateRankings, addPurchaseRecordtoPetio } = require('./cronJobs/weekly-monthly-daily')

const app = express();
const socket = require("socket.io");
require("dotenv").config();

app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 5000;

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

app.get('/', (req, res) => {
  res.json('hello workd!')
})

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/prompt", promptRoute)
app.use("/api/user", userRoute)

const s3 = new AWS.S3({
  accessKeyId: process.env.aws_access_key_id,
  secretAccessKey: process.env.aws_secret_access_key,
  region: process.env.aws_region
});

const org = process.env.org;
const env = process.env.env;
const bucketName = process.env.bucket_name;


app.post("/api/uploadfile", upload.single('file'), async (req, res) => {
  const { userId } = req.body;
  if (req.file == null) {
    return res.status(400).json({ 'message': 'Please choose the file' })
  }
  if (!userId) return res.json({ msg: 'user is not logged in' });

  var file = req.file;
  const fileKey = `${org}-${env}-${userId}/${Date.now()}-${file.originalname}`

  const fileStream = fs.createReadStream(file.path);

  const params = {
    Bucket: bucketName,
    Key: fileKey,
    Body: fileStream,
  };

  const data = await s3.upload(params).promise();
  return res.json(data)
})

// cron.schedule('*/40 * * * * *', async () => {
//   console.log("running a task every 40 sec");
//   addPurchaseRecordtoPetio();
// });
// cron.schedule('*/40 * * * * *', async () => {
cron.schedule('0 0 * * *', async () => {

  await calculateRankings('weekly')
  await calculateRankings('monthly')
  // addStatusColumnInPrompt();
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
