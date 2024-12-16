const Joi = require('joi');
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['food', 'transportation', 'entertainment', 'housing', 'shopping'], // Categories
  },
  amount: { type: Number, required: true }, // Transaction amount
  description: { type: String }, // Optional description
  date: { type: Date, default: Date.now }, // Transaction date

});

// User schema with an array of transactions
const userTransactionSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }, // Email of the user
  transactions: [transactionSchema], // Array of transactions
  totalBudget: { type: Number, default: 0 }, // Total budget set by the user
  totalAmountSpent: { type: Number, default: 0 }, // Total amount spent by the user
  remainingBudget: { type: Number, default: 0 }, // Remaining budget (totalBudget - totalAmountSpent)
});

const UserTransaction = mongoose.model('Transaction', userTransactionSchema);




function validateUserTransaction(userTransaction) {
  const userTransactionSchema = Joi.object({
    email: Joi.string().email().required(), 
    transactions: Joi.array().items( 
      Joi.object({
        category: Joi.string()
          .valid("food", "transportation", "entertainment", "housing", "shopping")
          .required(),
        amount: Joi.number().greater(0).required(),
        description: Joi.string().optional(),
        date: Joi.date().iso().optional(),
      }),
    ).required().min(1),
    totalBudget: Joi.number().greater(0).optional(),
    totalAmountSpent: Joi.number().greater(0).optional(), 
    remainingBudget: Joi.number().greater(0).optional(),
  });

  return userTransactionSchema.validate(userTransaction);
}

exports.UserTransaction = UserTransaction;
exports.transactionValidate = validateUserTransaction;
