const {
  createUser,
  verifyUser,
  loginUser,
  logoutUser,
  getMe,
  getUserById,
  forgetPassword,
  resetPassword,
  updateProfile,
  uploadProfile,
  listUsers,
  ChangePassword,
  followUser,
  unfollowUser,
  myFollowers,
  myFollow,
  findLove,
} = require("../../controllers/user/user.controller");
const { ensureLogin } = require("../../helper/ensureLogin");
const upload = require("../../helper/upload");

const router = require("express").Router();

router.get("/", ensureLogin, listUsers);
router.get("/followers", ensureLogin, myFollowers);
router.get("/me", ensureLogin, getMe);
router.get("/forget-password", forgetPassword);
router.get("/find-love",  findLove);
router.post("/register", createUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
router.get("/:id", getUserById);
router.put("/verify/:id", verifyUser);
router.put("/reset-password/:id", resetPassword);
router.put("/update-profile/:id", updateProfile);
router.put(
  "/update/profile-img/:id",
  
  upload.single("avater"),
  uploadProfile
);
router.put("/change-password/:id", ensureLogin, ChangePassword);
router.put("/follow/:id/:currentUserId", ensureLogin, followUser);
router.put("/unfollow/:id/:currentUserId", ensureLogin, unfollowUser)
router.get("/follows", ensureLogin, myFollow);

module.exports = router;
