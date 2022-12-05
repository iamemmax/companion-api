const asyncHandler = require("express-async-handler");
const {
  createUserSchema,
  verifySchema,
  loginSchema,
  resetPasswordSchema,
  forgetPasswordSchema,
} = require("../../validation/user/createUser.schema");
const bcrypt = require("bcryptjs");
const userSchema = require("../../model/user/user.schema");
const sendEmail = require("../../helper/sendEmail");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const {
  updateUserSchema,
  changePasswordSchema,
} = require("../../validation/user/update.validate");
const compressImg = require("../../helper/compression");
const cloudinary = require("../../config/cloudinery");
const getAge = require("../../helper/dateCalculator");
const fs = require("fs");
const mongoose = require("mongoose");
const PeerId = require("peer-id");

// @Desc:create user
// @Method:Post
// @Routes:http://localhost:3000/api/users/register
exports.createUser = asyncHandler(async (req, res) => {
  const { value, error } = createUserSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(404).json({
      res: "fail",
      msg: error.details.map((error) => error.message).join(","),
    });
  }

  try {
    let {
      firstname,
      lastname,
      username,
      email,
      phone,
      country,
      state,
      city,
      date_of_birth,
      password,
      gender,
    } = value;
    //checked if username already used
    const usernameExist = await userSchema.findOne({ username });
    if (usernameExist) {
      return res.status(404).json({
        res: "fail",
        msg: `${username} is already used`,
      });
    }

    //checked if email already used404
    const emailExist = await userSchema.findOne({ email });
    console.log(emailExist);
    if (emailExist) {
      return res.status(404).json({
        res: "fail",
        msg: `${email} is already used`,
      });
    }
    //checked if phone number  already used
    const phoneExist = await userSchema.findOne({ phone });
    if (phoneExist) {
      return res.status(404).json({
        res: "fail",
        msg: `${phone} is already  used`,
      });
    }
    const peerid = await PeerId.create({ bits: 1024, keyType: "RSA" });
    const salt = 10;
    bcrypt.genSalt(salt, function (err, salt) {
      bcrypt.hash(password, salt, async (err, hash) => {
        crypto.randomBytes(3, async (err, buffer) => {
          let token = buffer.toString("hex");
          if (err) console.log(err);

          const newuser = new userSchema({
            firstname,
            lastname,
            username,
            email,
            phone,
            gender,
            date_of_birth,
            age: getAge(date_of_birth),
            peerId: peerid,
            country,
            state,
            city,

            password: hash,
            token,
          });
          const saveUser = await newuser.save();
          if (!saveUser) {
            return res.status(404).json({
              res: "fail",
              msg: "somethingwent wrong",
            });
          } else {
            const { _id } = saveUser;
            const data = await userSchema
              .findOne({ _id })
              .select("-password -__v -token");
            const userToken = jwt.sign(
              { id: data._id },
              process.env.JWT_SECRETE,
              {
                expiresIn: "12hr",
              }
            );
            sendEmail(
              email,
              "Welcome to Essential dating",
              `
                                            <!doctype html>
                                        <html lang="en">
                                        <head><title>Essential</title></head>                          
                              <body>
                              <div><h2>Dear ${username}</h2>
                              <p>Your verification code is ${token}</p>
                              </div>
                              </body>
                              </html>

                              `
            );
            return res.status(201).json({
              res: "ok",
              msg: `user created successfully`,
              activationMsg:
                "please check the activation code sent to your email",
              data: { saveUser, userToken },
            });
          }
        });
      });
    });
  } catch (error) {
    return res.status(400).json({
      res: "fail",
      msg: error.message,
    });
  }
});

// @Desc:verify user
// @Method:put
// @Routes:http://localhost:3000/api/users/verify

exports.verifyUser = asyncHandler(async (req, res) => {
  const { error, value } = verifySchema.validate(req.body);
  if (error) {
    return res.status(404).json({
      res: "fail",
      msg: error.details.map((error) => error.message).join(","),
    });
  }

  try {
    //check if email is already registered
    const userFound = await userSchema.findById(req.params.id);
    if (!userFound) {
      return res.status(400).json({
        res: "fail",
        msg: "Invalid email",
      });
    } else {
      if (userFound.token === value.token) {
        // upadate user verify status to true
        const user = await userSchema
          .findByIdAndUpdate(
            { _id: req.params.id },
            { $set: { verified: true, token: "" } },
            { new: true, upsert: true }
          )
          .select("-password -token -__v");
        if (user) {
          return res.status(201).json({
            res: "ok",
            msg: "user veried successfully",
            data: { user, userToken: user.userToken },
          });
        } else {
          return res.status(400).json({
            res: "fail",
            msg: "unable to verified user",
          });
        }
      }
    }
  } catch (error) {
    if (error)
      return res.status(500).json({
        res: "fail",
        msg: error.message,
      });
  }
});

// @Desc:login user
// @Method:post
// @Routes:http://localhost:3000/api/users/login

exports.loginUser = asyncHandler(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);

  if (error) {
    return res.status(404).json({
      res: "fail",
      msg: error.details.map((error) => error.message).join(","),
    });
  }
  try {
    //checked if user is verified
    let { email, password } = value;
    //check if email is a registered email and verified === true
    const user = await userSchema
      .findOne({
        $and: [
          {
            email,
            verified: true,
          },
        ],
      })
      .populate("following followers followers.followers", "-password -__v -token")
    //  .populate( {
    //     path:"following.followers following.following followers.followers  followers.following",
    //     select:"-password -__v -token"
    //   });

    if (!user) {
      return res.status(404).json({
        res: "fail",
        msg: "invalid or unverified account",
      });
    }
    //compare users password
    bcrypt.compare(password, user.password, async (err, isMatch) => {
      if (err) {
        console.log(err);
        return res.status(404).json({
          res: "fail",
          msg: "incorrect email or password",
        });
      }

      if (isMatch) {
        const userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRETE, {
          expiresIn: "12hr",
        });
        return res.status(201).json({
          res: "ok",
          msg: `welcome back ${user.username}`,
          data: {
            user,
            userToken,
          },
        });
      } else {
        return res.status(401).json({
          res: "failed",
          msg: "incorrect email or password",
        });
      }
    });
  } catch (error) {
    if (error)
      return res.status(500).json({
        res: "fai`                                                                                                                                                                                                                                                                                                   l",
        msg: error.message,
      });
  }
});

// @Desc:logout user
// @Method:get
// @Routes:http://localhost:3000/api/users/logout
exports.logoutUser = (req, res) => {
  req.logout(function (err) {
    if (err) console.log(err);

    req.session.destroy(() => {
      res.clearCookie("connect.sid", {
        path: "/",
        httpOnly: true,
      });
      res.status(201).json({
        res: "ok",
        msg: "You've successfully logged out",
      });
    });
  });
};
// @Desc:get user details
// @Method:get
// @Routes:http://localhost:3000/api/users/me
exports.getMe = asyncHandler(async (req, res) => {
  try {
    const user = await userSchema
      .findOne({ _id: req.user._id })
      .select("-__v -password -token");
    if (user) {
      return res.status(200).json({
        res: "ok",
        user,
      });
    } else {
      return res.status(401).json({
        res: "fail",
        msg: "user not found",
      });
    }
  } catch (error) {
    if (error)
      return res.status(400).json({
        res: "fail",
        msg: error.message,
      });
  }
});
// @Routes:http://localhost:3000/api/users/me
exports.getUserById = asyncHandler(async (req, res) => {
  try {
    const user = await userSchema
      .findById(req.params.id)
      .populate("followers following")
      .select("-__v -password -token");
    if (user) {
      return res.status(200).json({
        res: "ok",
        user,
      });
    } else {
      return res.status(401).json({
        res: "fail",
        msg: "user not found",
      });
    }
  } catch (error) {
    if (error)
      return res.status(400).json({
        res: "fail",
        msg: error.message,
      });
  }
});

// @Desc:forget password
// @Method:get
// @Routes:http://localhost:3000/api/users/forget-password
exports.forgetPassword = asyncHandler(async (req, res) => {
  // const { error, value } = forgetPasswordSchema.validate(req.body);
  // console.log(error);
  // if (error)
  //   return res.status(404).json({
  //     res: "fail",
  //     msg: error.details[0].message,
  //   });
  try {
    let { email } = req.query;

    const findUserByEmail = await userSchema.findOne({ email });

    if (findUserByEmail) {
      crypto.randomBytes(3, async (err, buffer) => {
        let token = buffer.toString("hex");

        sendEmail(
          email,
          "forget password",
          `
                                            <!doctype html>
                                        <html lang="en">
                                        <head><title>Essential</title></head>                          
                              <body>
                              <div><h2>Dear ${findUserByEmail.username}</h2>
                              <button> please click the button below to <a href=http://localhost:3000/auth/reset/${findUserByEmail._id}> reset password </a></button>
                              </div>

                              </body>
                              </html>

                              `
        );
        return res.status(201).json({
          res: "ok",
          msg: `please login to your email to reset your password`,
        });
      });
    }
  } catch (error) {
    if (error)
      return res.status(400).json({
        res: "fail",
        msg: error.message,
      });
  }
});

// @Desc:reset password
// @Method:put
// @Routes:http://localhost:3000/api/users/reset-password/id
exports.resetPassword = asyncHandler(async (req, res) => {
  //validate user input before submitting to database
  const { error, value } = resetPasswordSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error)
    return res.status(404).json({
      res: "fail",
      msg: error.details.map((error) => error.message).join(","),
    });
  try {
    //check if the url contained the correct user_id
    if (!req.params.id)
      return res.status(400).json({
        res: "fail",
        msg: "user not found!",
      });
    let { password } = value;

    // encrypt or hash user password before updating user password
    const salt = 10;
    bcrypt.genSalt(salt, function (err, salt) {
      bcrypt.hash(password, salt, async (err, hash) => {
        const updatePassword = await userSchema.findByIdAndUpdate(
          { _id: req.params.id },
          { $set: { password: hash } },
          { new: true, upsert: true }
        );
        if (!updatePassword) {
          return res.status(400).json({
            res: "fail",
            msg: "unable to update password",
          });
        } else {
          return res.status(201).json({
            res: "ok",
            msg: "password updated successfully",
          });
        }
      });
    });
  } catch (error) {
    if (error)
      return res.status(400).json({
        res: "fail",
        msg: error.message,
      });
  }
});

// @Desc:update user profile
// @Method:put
// @Routes:http://localhost:3000/api/user/update-profile

exports.updateProfile = asyncHandler(async (req, res) => {
  const { error, value } = updateUserSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error)
    return res.status(404).json({
      res: "fail",
      msg: error.details.map((error) => error.message).join(","),
    });

  const user = await userSchema.findById(req.params.id);
  let {
    firstname,
    lastname,
    phone,
    city,
    country,
    state,
    date_of_birth,
    gender,
  } = value;

  const update = await userSchema.findByIdAndUpdate(
    { _id: user.id },
    {
      firstname: firstname || user.firstname,
      lastname: lastname || user.lastname,
      phone: phone || user.phone,
      country: country || user.country,
      state: state || user.state,
      city: city || user.city,
      date_of_birth: date_of_birth || user.date_of_birth,
      gender: gender || user.gender,
    },
    { new: true }
  );

  try {
    if (update) {
      return res.status(200).json({
        res: "ok",
        msg: "profile updated succesfully",
        data: update,
      });
    } else {
      return res.status(500).json({
        res: "fail",
        msg: "unable to update profile",
      });
    }
  } catch (error) {
    return res.status(500).json({
      res: "fail",
      msg: error.message,
    });
  }
});

//
// return res.status(200).json({
//   res: "ok",
//   msg: "profile updated succesfully",
//   data: update,
// });

// @Desc:update user profile pics
// @Method:put
// @Routes:http://localhost:3000/api/user/update/profile-img

exports.uploadProfile = asyncHandler(async (req, res) => {
  // if (!req.file) {
  //   res.status(401).json({
  //     res: "fail",
  //     msg: "Please select a file",
  //   });
  // }

  let user = req.user;
  const users = await userSchema.findOne({ _id: user._id });
  //  if(users.pic.length > 0){
  //  }
  try {
    compressImg(req.file.path, 100, 100);

    let uploadImg = await cloudinary.uploader.upload(req.file.path, {
      eager: [{ width: 100, height: 100 }],
    });
    console.log(uploadImg);
    fs.unlinkSync(req.file.path);
    if (uploadImg) {
      let profileImg = {
        img_id: uploadImg.public_id,
        img: uploadImg.eager[0].secure_url,
        filesize: uploadImg.bytes,
      };
      let updateProfile = await userSchema
        .findOneAndUpdate(
          { _id: user._id },
          {
            $set: {
              avater: {
                img_id: profileImg?.img_id,
                filename: profileImg.img,
                filesize: profileImg.filesize,
              },
            },
          },
          { new: true, upsert: true }
        )
        .select("-_id, -__v");

      if (updateProfile) {
        await cloudinary.uploader.destroy(users?.avater?.img_id);
        res.status(201).json({
          res: "ok",
          message: "Profile img updated successfully",
          data: updateProfile,
        });
      } else {
        fs.unlinkSync(req.file.path);

        res.status(401).json({
          res: "fail",
          msg: "Unable to update profile",
        });
      }
    } else {
      fs.unlinkSync(req.file.path);
    }
  } catch (error) {
    res.status(401);
    throw new Error(error.message);
  }
});

// @Desc:update list all users
// @Method:get
// @Routes:http://localhost:3000/api/user/update-profile

exports.listUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.pageNumber) || 1;
  const pageSize = 20; // total number of entries on a single page

  const keyword = req.query.search
    ? {
        $or: [
          { firstname: { $regex: req.query.search, $options: "i" } },
          { lastname: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
          { username: { $regex: req.query.search, $options: "i" } },
          { gender: { $regex: req.query.search, $options: "i" } },
          { country: { $regex: req.query.search, $options: "i" } },
          { state: { $regex: req.query.search, $options: "i" } },
          { city: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  try {
    let users = await userSchema
      .find(keyword)
      .find({ _id: { $ne: req.user._id } })
      .select("-password -token -__v")
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort("-createdAt");

    return res.status(201).json({
      res: "ok",
      total: users.length,
      pages: Math.ceil(users.length / pageSize),
      data: users,
    });
  } catch (error) {
    if (error) {
      return res.status(400).json({
        res: "fail",
        msg: error.message,
      });
    }
  }
});

// @Desc:update list all users
// @Method:get
// @Routes:http://localhost:3000/api/user/update-profile
exports.ChangePassword = asyncHandler(async (req, res) => {
  const { error, value } = changePasswordSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(404).json({
      res: "fail",
      msg: error.details.map((error) => error.message).join(","),
    });
  }
  try {
    const user = req.user;
    const users = await userSchema
      .findOne({ _id: user._id })
      .select("password _id");
    const { password, oldpassword } = value;
    bcrypt.compare(oldpassword, users.password, (err, isMatch) => {
      if (err) {
        return res.status(404).json({
          res: "fail",
          msg: "old password not matched",
        });
      }
      if (isMatch) {
        bcrypt.genSalt(10, function (err, salt) {
          bcrypt.hash(password, salt, async (err, hash) => {
            let update = await userSchema.findOneAndUpdate(
              { _id: users._id },
              { $set: { password: hash || users.password } },
              { new: true, upsert: true }
            );
            if (!update) {
              return res.status(404).json({
                res: "fail",
                msg: "unable to changed password",
              });
            } else {
              res.status(201).json({
                res: "ok",
                message: "Password changed successfully",
              });
            }
          });
        });
      } else {
        return res.status(404).json({
          res: "fail",
          msg: "old password not matched",
        });
      }
    });
  } catch (error) {
    res.status(401);
    throw new Error(error.message);
  }
});

//  @Desc:follow user
// @Method:put
// @Routes:http://localhost:3000/api/user/follow/follow_user_id

exports.followUser = asyncHandler(async (req, res) => {
  const { id, currentUserId } = req.params;

  if (currentUserId === id) {
    res.status(403).json("Action forbidden");
  } else {
    try {
      const followUser = await userSchema.findById(id);
      const followingUser = await userSchema.findById(currentUserId);

      if (!followUser.followers.includes(currentUserId)) {
        //  await followUser.updateOne({ $push: { followers: new mongoose.Types.ObjectId(currentUserId) } })
        //   await followingUser.updateOne({ $push: { following: new mongoose.Types.ObjectId(id) } })

        const isFollow = await userSchema
          .findOneAndUpdate(
            { _id: id },
            {
              $push: { followers: new mongoose.Types.ObjectId(currentUserId) },
            },
            { new: true, upsert: true }
          )
          .populate("following followers", "-password -__v -token");
        await userSchema
          .findOneAndUpdate(
            { _id: currentUserId },
            { $push: { following: new mongoose.Types.ObjectId(id) } },
            { new: true, upsert: true }
          )
          .populate("following followers", "-password -__v -token");

        res.status(200).json({
          res: "ok",
          msg: "user follow",
          isFollow,
        });
      } else {
        res.status(403).json("user is Already followed by you");
      }
    } catch (error) {
      return res.status(500).json({
        res: "fail",
        msg: error.message,
      });
    }
  }
});

// @Desc:unfollow user
// @Method:put
// @Routes:http://localhost:3000/api/user/follow/follow_user_id

exports.unfollowUser = asyncHandler(async (req, res) => {
  // const { id, userId } = req.params;

  const { id, currentUserId } = req.params;

  if (currentUserId === id) {
    res.status(403).json("Action forbidden");
  } else {
    try {
      const followUser = await userSchema.findById(id);
      const followingUser = await userSchema.findById(currentUserId);

      if (followUser.followers.includes(currentUserId)) {
        const isUnFollow = await userSchema
          .findOneAndUpdate(
            { _id: id },
            {
              $pull: { followers: new mongoose.Types.ObjectId(currentUserId) },
            },
            { new: true, upsert: true }
          )
          .populate("following followers", "-password -__v -token");
        await userSchema
          .findOneAndUpdate(
            { _id: currentUserId },
            { $pull: { following: new mongoose.Types.ObjectId(id) } },
            { new: true, upsert: true }
          )
          .populate("following followers", "-password -__v -token");
        res.status(200).json({
          res: "ok",
          msg: "user unfollows",
          isUnFollow,
        });
      } else {
        res.status(403).json("user is not followed by you");
      }
    } catch (error) {
      return res.status(500).json({
        res: "fail",
        msg: error.message,
      });
    }
  }
});

// @Desc: list all user following you
// @Method:get
// @Routes:http://localhost:3000/api/user/following
exports.myFollowers = asyncHandler(async (req, res) => {
  const page = Number(req.query.pageNumber) || 1;
  const pageSize = 20; // total number of entries on a single page

  const { following } = await userSchema
    .findOne({ _id: req.user._id })
    .select("-password -token -__v")
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort("-createdAt");

  return res.status(201).json({
    res: "ok",
    total: following.length,
    pages: Math.ceil(following.length / pageSize),
    data: following,
  });
});
// @Desc: list all user following you
// @Method:get
// @Routes:http://localhost:3000/api/user/following
exports.myFollow = asyncHandler(async (req, res) => {
  const page = Number(req.query.pageNumber) || 1;
  const pageSize = 20; // total number of entries on a single page

  const { follow } = await userSchema
    .findOne({ _id: req.user._id })
    .select("-password -token -__v")
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort("-createdAt");
  if (follow) {
    return res.status(201).json({
      res: "ok",
      total: follow.length,
      pages: Math.ceil(follow.length / pageSize),
      data: follow,
    });
  }
});

// @Desc: list all user following you
// @Method:get
// @Routes:http://localhost:3000/api/user/following
exports.findLove = asyncHandler(async (req, res) => {
  let { gender, from, to, country, state, city } = req.query;
  const page = Number(req.query.pageNumber) || 1;
  const pageSize = 20; // total number of entries on a single page
  console.log(typeof from);
  try {
    const filterOptions = await userSchema
      .find({
        $and: [
          {
            age: { $gte: from, $lte: to },
            country,
            state,
            city,
            gender,
          },
        ],
      })

      .select("-__v -token  -password")
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort("-createdAt");

    // count total posts

    // response
    return res.status(201).json({
      res: "ok",
      total: filterOptions.length,
      pages: Math.ceil(filterOptions.length / pageSize),
      data: filterOptions,
    });
  } catch (error) {
    res.status(401);
    throw new Error(error.message);
  }
});
