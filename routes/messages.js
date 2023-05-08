const { addMessage, getMessages, addChat, getChat, SendEmailToChat } = require("../controllers/messageController");
const router = require("express").Router();

router.post("/addmsg/", addMessage);
router.post("/getmsg/", getMessages);

router.post("/addchat/", addChat);
router.get("/getchat/", getChat);

router.post("/send-email-to-chat", SendEmailToChat)
module.exports = router;
