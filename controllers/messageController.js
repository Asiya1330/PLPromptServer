const ObjectId = require("mongoose/lib/types/objectid");
const chat = require("../models/chat");
const Messages = require("../models/messageModel");

module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;

    const messages = await Messages.find({
      users: {
        $all: [from, to],
      },
    }).sort({ updatedAt: 1 });

    const projectedMessages = messages.map((msg) => {
      return {
        fromSelf: msg.sender.toString() === from,
        message: msg.message.text,
      };
    });
    res.json(projectedMessages);
  } catch (ex) {
    next(ex);
  }
};

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message } = req.body;
    const data = await Messages.create({
      message: { text: message },
      users: [from, to],
      sender: from,
    });

    if (data) return res.json({ msg: "Message added successfully." });
    else return res.json({ msg: "Failed to add message to the database" });
  } catch (ex) {
    next(ex);
  }
};

module.exports.addChat = async (req, res, next) => {
  try {
    const { chatId, userId } = req.body;
    if (!chatId || !userId) return res.json({ msg: "Required params are missing" });

    const result = await chat.find({
      chatId,
      userId
    })

    if (!result.length) {
      await chat.create({
        chatId,
        userId
      });
    }

    const contacts = await chat.aggregate([
      { $match: { "userId": ObjectId(userId) } },
      {
        $lookup: {
          from: "users",
          localField: "chatId",
          foreignField: "_id",
          as: "chat_users"
        }
      },
      {
        $project: {
          _id: 1,
          chat_users: {
            username: 1,
            email: 1,
            avatarImage: 1,
            _id: 1
          }
        }
      }
    ])
    return res.json(contacts);
  } catch (ex) {
    next(ex);
  }
};


module.exports.getChat = async (req, res, next) => {
  try {
    const { userId } = req['query'];
    if (!userId) return res.json({ msg: "Required params are missing" });
    const result = await chat.aggregate([
      { $match: { "userId": ObjectId(userId) } },
      {
        $lookup: {
          from: "users",
          localField: "chatId",
          foreignField: "_id",
          as: "chat_users"
        }
      },
      {
        $project: {
          _id: 1,
          chat_users: {
            _id: 1,
            username: 1,
            avatarImage: 1,
            email: 1
          }
        }
      }
    ])

    res.json(result);

  } catch (ex) {
    next(ex);
  }
};