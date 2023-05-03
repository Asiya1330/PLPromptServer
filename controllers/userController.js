const { Types } = require("mongoose");
const User = require("../models/userModel");
const Followers = require('../models/followers');
const bcrypt = require("bcrypt");
const ObjectId = require("mongoose/lib/types/objectid");
const userModel = require("../models/userModel");
const { sendverificationemail } = require("../nodemailer/emailTemplates/verifyemailTemplate");
const promptModel = require("../models/promptModel");
const purchaseModel = require("../models/purchaseModel");
const viewModel = require("../models/viewModel");
const LikesModel = require("../models/LikesModel");
const messageModel = require("../models/messageModel");
const chat = require("../models/chat");

module.exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ msg: "Incorrect Email or Password", status: false });
    if (!user.status || user?.status === 'pending') return res.json({ msg: "User is not verified", status: false });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.json({ msg: "Incorrect Email or Password", status: false });

    delete user.password;

    return res.json({ status: true, user });
  } catch (ex) {
    next(ex);
  }
};

module.exports.register = async (req, res, next) => {
  try {
    const { password, ...otherProps } = req.body;

    const usernameCheck = await User.findOne({ username: otherProps.username });

    if (usernameCheck) return res.json({ msg: "Username already used", status: false });

    const emailCheck = await User.findOne({ email: otherProps.email });
    if (emailCheck) return res.json({ msg: "Email already used", status: false });

    if (otherProps._id && (Types.ObjectId.isValid(otherProps._id + '000'))) {
      otherProps['_id'] = new ObjectId(otherProps._id + '000')
    }
    if (otherProps.avatarImage) {
      otherProps['isAvatarImageSet'] = true
    }

    let params = {
      ...otherProps
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      params['password'] = hashedPassword
    }

    const user = await User.create(
      params
    );
    delete user.password;
    req['params'] = {
      emailToVerify: otherProps.email,
      id: user._id
    }
    await sendverificationemail(req);
    return res.json({ status: true, user });

  } catch (ex) {
    next(ex);
  }
};

module.exports.updateUserCreatedAt = async (req, res, next) => {
  try {
    const users = await User.updateMany(
      { createdAt: { $exists: false } }, // Find documents without a createdAt field
      { $set: { createdAt: new Date() } } // Set createdAt to the current date
    )
    return res.json(users);
  } catch (ex) {
    next(ex);
  }
};

module.exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.params.id } }).select([
      "email",
      "username",
      "avatarImage",
      "_id",
    ]);
    return res.json(users);
  } catch (ex) {
    next(ex);
  }
};

module.exports.setAvatar = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const avatarImage = req.body.image;
    const userData = await User.findByIdAndUpdate(
      userId,
      {
        isAvatarImageSet: true,
        avatarImage,
      },
      { new: true }
    );
    return res.json({
      isSet: userData.isAvatarImageSet,
      image: userData.avatarImage,
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.logOut = (req, res, next) => {
  try {
    if (!req.params.id) return res.json({ msg: "User id is required " });
    onlineUsers.delete(req.params.id);
    return res.status(200).send();
  } catch (ex) {
    next(ex);
  }
};


module.exports.findOneUserById = async (req, res, next) => {
  try {
    const user = await User.findById({ _id: req.params._id }).select([
      "email",
      "username",
      "avatarImage",
      "_id",
      "status"
    ]);
    return res.json(user);
  } catch (ex) {
    next(ex);
  }
};



module.exports.getFollowersandFollowingCount = async (req, res, next) => {
  try {
    const { profileOwnerId } = req['query'];
    if (!profileOwnerId) return res.json({ msg: "required parameters are missings", status: false });

    const getfollowersAndFolowingCount = await userModel.aggregate([
      { $match: { "_id": ObjectId(profileOwnerId) } },
      {
        $lookup: {
          from: "followers",
          localField: "_id",
          foreignField: "userId",
          as: "followers"
        }
      },
      {
        $lookup: {
          from: "followers",
          localField: "_id",
          foreignField: "followerId",
          as: "following"
        }
      },
      {
        $project: {
          _id: 1,
          username: 1,
          followers: { $size: "$followers" },
          following: { $size: "$following" }
        }
      }
    ])

    return res.json(getfollowersAndFolowingCount);
  }
  catch (err) {
    next(err);
  }
}


module.exports.addFollower = async (req, res, next) => {
  try {
    const { userId, followerId } = req['body'];
    if (!userId || !followerId) return res.json({ msg: "required parameters are missings", status: false });
    const findFollower = await Followers.find({
      userId,
      followerId
    })
    if (!findFollower.length) {
      const addfollower = await Followers.create({
        userId,
        followerId
      });

      return res.json(addfollower);
    }
    res.json({ msg: "already follwing" });
  }
  catch (err) {
    next(err);
  }
}

module.exports.getLikesViewsPurchasesAndRank = async (req, res, next) => {
  try {
    const { ownername } = req['query'];
    if (!ownername) return res.json({ msg: "required parameters are missings", status: false });
    const result = await userModel.aggregate([
      { $match: { username: ownername } },
      {
        $lookup: {
          from: "prompts",
          localField: "_id",
          foreignField: "userId",
          as: "prompts"
        }
      },
      {
        $lookup: {
          from: "followers",
          localField: "_id",
          foreignField: "userId",
          as: "followers"
        }
      },
      {
        $lookup: {
          from: "followers",
          localField: "_id",
          foreignField: "followerId",
          as: "following"
        }
      },
      // Calculate the total number of likes, views, and purchases
      {
        $project: {
          _id: 1,
          username: 1,
          email: 1,
          avatarImage: 1,
          role: 1,
          badges: 1,
          createdAt: 1,
          updatedAt: 1,
          followers: { $size: "$followers" },
          following: { $size: "$following" },
          descrition: 1,
          totalLikes: {
            $sum: "$prompts.likes"
          },
          totalViews: {
            $sum: "$prompts.views"
          },
          totalPurchases: {
            $sum: "$prompts.purchaseCount"
          },
          promptBaseRank: { $multiply: [{ $sum: "$prompts.purchaseCount" }, 5] },
        }
      }
    ])

    return res.json(result);
  }
  catch (err) {
    next(err);
  }
}

module.exports.updateUserStatus = async (req, res, next) => {
  try {
    const { _id } = req['body'];
    const result = await User.updateOne({ _id }, {
      status: 'verified'
    })

    return res.json(result);
  }
  catch (err) {
    next(err)
  }
}

module.exports.deleteAllRecords = async (req, res, next) => {
  try {
    const result1 = await promptModel.deleteMany({})
    const result2 = await purchaseModel.deleteMany({})
    const result3 = await viewModel.deleteMany({})
    const result4 = await LikesModel.deleteMany({})
    const result5 = await messageModel.deleteMany({})
    const result6 = await Followers.deleteMany({})
    const result7 = await chat.deleteMany({})


    return res.json({ msg: 'deleted succesfully', record: { result1, result2, result3, result4, result5, result6, result7 } });
  }
  catch (err) {
    next(err)
  }
}


module.exports.UpdateUser = async (req, res, next) => {
  try {
    console.log(req.body);
    const { _id, ...otherParams } = req['body']
    console.log(_id, otherParams, 'lol');

    if (!_id) return res.send({ msg: "id is required" })
    const response = await userModel.findOneAndUpdate({ _id }, otherParams)

    res.send(response);
  }
  catch (err) {
    next(err)
  }
}