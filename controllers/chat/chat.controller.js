const asyncHandler = require("express-async-handler");
const fs = require("fs");
const mongoose = require("mongoose");
const cloudinary = require("../../config/cloudinery");
const compressImg = require("../../helper/compression");
const chatModel = require("../../model/chat/chatModel");
const chatSchema = require("../../model/chat/chatSchema");
const messageSchema = require("../../model/chat/messageSchema");
const userSchema = require("../../model/user/user.schema");
const {
  validateChatSchema,
} = require("../../validation/chat/chatSchema.validate");


// @Desc:delete chat for everyone by
// @Method:delete
// @Routes:http://localhost:3000/api/chat/delete/senderId

exports.deleteChat = asyncHandler(async (req, res) => {
  try {
    let { id } = req.params;
    console.log(id);
    if (!id)
      return res.status(400).json({
        res: "fail",
        msg: "chat not found",
      });

    const deleteChat = await userSchema.findByIdAndDelete({ _id: id });
    if (deleteChat) {
      return res.status(201).json({
        res: "ok",
        msg: "chat deleted successfully",
      });
    } else {
      return res.status(400).json({
        res: "fail",
        msg: "unable to delete chat",
      });
    }
  } catch (error) {
    return res.status(400).json({
      res: "fail",
      msg: error.message,
    });
  }
});

exports.findChatById = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  try {
    const myChat = await chatModel.findOne({ _id: chatId }).populate("members");
    return res.status(201).json({
      res: "ok",
      data: myChat,
    });
  } catch (error) {
    return res.status(500).json({
      res: "fail",
      msg: error.message,
    });
  }
});

// @Desc:create chat between two people
// @Method:post
// @Routes:http://localhost:3000/api/chat/delete/senderId
exports.createNewChat = asyncHandler(async (req, res) => {
  try {
    const { senderId, recieverId } = req.body;

    const chatExist = await chatModel.findOne({
      members: [
        new mongoose.Types.ObjectId(senderId),
        new mongoose.Types.ObjectId(recieverId),
      ],
    });
    if (chatExist) {
      return res.status(201).json({
        data: chatExist,
      });
    } else {
      const newchat = await new chatModel({
        members: [
          new mongoose.Types.ObjectId(senderId),
          new mongoose.Types.ObjectId(recieverId),
        ],
      });

      const saveChat = await newchat.save();
      if (saveChat) {
        return res.status(201).json({
          data: saveChat,
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      res: "fail",
      msg: error.message,
    });
  }
});

// @Desc:get all user chat
// @Method:get
// @Routes:http://localhost:3000/api/chat/:userId

exports.getAllUserChats = asyncHandler(async (req, res) => {
  try {
    const userChat = await chatModel
      .find({
        members: { $in: [new mongoose.Types.ObjectId(req.params.userId)] },
      })
      .populate("members");

    return res.status(201).json({
      userChat,
    });
  } catch (error) {
    return res.status(500).json({
      res: "fail",
      msg: error.message,
    });
  }
});

// @Desc:get all one on one chat
// @Method:get
// @Routes:http://localhost:5000/api/chat/:firstId/:secondId

exports.getAllChat = asyncHandler(async (req, res) => {
  try {
    const { firstId, secondId } = req.params;
    const chats = await chatModel
      .findOne({
        members: { $all: [firstId, secondId] },
      })
      .populate("members");
    return res.status(201).json({
      res: "ok",
      msg: "message sent",
      data: chats,
    });
  } catch (error) {
    return res.status(500).json({
      res: "fail",
      msg: error.message,
    });
  }
});

// @Desc:send one on one message
// @Method:Post
// @Routes:http://localhost:5000/api/chat/message

exports.sendMessage = asyncHandler(async (req, res) => {
  const { chatId, senderId, text, receiverId, file } = req.body;

  try {
    const message = new messageSchema({
      chatId,
      senderId,
      receiverId,
      text,
    });
    const saveMessage = await message.save();
    if (saveMessage) {
      return res.status(201).json({
        res: "ok",
        msg: "message sent",
        chat: saveMessage,
      });
    }
  } catch (error) {
    return res.status(500).json({
      res: "fail",
      msg: error.message,
    });
  }
});

exports.sendImg = asyncHandler(async (req, res) => {
  //compressImg(req.file.path, 150, 150);
  const { chatId, senderId, receiverId } = req.body;
  //  compressImg(req?.file?.path, 100, 100);

  try {
    let uploadImg = await cloudinary.uploader.upload(req?.file?.path, {
      eager: [{ width: 150, height: 150 }],
    });
    console.log(uploadImg);
    fs.unlinkSync(req.file.path);

    let senderImg = {
      img_id: uploadImg.public_id,
      img: uploadImg.eager[0].secure_url,
      filesize: uploadImg.bytes,
    };

    const message = await new messageSchema({
      chatId,
      senderId,
      receiverId,
      file: senderImg,
    }).save();
    if (message) {
      return res.status(201).json({
        res: "ok",
        msg: "message sent",
        chat: message,
      });
    }
  } catch (err) {
    return res.status(500).json({
      res: "fail",
      msg: err.message,
    });
  }
});
exports.sendVoiceRecord = asyncHandler(async (req, res) => {
  //compressImg(req.file.path, 150, 150);
  const { chatId, senderId, receiverId, audio } = req.body;
console.log("123")
  try {
   
    const audiorecord = await new messageSchema({
      chatId,
      senderId,
      receiverId,
      audio,
    }).save();

    if (audiorecord) {
      return res.status(201).json({
        res: "ok",
        msg: "audio record sent",
        chat: audiorecord,
      });
    }

  } catch (err) {
    return res.status(500).json({
      res: "fail",
      msg: err.message,
    });
  }
});

// @Desc:send one on one message
// @Method:get
// @Routes:http://localhost:5000/api/chat/message/chatId

exports.getMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  try {
    const getMsg = await messageSchema
      .find({chatId: [new mongoose.Types.ObjectId(chatId)] })
      .populate("senderId", "-password -__v -token");
   
    return res.status(201).json({
      res: "ok",
      chat: getMsg,
    });
  } catch (error) {
    return res.status(500).json({
      res: "fail",
      msg: error.message,
    });
  }
});
