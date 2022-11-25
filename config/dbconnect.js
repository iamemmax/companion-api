const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
require("dotenv").config({ path: "../.env" });

const connectDb = asyncHandler(async () => {
    // console.log(process.env.DB_URL)
    const database = await mongoose.connect(process.env.DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    if (database) {
        console.log(`database connected successfully`.blue);
        database.connection.on('connected', () => {
            console.log('Mongo has connected succesfully')
        })
        database.connection.on('reconnected', () => {
            console.log('Mongo has reconnected')
        })
        database.connection.on('error', error => {
            console.log('Mongo connection has an error', error)
            database.disconnect()
        })
        database.connection.on('disconnected', () => {
            console.log('Mongo connection is disconnected')
        })
    } else {
        console.log("database error");
        process.exist(1);
    }
});





module.exports = connectDb;