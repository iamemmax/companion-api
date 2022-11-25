const Joi = require("joi")

exports.validatePostSchema = Joi.object({


    description: Joi.string(),
    visibility: Joi.string(),
    userId: Joi.string(),
    author: Joi.string()



})