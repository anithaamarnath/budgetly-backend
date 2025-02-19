const express = require('express');
const { UserTransaction, validateUserTransaction } = require('../models/user');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
const { STATUS_CODE_BAD_REQUEST, ZERO,STATUS_CODE_INTERNAL_SERVER_ERROR, STATUS_CODE_UNAUTHORIZED, STATUS_CODE_CREATED} = require('../constants');

router.post('/addNew', authMiddleware, async (req, res) => {
 
  const { error } = validateUserTransaction(req.body);
  if (error) {
    return res.status(STATUS_CODE_BAD_REQUEST).json({ message: error.details[ZERO].message });
  }

  const { category, amount, description, date } = req.body;

  try {
  
    if (!req.user?.email) {
      return res.status(STATUS_CODE_UNAUTHORIZED).json({ message: 'Unauthorized: Email not found in request' });
    }

  
    const newTransaction = new UserTransaction({
      category,
      amount,
      description,
      date,
      userEmail: req.user.email, 
    });

    await newTransaction.save();

    res.status(STATUS_CODE_CREATED).json({
      message: 'Transaction added successfully',
      transaction: newTransaction,
    });
  } catch (error) {
    console.error("Error saving transaction:", error.message);
    res.status(STATUS_CODE_INTERNAL_SERVER_ERROR).json({ message: 'Failed to save transaction. Please try again later.' });
  }
});

module.exports = router;
