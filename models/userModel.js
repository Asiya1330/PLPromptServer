const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    min: 3,
    max: 20,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    max: 50,
  },
  password: {
    type: String,
    min: 8,
  },
  isAvatarImageSet: {
    type: Boolean,
    default: false,
  },
  avatarImage: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    default: 'standard',
    enum: ['admin', 'standard'],
  },
  descrition: {
    type: String
  },
  badges: {
    type: Array
  },
  status: {
    type: String,
    enum: ['verified', 'pending'],
    default: 'pending',
    required: true
  }
},
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Users", userSchema);
