const asyncHandler = require("express-async-handler");
const cloudinary = require("../../config/cloudinery");
const compressImg = require("../../helper/compression");
const postSchema = require("../../model/post/post.schema");
const { validatePostSchema } = require("../../validation/post/post.validate");
const mongoose = require("mongoose");
const fs = require("fs");
const crypto = require("crypto");

// @Desc:create post
// @Method:post
// @Routes:http://localhost:3000/api/post/new
exports.createPost = asyncHandler(async (req, res) => {
  const { error, value } = validatePostSchema.validate(req.body, {
    abortEarly: false,
  });
  const fileArray = [];
  if (error) {
    return res.status(404).json({
      res: "fail",
      msg: error.details.map((error) => error.message).join(","),
    });
  }

  try {
    if (value) {
      let { description, visibility, userId, author } = value;
      console.log(value, req.files);
      const files = req.files;
      for (let i = 0; i < files?.length; i++) {
        const element = files[i];
        compressImg(element.path, 350, 350);

        const uploadImg = await cloudinary.uploader.upload(element.path, {
          eager: [{ width: 350, height: 350 }],
          upload_preset: "essential",
          url_suffix: "essental_dating",
        });
        let postImgs = {
          img_id: uploadImg.public_id,
          img: uploadImg.eager[0].secure_url,
        };
        fileArray.push(postImgs);

        
        fs.unlinkSync(element.path);
      
      }
      
     

      const newPost = new postSchema({
        description,
        visibility,
        userId:  new mongoose.Types.ObjectId(userId),
        author:  new mongoose.Types.ObjectId(author),
        img: fileArray,
      });
      const savedPost = await newPost.save();
      if (savedPost) {
        return res.status(200).json({
          res: "ok",
          msg: "post created successfully",
          data: savedPost,
        });
      } else {
        return res.status(404).json({
          res: "fail",
          msg: "unable to create post",
        });
      }
    }
  } catch (error) {
    return res.status(400).json({
      res: "fail",
      msg: error.message,
    });
  }
});

// @Desc:get single post
// @Method:get
// @Routes:http://localhost:3000/api/user/update-profile
exports.getSinglePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(404).json({
      res: "fail",
      msg: "post not found",
    });
  }
  try {
    const getSinglePost = await postSchema
      .findOne({ _id: req.params.id })
      .populate("author userId", "-password -token -__v")
      .populate({
        path: "comments.commentBy comments.postId replies.replyBy replies",

        select: "-__v -_id ",
      });
    if (getSinglePost) {
      return res.status(201).json({
        res: "ok",
        msg: "success",
        data: getSinglePost,
      });
    } else {
      return res.status(404).json({
        res: "fail",
        msg: "post not found",
      });
    }
  } catch (error) {
    return res.status(400).json({
      res: "fail",
      msg: error.message,
    });
  }
});

// @Desc:update list all pots
// @Method:get
// @Routes:http://localhost:3000/api/posts

exports.listAllPost = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [{ description: { $regex: req.query.search, $options: "i" } }],
      }
    : {};
  console.log(keyword);
  const page = Number(req.query.pageNumber) || 1;
  const pageSize = 20; // total number of entries on a single page

  try {
    let posts = await postSchema
      .find(keyword)
      .populate("author userId", "-password -token -__v")
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort("-createdAt");

    return res.status(201).json({
      res: "ok",
      total: posts.length,
      pages: Math.ceil(posts.length / pageSize),
      data: posts,
    });
  } catch (error) {
    if (error) {
      res.status(401);
      throw new Error(error.message);
    }
  }
});

// @Desc:update update post
// @Method:put
// @Routes:http://localhost:3000/api/posts
exports.updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(404).json({
      res: "fail",
      msg: "post not found",
    });
  }

  let { value, error } = validatePostSchema.validate(req.body, {
    abortEarly: false,
  });
  let { description } = value;
  if (error) {
    return res.status(404).json({
      res: "fail",
      msg: error.details.map((error) => error.message).join(","),
    });
  }

  try {
    const post = await postSchema
      .findOne({ _id: id })
      .select("-password -token -__v");
    const updatePost = await postSchema
      .findByIdAndUpdate(
        { _id: id },
        {
          $set: {
            description: description || post.description,
          },
        },
        { new: true, upsert: true }
      )
      .select("-password -token -__v")
      .populate("author userId");
    if (updatePost) {
      return res.status(201).json({
        res: "ok",
        msg: "post updated successfully",
        data: updatePost,
      });
    } else {
      return res.status(404).json({
        res: "fail",
        msg: "unable to update",
      });
    }
  } catch (error) {
    return res.status(400).json({
      res: "fail",
      msg: error.message,
    });
  }
});

// @Desc:delete post
// @Method:delete
// @Routes:http://localhost:3000/api/posts/:id
exports.deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(404).json({
      res: "fail",
      msg: "post not found",
    });
  }
  try {
    const deletePost = await postSchema.findOneAndDelete({ _id: id });

    if (deletePost) {
      deletePost.img.map((img) => {
        console.log(img.img_id);

        cloudinary.uploader.destroy(img?.img_id);
      });
      return res.status(201).json({
        res: "ok",
        msg: "post deleted successfully",
        data: deletePost,
      });
    } else {
      return res.status(404).json({
        res: "fail",
        msg: "post can not be deleted",
      });
    }
  } catch (error) {
    return res.status(500).json({
      res: "fail",
      msg: error.message,
    });
  }
});

// @Desc:update update post
// @Desc:delete put
// @Method:delete
exports.deletePostImg = asyncHandler(async (req, res) => {
  const postImg = await postSchema.findOne({ _id: req.params.id });
  if (postImg) {
    let { img } = postImg;
    console.log(postImg);

    let updatedImg = img.filter((img) => img.img_id != req.body.img_id);
    try {
      if (updatedImg) {
        await cloudinary.uploader.destroy(req.body.img_id);

        const updatedPost = await postSchema.findOneAndUpdate(
          { _id: req.params.id },
          { $set: { img: updatedImg } },
          { new: true, upsert: true }
        );
        return res.status(201).json({
          res: "ok",
          message: "post image removed successfully",
          data: updatedPost,
        });
      } else {
        return res.status(401).json({
          res: "error",
          message: "unable to delete post image ",
        });
      }
    } catch (error) {
      res.status(401);
      throw new Error(error.message);
    }
  }
});

// @Desc:create comment
// @Method:put

exports.addComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let { comment } = req.body;
  try {
    const post = await postSchema.findOne({ _id: id });
    if (post) {
      const saveComment = await postSchema.findOneAndUpdate(
        { _id: id },
        {
          $push: {
            comments: { commentBy: req.user._id, comment: comment, postId: id },
          },
        },
        { new: true, upsert: true }
      ) .populate({
        path: "comments.commentBy comments.postId replies.replyBy replies",

        select: "-__v -paasword -token",
      })
       
      if (saveComment) {
        return res.status(201).json({
          res: "ok",
          msg: "comment added successfully",
          data:saveComment
        });
      } else {
        return res.status(404).json({
          res: "fail",
          msg: "unable to add comment",
        });
      }
    } else {
      return res.status(404).json({
        res: "fail",
        msg: "post not found",
      });
    }
  } catch (error) {
    return res.status(400).json({
      res: "fail",
      msg: error.message,
    });
  }
});

// @Desc:delete comment
// @Method:delete

exports.deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const { comments } = await postSchema.findOne({ _id: id });
    const filterComment = comments?.filter(
      (comment) => comment?._id !== req?.body.commentId
    );
    if (filterComment) {
      const updateReply = await postSchema.findOneAndUpdate(
        { _id: id },
        { $set: { comments: { filterComment } } },
        {
          new: true,
          upsert: true,
        }
      );
      if (updateComment) {
        return res.status(201).json({
          res: "ok",
          message: "comment removed successfully",
        });
      } else {
        return res.status(401).json({
          res: "error",
          message: "unable to delete comment ",
        });
      }
    }
  } catch (error) {
    res.status(401);
    throw new Error(error.message);
  }
});

// @Desc:get all comment
// @Method:get
exports.listAllComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const page = Number(req.query.pageNumber) || 1;
    const pageSize = 20; // total number of entries on a single page
    const { comments } = await postSchema
      .findOne({ _id: id }, { __v: 0 })
      // .populate("commentBy")
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort("-createdAt");

    return res.status(201).json({
      res: "ok",
      total: comments.length,
      pages: Math.ceil(comments.length / pageSize),
      data: comments,
    });
  } catch (error) {
    return res.status(400).json({
      res: "fail",
      msg: error.message,
    });
  }
});

// @Desc:reply comment
// @Method:put

exports.addCommentReply = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let { reply, commentId } = req.body;
  try {
    const post = await postSchema.findOne({ _id: id });
    if (post) {
      const saveReply = await postSchema.findOneAndUpdate(
        { _id: id },
        { $push: { replies: { replyBy: req.user._id, commentId, reply } } },
        { new: true, upsert: true }
      ).populate({
        path: "comments.commentBy comments.postId replies.replyBy replies",

        select: "-__v -_id ",
      });
      if (saveReply) {
        return res.status(201).json({
          res: "ok",
          msg: "reply added successfully",
          data: saveReply,
        });
      } else {
        return res.status(404).json({
          res: "fail",
          msg: "unable to add reply",
        });
      }
    } else {
      return res.status(404).json({
        res: "fail",
        msg: "post not found",
      });
    }
  } catch (error) {
    return res.status(400).json({
      res: "fail",
      msg: error.message,
    });
  }
});

// @Desc:delete comment
// @Method:delete

exports.deleteReply = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const { replies } = await postSchema.findOne({ _id: id });
    const filterReply = replies?.filter(
      (reply) => reply?._id !== req?.body.replyId
    );
    if (filterReply) {
      const updateReply = await postSchema.findOneAndUpdate(
        { _id: id },
        { $set: { replies: { filterReply } } },
        {
          new: true,
          upsert: true,
        }
      );
      if (updateReply) {
        return res.status(201).json({
          res: "ok",
          message: "reply removed successfully",
        });
      } else {
        return res.status(401).json({
          res: "error",
          message: "unable to delete reply ",
        });
      }
    }
  } catch (error) {
    res.status(401);
    throw new Error(error.message);
  }
});

// @Desc:get all comment
// @Method:get
// *****************************************************************************
exports.listAllRely = asyncHandler(async (req, res) => {
  const { id, commentId } = req.params;
  // const { commentId } = req.body

  try {
    const page = Number(req.query.pageNumber) || 1;
    const pageSize = 20; // total number of entries on a single page
    const { replies } = await postSchema
      .findOne({ _id: id })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort("-createdAt");

    // console.log(replies.filter(x => x.commentId.toString() === commentId))
    const allReply = replies.filter((x) => String(x.commentId) === commentId);
    return res.status(201).json({
      res: "ok",
      total: allReply.length,
      pages: Math.ceil(allReply.length / pageSize),
      // message: "reply removed successfully",
      data: allReply,
    });
  } catch (error) {
    return res.status(400).json({
      res: "fail",
      msg: error.message,
    });
  }
});
// @Desc:like post
// @Method:put
exports.likePost = asyncHandler(async (req, res) => {
  let saveLike;
  const { id } = req.params;
  try {
    const { likes } = await postSchema.findOne({ _id: id });

    if (likes.find((x) => x.likeBy.toString() === req.user._id.toString())) {
      saveLike = await postSchema.findOneAndUpdate(
        { _id: id },
        { $pull: { likes: { likeBy: req.user._id } } },
        { new: true, upsert: true }
      );
    } else {
      saveLike = await postSchema.findOneAndUpdate(
        { _id: id },
        { $push: { likes: { likeBy: req.user._id } } },
        { new: true, upsert: true }
      );
    }

    if (saveLike) {
      return res.status(201).json({
        res: "ok",
        data: saveLike,
      });
    } else {
      return res.status(401).json({
        res: "fail",
        msg: "unable to like post",
      });
    }
  } catch (error) {
    return res.status(400).json({
      res: "fail",
      msg: error.message,
    });
  }
});

// @Desc:dislike post
// @Method:put
exports.disLikePost = asyncHandler(async (req, res) => {
  let saveLike;
  const { id } = req.params;
  try {
    const { disLikes, likes } = await postSchema.findOne({ _id: id });

    if (likes.find((x) => x.likeBy.toString() === req.user._id.toString())) {
      saveLike = await postSchema.findOneAndUpdate(
        { _id: id },
        { $pull: { likes: { likeBy: req.user._id } } },
        { new: true, upsert: true }
      );
    }

    if (
      disLikes.find((x) => x.dislikeBy.toString() === req.user._id.toString())
    ) {
      saveLike = await postSchema.findOneAndUpdate(
        { _id: id },
        { $pull: { disLikes: { dislikeBy: req.user._id } } },
        { new: true, upsert: true }
      );
    } else {
      saveLike = await postSchema.findOneAndUpdate(
        { _id: id },
        { $push: { disLikes: { dislikeBy: req.user._id } } },
        { new: true, upsert: true }
      );
    }

    console.log();

    if (saveLike) {
      return res.status(201).json({
        res: "ok",
        data: saveLike,
      });
    } else {
      return res.status(401).json({
        res: "fail",
        msg: "unable to like post",
      });
    }
  } catch (error) {
    return res.status(400).json({
      res: "fail",
      msg: error.message,
    });
  }
});

// @Desc:dislike post
// @Method:put
exports.filterPost = asyncHandler(async (req, res) => {
  let { search, page = 1, limit = 50, order_by } = req.query;
  console.log(search);
  const filterOptions = {
    $or: [
      { description: { $regex: search, $options: "i" } },
      // { userId: { $regex: search, $options: "i" } },
      // { author: { $regex: search, $options: "i" } },
    ],
  };
  try {
    const results = await postSchema
      .find(filterOptions)
      .populate("userId author")
      .collation({ locale: "en", strength: 2 })
      .select("-_id -__v")
      .limit(limit * 1) //limit search result
      .skip((page - 1) * limit) // skip docs
      .sort({ createdAt: order_by === "createdAt" && "asc" }); // sort order
    // count total posts
    const count = await postSchema.countDocuments(results);
    // response
    return res.status(200).json({
      count: results.length,
      page,
      totalPages: Math.ceil(count / limit),
      results: results,
    });
  } catch (error) {
    res.status(401);
    throw new Error(error.message);
  }
});

// @Desc: list all user  post
// @Method:get
// @Routes:http://localhost:3000/api/user/following

exports.listAllUsersPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const pageSize = 20; // total number of entries on a single page
  const page = Number(req.query.pageNumber) || 1;
  try {
    console.log(id);
    const posts = await postSchema
      .find({ author: req.params.id })
      .populate("userId author", "-password -__v -token")
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort("-createdAt");
    console.log(posts);
    // const count = await postSchema.countDocuments(posts);
    return res.status(200).json({
      count: posts.length,
      page,
      totalPages: Math.ceil(posts / pageSize),
      results: posts,
    });
  } catch (error) {
    return res.status(500).json({
      res: "fail",
      msg: error.message,
    });
  }
});

// @Desc:create post with videos
// @Method:post
// @Routes:http://localhost:3000/api/post/video/new
exports.createVideoPost = asyncHandler(async (req, res) => {
  const { path } = req.file;
  console.log("123456", path)
 
         const { error, value } = validatePostSchema.validate(req.body, {
    abortEarly: false,
  });
  const fileArray = [];
       
   
  
  if (error) {
    return res.status(404).json({
      res: "fail",
      msg: error.details.map((error) => error.message).join(","),
    });
  }

  try {
    if (value) {
      let { description, visibility, userId, author } = value;
     
      crypto.randomBytes(5, async (err, buffer) => {
    let token = buffer.toString("hex");
    if (err) console.log(err);
    
   

         const uploadVideo = await cloudinary.uploader.upload(
      req.file.path, {
        resource_type: "video",
         public_id: `essential_video_${token}`,
        chunk_size: 6000000,
        eager: [
          { width: 300, height: 300, crop: "pad", audio_codec: "none" }, 
          { width: 160, height: 100, crop: "crop", gravity: "south", audio_codec: "none" } ],                                   
          eager_async: true,
        }
        
        // public_id: "/public/",
        
        
        ) 
        let postVideo = {
          video_id: uploadVideo.public_id,
          video: uploadVideo.secure_url,
        };
        fileArray.push(postVideo);

        
        fs.unlinkSync(req.file.path);
        
        if (postVideo) {
          
          const newPost = new postSchema({
            description,
            visibility,
            userId:  new mongoose.Types.ObjectId(userId),
            author:  new mongoose.Types.ObjectId(author),
            video: fileArray,
          });
          const savedPost = await newPost.save();
          if (savedPost) {
            return res.status(200).json({
              res: "ok",
              msg: "post created successfully",
              data: savedPost,
            });
          } else {
            return res.status(404).json({
              res: "fail",
              msg: "unable to create post",
            });
          }
        }
       } )

      
      
     console.log("12345")

    }
  } catch (error) {
    return res.status(400).json({
      res: "fail",
      msg: error.message,
    });
  }

  
 
});
