const { addCommentReply } = require("../../../controllers/post/post.contoller")
const { ensureLogin } = require("../../../helper/ensureLogin")

const router = require("express").Router()

router.put("/add-reply/:id", ensureLogin, addCommentReply)
// router.delete("/remove-comment/:id", ensureLogin, deleteComment)
module.exports = router