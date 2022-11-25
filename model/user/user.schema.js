const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
    trim: true,
  },
  lastname: {
    type: String,
    required: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  gender: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  date_of_birth: {
    type: String,
    required: true,
    trim: true,
  },
  age: {
    type: Number,
    required: true,
    trim: true,
  },

  country: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },

  password: {
    type: String,
    required: true,
    trim: true,
  },
  token: {
    type: String,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  peerId: {
    type: String,
  },
  avater: {
    img_id: { type: String, default: "essential" },
    filename: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/128/149/149071.png",
    },
    filesize: {
      type: String,
      default: "1023",
    },
  },

  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("users", userSchema);
