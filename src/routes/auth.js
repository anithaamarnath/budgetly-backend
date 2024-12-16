const express = require('express');
const { Transaction, transactionValidate } = require('../models/transaction');
const authMiddleware = require('../middleware/authMidleware');
const router = express.Router();

router.post('/addNew', authMiddleware, async (req, res) => {
  // Validate the transaction data
  const { error } = transactionValidate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { category, amount, description, date } = req.body;

  try {
    // Ensure user email is available
    if (!req.user?.email) {
      return res.status(401).json({ message: 'Unauthorized: Email not found in request' });
    }

    // Create and save the transaction
    const newTransaction = new Transaction({
      category,
      amount,
      description,
      date,
      userEmail: req.user.email, // Email from logged-in user
    });

    await newTransaction.save();

    res.status(201).json({
      message: 'Transaction added successfully',
      transaction: newTransaction,
    });
  } catch (error) {
    console.error("Error saving transaction:", error.message);
    res.status(500).json({ message: 'Failed to save transaction. Please try again later.' });
  }
});

module.exports = router;
