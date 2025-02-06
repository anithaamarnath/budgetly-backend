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
const bcrypt = require("bcryptjs");


const transactionSchema = new mongoose.Schema({
    category: {
      type: String,
      required: true,
      enum: ["food", "transportation", "entertainment", "housing", "shopping"],
    },
    amount: { type: Number, required: true },
    description: { type: String, trim: true },
    date: { type: Date, default: Date.now },
  });
  
  const userTransactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    transactions: [
      {
        category: { type: String, required: true, enum: ["food", "transportation", "entertainment", "housing", "shopping"] },
        amount: { type: Number, required: true },
        description: { type: String, trim: true },
        date: { type: Date, default: Date.now },
      },
    ],
    totalBudget: { type: Number, default: 0 },
    totalAmountSpent: { type: Number, default: 0 },
    remainingBudget: {
      type: Number,
      default: function () {
        return this.totalBudget - this.totalAmountSpent;
      },
    },
  });
  

  
  
  const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      minlength: MIN_LENGTH_FIVE,
      maxlength: MAX_LENGTH_FIFTY,
    },
    email: {
      type: String,
      required: true,
      minlength: MIN_LENGTH_FIVE,
      maxlength: MAX_LENGTH_TWO_FIFTY_FIVE,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: MIN_LENGTH_FIVE,
      maxlength: MAX_LENGTH_ONE_THOUSAND_TWENTY_FOUR,
    },
  });
  
  userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id }, process.env.JWT_PRIVATE_KEY);
    return token;
  };
  

  userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
  });
  
  const User = mongoose.model("User", userSchema);
  const UserTransaction = mongoose.model("UserTransaction", userTransactionSchema);
  
  function validateUserTransaction(userTransaction) {
    const schema = Joi.object({
      user: Joi.string().required(),
      transactions: Joi.array()
        .items(
          Joi.object({
            category: Joi.string()
              .valid("food", "transportation", "entertainment", "housing", "shopping")
              .required(),
            amount: Joi.number().greater(0).required(),
            description: Joi.string().optional(),
            date: Joi.date().iso().optional(),
          })
        )
        .required()
        .min(1),
      totalBudget: Joi.number().greater(0).optional(),
      totalAmountSpent: Joi.number().min(0).optional(),
      remainingBudget: Joi.number().min(0).optional(),
    });
  
    return schema.validate(userTransaction);
  }
  
  function validateUser(user) {
    const schema = Joi.object({
      name: Joi.string().min(MIN_LENGTH_FIVE).max(MAX_LENGTH_FIFTY).required(),
      email: Joi.string().min(MIN_LENGTH_FIVE).max(MAX_LENGTH_TWO_FIFTY_FIVE).required().email(),
      password: passwordComplexity({
        min: MIN_LENGTH_EIGHT,
        max: MAX_LENGTH_TWENTY,
        lowerCase: MIN_LENGTH_ONE,
        upperCase: MIN_LENGTH_ONE,
        numeric: MIN_LENGTH_ONE,
        symbol: MIN_LENGTH_ONE,
        requirementCount: MIN_LENGTH_FOUR,
      }).required(),
      confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
        "any.only": "Confirm password does not match password",
      }),
    });
  
    return schema.validate(user);
  }
  
  exports.User = User;
  exports.UserTransaction = UserTransaction;
  exports.validateUser = validateUser;
  exports.validateUserTransaction = validateUserTransaction;
  
