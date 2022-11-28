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
router.post("/img",  upload.single("file"), sendImg);
router.post("/audio",  sendVoiceRecord);
router.post("/message",  sendMessage);
router.get("/message/:chatId", ensureLogin, getMessage);
router.get("/:userId",  getAllUserChats);
router.get("/find/:chatId",  findChatById);
router.get("/:firstId/:secondId",  getAllChat);

// router.post("/create-chat", ensureLogin, createChat);
// router.delete("/:id", ensureLogin, deleteChat);

module.exports = router;
