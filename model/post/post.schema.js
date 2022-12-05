const mongoose = require("mongoose");
const slugify = require("slugify");


const commentSchema = new mongoose.Schema({
    commentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "posts"
    },
    comment: {
        type: String,
        required: true,
    }
}, { timestamps: true })




const replySchema = new mongoose.Schema({
    replyBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    commentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "posts"
    },
    reply: {
        type: String,
        required: true,
    }
}, { timestamps: true })


const likeSchema = new mongoose.Schema({
    likeBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },


}, { timestamps: true })


const disLikeSchema = new mongoose.Schema({
    dislikeBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },


}, { timestamps: true })



const postSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },

    // slug: {
    //     type: String,
    //     require: true

    // },
    description: {
        type: String,
        required: true,
    },
    img: [],
    video:{},


    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },

    comments: [commentSchema],
    replies: [replySchema],


    likes: [likeSchema],
    disLikes: [disLikeSchema],
    visibility: {
        type: String,
        default: "public",
    },






}, { timestamps: true })

// postSchema.pre("validate", function (next) {
//     this.slug = slugify(this.title, {
//         lower: true,
//         // strict:true
//     })

//     next()
// })
module.exports = mongoose.model("posts", postSchema)