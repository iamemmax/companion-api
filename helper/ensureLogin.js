const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const userSchema = require("../model/user/user.schema");

exports.ensureLogin = asyncHandler(async (req, res, next) => {
    const { authorization } = req.headers;
    const rawToken = authorization?.split(" ");
    try {
        jwt.verify(rawToken[1], process.env.JWT_SECRETE, async (error, data) => {
            if (error) {
                return res.status(401).json({
                    res: "failed",
                    msg: "invalid Token.",

                })

            }
            // req.user = 
            // req.user = { id: payload.userId };
            req.user = await userSchema.findOne({ id: data.id }).select("-password -token -_v")
           
        
    
            if (req.user.verified === false) {
                return res.status(200).json({
                    res: "failed",
                    msg: "Your account is not verified, Check your email for verification link.",
    
                })
            }else{
                return next();
            }
        });
    } catch (error) {
        if (error) {
            return res.status(401).json({
                res: "failed",
                msg: "not authorized",
            

            })
        }
    }
    if (!rawToken) {
        return res.status(401).json({
            res: "failed",
            message: "Not authorized, no token",

        })

    }
})