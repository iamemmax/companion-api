const mongoose = require("mongoose")
const chatSchema = new mongoose.Schema({
    activeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    recieverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    senderStatus: {
        type: Number,
        default: 1
    },
    receiverStatus: {
        type: Number,
        default: 1
    },
    lastestMessage: {

    },
    messageStatus: {
        type: Number,
        default: 0
    },
    messages: {
        type: String,
    },

    file: {
        filename: {
            type: String
        }

    },

    createdAt: {
        type: Date,
        default: Date.now()
    }
})
module.exports = mongoose.model("chats", chatSchema)