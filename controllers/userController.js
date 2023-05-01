const { Types } = require("mongoose");
const User = require("../models/userModel");
const Followers = require('../models/followers');
const bcrypt = require("bcrypt");
const ObjectId = require("mongoose/lib/types/objectid");
const userModel = require("../models/userModel");
const { NodemailerTransporter } = require("../nodemailer/nodemailer");

module.exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.json({ msg: "Incorrect Email or Password", status: false });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.json({ msg: "Incorrect Email or Password", status: false });
    delete user.password;
    return res.json({ status: true, user });
  } catch (ex) {
    next(ex);
  }
};

module.exports.sendverificationemail = async (req, res, next) => {
  try {
    const { emailToVerify } = req.body;
    if (!emailToVerify) return res.json({ msg: "please provide emailToVerify", status: false });

    const emailCheck = await User.findOne({ email: emailToVerify });
    if (emailCheck) return res.json({ msg: "Email already used", status: false });

    let mailOptions = {
      from: 'gagabooboo987@gmail.com',
      to: emailToVerify,
      subject: 'Verify your email',
      html: `<p>Click the link below to verify your email:</p><p><a href="http://localhost:3000/?token=abc123">Verify email</a></p>`
    };

    const response = await NodemailerTransporter.sendMail(mailOptions);
    if (response.status) return res.json({ msg: "Succesfully sent email" });
    return res.json({ error: response })

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

    const getfollowersAndFolowingCound = await userModel.aggregate([
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


    return res.json(addfollower);
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