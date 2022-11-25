const mongoose = require("mongoose");
const chatmodel = new mongoose.Schema(
  {
    members: [{type:mongoose.Schema.Types.ObjectId, ref:"users"}]
  },
  { timestamps: true }
);
module.exports = mongoose.model("chat", chatmodel);
