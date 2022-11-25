const mongoose = require("mongoose");
const messagemodel = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "chat",
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    text: {
      type: String,
    },
    audio: {
        type: String,
    },
    file: {},
  },
  { timestamps: true }
);
module.exports = mongoose.model("messages", messagemodel);
