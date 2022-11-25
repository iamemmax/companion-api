const Joi = require("joi")
exports.validateChatSchema = Joi.object({
    messages: Joi.string(),
    recieverId: Joi.required(),
    filename: Joi.string()


})