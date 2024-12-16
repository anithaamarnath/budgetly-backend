const express = require('express');
const {UserTransaction, transactionValidate} = require('../models/transaction');
const authMiddleware = require('../middleware/authMidleware'); 
const router = express.Router();

  router.post('/addNew', authMiddleware, async (req, res) => {

  // Validate the transaction data using Joi
  const { error } = transactionValidate(req.body);
  
  if (error) {
    // If validation fails, send the error message
    return res.status(400).json({ message: error.details[0].message });
  }

  // Extract the email and transactions from the request body
  const { email, transactions } = req.body;

  try {
    // Check if the user already exists in the database using the email
    let user = await UserTransaction.findOne({ email });

    if (!user) {
      // If user doesn't exist, create a new user with the provided transactions
      user = new UserTransaction({
        email,
        transactions: transactions,
        totalAmountSpent: totalAmountSpent,
      });
    } else {
      // If user exists, push the new transactions to the existing user's transactions array
      user.transactions.push(...transactions);
      // Recalculate the totalAmountSpent by summing up all transaction amounts
      const totalAmountSpent = user.transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      user.totalAmountSpent = totalAmountSpent; // Update the totalAmountSpent
    }

    // Save the user document (including the transactions)
    await user.save();

    // Respond with the updated user document
    res.status(201).json(user);
  } catch (error) {
    console.error('Error saving transaction:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router;
