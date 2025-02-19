const {ZERO,EXPIRES_IN_ONE_HOUR,MIN_LENGTH_FIVE,MAX_LENGTH_FIFTY, MIN_LENGTH_EIGHT, MAX_LENGTH_TWENTY,MAX_LENGTH_TWO_FIFTY_FIVE, MAX_LENGTH_ONE_THOUSAND_TWENTY_FOUR} = require('../constants');
const mongoose = require("mongoose");
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");
const jwt = require("jsonwebtoken");


const transactionSchema = new mongoose.Schema({
  category: { type: String, required: true, enum: ["food", "transportation", "entertainment", "housing", "shopping"] },
  amount: { type: Number, required: true },
  description: { type: String, trim: true },
  date: { type: Date, default: Date.now },
});


const userTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  transactions: [transactionSchema],
  totalBudget: { type: Number, default: ZERO },
  totalAmountSpent: { type: Number, default: ZERO },
});


userTransactionSchema.virtual("remainingBudget").get(function () {
  return this.totalBudget - this.totalAmountSpent;
});


const userSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: MIN_LENGTH_FIVE, maxlength: MAX_LENGTH_FIFTY },
  email: { type: String, required: true, minlength: MIN_LENGTH_FIVE, maxlength: MAX_LENGTH_TWO_FIFTY_FIVE, unique: true },
  password: { type: String, required: true, minlength: MIN_LENGTH_EIGHT, maxlength: MAX_LENGTH_ONE_THOUSAND_TWENTY_FOUR },
});


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  next();
});

userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { _id: this._id, name: this.name, email: this.email },
    process.env.JWT_PRIVATE_KEY,
    { expiresIn: EXPIRES_IN_ONE_HOUR }
  );
};


const User = mongoose.model("User", userSchema);
const UserTransaction = mongoose.model("UserTransaction", userTransactionSchema);


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
    token: Joi.string().optional(),
  });
  return schema.validate(user);
}


function validateUserTransaction(userTransaction) {
  const schema = Joi.object({
    user: Joi.string().required(),
    transactions: Joi.array()
      .items(
        Joi.object({
          category: Joi.string().valid("food", "transportation", "entertainment", "housing", "shopping").required(),
          amount: Joi.number().greater(ZERO).required(),
          description: Joi.string().optional(),
          date: Joi.date().iso().optional(),
        })
      )
      .required()
      .min(1),
    totalBudget: Joi.number().greater(ZERO).optional(),
    totalAmountSpent: Joi.number().min(ZERO).optional(),
  });
  return schema.validate(userTransaction);
}

module.exports = { User, UserTransaction, validateUser, validateUserTransaction };
