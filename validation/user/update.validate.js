const Joi = require("joi");

exports.updateUserSchema = Joi.object({
  firstname:
    Joi.string()
    .min(3),
  lastname: Joi.string().min(3),

  country: Joi.string(),
  state: Joi.string(),
  city: Joi.string(),

  phone: Joi.number()
    .integer()
    .min(1000000000)
    .message("Invalid mobile number"),
  // .max(9999999999),

  date_of_birth: Joi.string(),

  gender: Joi.string().valid("male", "female", "others"),
});

exports.changePasswordSchema = Joi.object({
  oldpassword: Joi.string()
    .required()
    .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")),

  password: Joi.string()
    .required()
    .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
    .message("please choose a strong password"),

  password2: Joi.ref("password"),
});
