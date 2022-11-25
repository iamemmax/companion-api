// async..await is not allowed in global scope, must use a wrapper
// async..await is not allowed in global scope, must use a wrapper
"use strict";
const nodemailer = require("nodemailer");

const sendMail = async (email, subject, html) => {

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "business99.web-hosting.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.email,
            pass: process.env.password
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: `"Essential group 👻"${process.env.email}`, // sender address
        to: email,
        subject,
        html, // html body
    }).catch(console.error)

    console.log("Message sent: %s", info);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

// sendMail();

module.exports = sendMail