const express = require("express");
require("dotenv").config();
const path = require("path");
const cors = require("cors");
const logger = require("morgan");
require("@colors/colors");
// importing routes
const userRoutes = require("./routes/user/userRoutes");
const chatRoutes = require("./routes/chat/chatRoutes");
const postRoutes = require("./routes/post/postRoutes");
const commentRoutes = require("./routes/post/comment/commentRoutes");
const replyRoutes = require("./routes/post/reply/replyRoutes");

const { notFound, errorHandler } = require("./config/errorMiddlewares");
const connectDb = require("./config/dbconnect");
const { createServer } = require("http");
const { Server } = require("socket.io");
// const socketio = require("socket.io")
const app = express();

// middlewares
app.use(cors({ credentials: true }));
app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

//routes
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/replies", replyRoutes);

// connect database
connectDb();

// custom middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
// listen to port
const httpServer = createServer(app);
httpServer.listen(PORT, () => {
  console.log(`sever started at port ${PORT}`.red);
});
const io = new Server(httpServer, {
  cors: {
    // origin: "https://e-companion.vercel.app",
    origin: "*",
  },
});
let activeUsers = [];

// add new user to socket
const addusers = (username, userId, socketId) => {
  !activeUsers.some((user) =>user.username === username) && activeUsers.push({username, userId, socketId})
}
// remove users 
const removeUser = (socket) => {
  activeUsers = activeUsers.filter((user) => user.socketId !== socket.id)
}

// get single user
const getUser = (userId) => {
   return activeUsers.find((user) => user?.userId === userId)
}

io.on("connection", (socket) => {
  // console.log("connected to socket.io");
  
  
  // typing animation
  socket.on("typing", (room) => io.to(room).emit("typing"));
  socket.on("stop typing", (room) =>  io.to(room).emit("stop typing"));
  socket.on("addUser", (data) => {
    const { _id, username } = data
    console.log(data._id, username)
    addusers(username, _id, socket.id)
    socket.emit("onlineUser", activeUsers)
  })
// join chat
  socket.on("joinChat", (room) => {
    console.log("user join room", room)
  })


  socket.on("send-message", (data) => {

    const user =  getUser(data.receiverId)
    console.log(user, "users")
    socket.broadcast.emit("message-received", data);
  });
  // console.log(activeUsers)
  
  
// post
// send notification to post owner
  socket.on("likePost", (data) => {
  // io.to
})

  socket.on("disconnect", () => {
    removeUser(socket.id)
    console.log("user disconnected")
})




  // comment
  socket.on("add comment", (data) => {
    io.emit("get comments", data);
  });

  socket.on("add reply", (data) => {
    // console.log(data);
    io.emit("get reply", data);
  });

  


  socket.emit('me', socket.id);
    // console.log(socket.id);

    socket.on('disconnect', (socket) => {
        console.log(socket);
    });

    socket.on('calluser', ({ userToCall, signalData, from, name }) => {
        io.to(userToCall).emit('calluser', { signal: signalData, from, name })
    });

    socket.on('answercall', (data) => {
        io.to(data.to).emit('callaccepted', data.signal);
    });
});
