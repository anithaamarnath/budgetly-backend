const mongoose = require("mongoose");
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const transactionSchema = new mongoose.Schema({
  category: { type: String, required: true, enum: ["food", "transportation", "entertainment", "housing", "shopping"] },
  amount: { type: Number, required: true },
  description: { type: String, trim: true },
  date: { type: Date, default: Date.now },
});

const userTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  transactions: [transactionSchema],
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
  name: { type: String, required: true, minlength: 5, maxlength: 50 },
  email: { type: String, required: true, minlength: 5, maxlength: 255, unique: true },
  password: { type: String, required: true, minlength: 8, maxlength: 1024 },
});

userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_PRIVATE_KEY);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userTransactionSchema.pre("save", function (next) {
  if (this.isModified("totalBudget") || this.isModified("totalAmountSpent")) {
    this.remainingBudget = this.totalBudget - this.totalAmountSpent;
  }
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
          category: Joi.string().valid("food", "transportation", "entertainment", "housing", "shopping").required(),
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
    name: Joi.string().min(5).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: passwordComplexity({
      min: 8,
      max: 20,
      lowerCase: 1,
      upperCase: 1,
      numeric: 1,
      symbol: 1,
      requirementCount: 4,
    }).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
      "any.only": "Confirm password does not match password",
    }),
    token: Joi.string().optional(),
  });
  return schema.validate(user);
}

module.exports = { User, UserTransaction, validateUser, validateUserTransaction };
