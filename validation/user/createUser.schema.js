const Joi = require("joi")


exports.createUserSchema = Joi.object({
    firstname: Joi.string()

        .required()
        .min(3),
    lastname: Joi.string()

        .required()
        .min(3),

    username: Joi.string()
        .alphanum()
        .required()
        .min(5),

    email: Joi.string()
        .email()
        .required()
    ,

    country: Joi.string().required(),
    state: Joi.string().required(),
    city: Joi.string().required(),

    phone: Joi.string(),

    date_of_birth: Joi.string()
    // .valid()
    // .date()
    // .required()
    ,

    gender: Joi.string()
        .valid('male', 'female', 'others'),

    password: Joi.string()
        .required()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),

    password2: Joi.ref('password'),
})

exports.loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required(),

    password: Joi.string()
        .required()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),


})

// verifying validation schema

exports.verifySchema = Joi.object({
    token: Joi.string()
        .required()
})


// forget password validation schema
exports.forgetPasswordSchema = Joi.object({
    email: Joi.string()
        .required()
        .email()
})



// forget password validation schema

exports.resetPasswordSchema = Joi.object({

    password: Joi.string()
        .required()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
        .message("please choose a strong password"),

    password2: Joi.ref('password')



})