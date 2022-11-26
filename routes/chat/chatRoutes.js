const router = require("express").Router();
const {
  // createChat,
  // getSingleChat,
  // deleteChat,
  createNewChat,
  getAllUserChats,
  getAllChat,
  sendMessage,
  getMessage,
  findChatById,
  sendImg,
  sendVoiceRecord
} = require("../../controllers/chat/chat.controller");
const { ensureLogin } = require("../../helper/ensureLogin");
const upload = require("../../helper/upload");

router.post("/",  createNewChat);
router.post("/img", ensureLogin, upload.single("file"), sendImg);
router.post("/audio", ensureLogin, sendVoiceRecord);
router.post("/message", ensureLogin, sendMessage);
router.get("/message/:chatId", ensureLogin, getMessage);
router.get("/:userId", ensureLogin, getAllUserChats);
router.get("/find/:chatId", ensureLogin, findChatById);
router.get("/:firstId/:secondId", ensureLogin, getAllChat);

// router.post("/create-chat", ensureLogin, createChat);
// router.delete("/:id", ensureLogin, deleteChat);

module.exports = router;
