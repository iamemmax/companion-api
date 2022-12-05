const router = require("express").Router();
const {
  createPost,
  getSinglePost,
  listAllPost,
  filterPost,
  updatePost,
  deletePost,
  deletePostImg,
  likePost,
  disLikePost,
  listAllUsersPost,
  getTimelinePost
} = require("../../controllers/post/post.contoller");
const { ensureLogin } = require("../../helper/ensureLogin");
const upload = require("../../helper/upload");

// router.get("/q?search", ensureLogin, filterPost)
router.get("/", ensureLogin, listAllPost);
router.get("/mypost/:id", ensureLogin, listAllUsersPost);
router.post("/new", upload.array("img", 6), createPost);
router.put("/like/:id", ensureLogin, likePost);
router.put("/dislike/:id", ensureLogin, disLikePost);
router.put("/:id", ensureLogin, updatePost);
router.get("/:id", ensureLogin, getSinglePost);
// router.get("/timeline/:id", ensureLogin, getTimelinePost);
router.delete("/:id", ensureLogin, deletePost);
router.delete("/remove-img/:id", ensureLogin, deletePostImg);

module.exports = router;
