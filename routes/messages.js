const { addMessage, getMessages, addChat, getChat } = require("../controllers/messageController");
const router = require("express").Router();

router.post("/addmsg/", addMessage);
router.post("/getmsg/", getMessages);

router.post("/addchat/", addChat);
router.get("/getchat/", getChat);


module.exports = router;
