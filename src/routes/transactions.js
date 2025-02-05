const express = require('express');
const {UserTransaction, transactionValidate} = require('../models/transaction');
const authMiddleware = require('../middleware/authMidleware'); 
const router = express.Router();


router.get('/user/:email', async (req, res) => {
  try {
    conosle.log('user ==', req.params.email);
    const user = await UserTransaction.findOne({ email: req.params.email });
    conosle.log('user ==', user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const budgetData = {
      totalBudget: user.totalBudget,
      totalAmountSpent: user.totalAmountSpent,
      remainingBudget: user.remainingBudget,
      transactions: user.transactions,
    };
    res.json(budgetData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update the user's budget
router.put('/:email', async (req, res) => {
  try {
    console.log('1.req.body ==', req.params.email);
    console.log('1.req.body ==', req.body);

    const { totalBudget } = req.body;
    console.log('2.req.body ==', req.params.email);
    const user = await UserTransaction.findOne({ email: req.params.email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.totalBudget = totalBudget;
    user.remainingBudget = totalBudget - user.totalAmountSpent;
    console.log('3.req.body ==', user.remainingBudget);

    await user.save();
    res.json({ totalBudget, remainingBudget: user.remainingBudget });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



module.exports = router;
