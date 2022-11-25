const { addComment, deleteComment, addCommentReply, deleteReply, listAllComment, listAllRely, likePost } = require("../../../controllers/post/post.contoller")
const { ensureLogin } = require("../../../helper/ensureLogin")

const router = require("express").Router()

router.get("/:id", ensureLogin, listAllComment)
router.get("/:id/:commentId", ensureLogin, listAllRely)
router.put("/add-comment/:id", ensureLogin, addComment)
router.put("/add-reply/:id", ensureLogin, addCommentReply)
router.delete("/remove-comment/:id/:commentId", ensureLogin, deleteComment)
router.delete("/remove-reply/:id/:replyId", ensureLogin, deleteReply)
router.post("/like/:id", ensureLogin, likePost)
module.exports = router