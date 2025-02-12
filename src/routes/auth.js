const express = require('express');
const { UserTransaction, validateUserTransaction } = require('../models/user');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/addNew', authMiddleware, async (req, res) => {
 
  const { error } = validateUserTransaction(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { category, amount, description, date } = req.body;

  try {
  
    if (!req.user?.email) {
      return res.status(401).json({ message: 'Unauthorized: Email not found in request' });
    }

  
    const newTransaction = new UserTransaction({
      category,
      amount,
      description,
      date,
      userEmail: req.user.email, 
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
