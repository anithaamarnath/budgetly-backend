const { 
    MIN_LENGTH_FIVE, 
    MAX_LENGTH_FIFTY, 
    MAX_LENGTH_TWO_FIFTY_FIVE, 
    MAX_LENGTH_ONE_THOUSAND_TWENTY_FOUR, 
    MIN_LENGTH_EIGHT, 
    MAX_LENGTH_TWENTY,
    MIN_LENGTH_ONE, 
    MIN_LENGTH_FOUR 
} = require('../constants');

const Joi = require('joi');
const mongoose = require('mongoose');
const passwordComplexity = require('joi-password-complexity');
const jwt = require('jsonwebtoken');

const userSchema =  new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: MIN_LENGTH_FIVE,
        maxlength: MAX_LENGTH_FIFTY
    },
    email: {
        type: String,
        required: true,
        minlength: MIN_LENGTH_FIVE,
        maxlength: MAX_LENGTH_TWO_FIFTY_FIVE,
        unique: true // Fixed typo: "unqiue" → "unique"
    },
    password: {
        type: String,
        required: true,
        minlength: MIN_LENGTH_FIVE,
        maxlength: MAX_LENGTH_ONE_THOUSAND_TWENTY_FOUR
    }
   
})

userSchema.methods.generateAuthToken = function() {
    const token = jwt.sign({ _id: this._id }, process.env.JWT_PRIVATE_KEY);
    return token;
}

const User = mongoose.model('User',userSchema);


function validateUser(user) {
    const schema = Joi.object({
        name: Joi.string().min(MIN_LENGTH_FIVE).max(MAX_LENGTH_FIFTY).required(),
        email: Joi.string().min(MIN_LENGTH_FIVE).max(MAX_LENGTH_TWO_FIFTY_FIVE).required().email(),
        password: passwordComplexity({
            min: MIN_LENGTH_EIGHT,        // Minimum length
            max: MAX_LENGTH_TWENTY,       // Maximum length
            lowerCase: MIN_LENGTH_ONE,  // At least one lowercase letter
            upperCase: MIN_LENGTH_ONE,  // At least one uppercase letter
            numeric: MIN_LENGTH_ONE,    // At least one number
            symbol: MIN_LENGTH_ONE,     // At least one special character
            requirementCount: MIN_LENGTH_FOUR // Number of requirements (at least 4 criteria should be met)
        }).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required()
            .messages({ 'any.only': 'Confirm password does not match password' })

    });

    return schema.validate(user); 
}

exports.User = User;
exports.validate = validateUser;
