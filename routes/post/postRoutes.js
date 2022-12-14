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
  getTimelinePost,
  createVideoPost
} = require("../../controllers/post/post.contoller");
const { ensureLogin } = require("../../helper/ensureLogin");
const upload = require("../../helper/upload");
const uploadVideo = require("../../helper/videoUpload");

// router.get("/q?search", ensureLogin, filterPost)
router.get("/", ensureLogin, listAllPost);
router.get("/mypost/:id", ensureLogin, listAllUsersPost);
router.post("/new", upload.array("img", 6), createPost);
router.post("/video/new", uploadVideo.single("video"), createVideoPost);
router.put("/like/:id/:userId", ensureLogin, likePost);
router.put("/dislike/:id/:userId", ensureLogin, disLikePost);
router.put("/:id", ensureLogin, updatePost);
router.get("/:id", ensureLogin, getSinglePost);
// router.get("/timeline/:id", ensureLogin, getTimelinePost);
router.delete("/:id", ensureLogin, deletePost);
router.delete("/remove-img/:id", ensureLogin, deletePostImg);

module.exports = router;
