const express = require('express');
const {UserTransaction, transactionValidate} = require('../models/transaction');
const authMiddleware = require('../middleware/authMidleware'); 
const router = express.Router();

//   router.post('/addNew', authMiddleware, async (req, res) => {

//   // Validate the transaction data using Joi
//   const { error } = transactionValidate(req.body);
  
//   if (error) {
//     // If validation fails, send the error message
//     return res.status(400).json({ message: error.details[0].message });
//   }

//   // Extract the email and transactions from the request body
//   const { email, transactions } = req.body;

//   try {
//     // Check if the user already exists in the database using the email
//     let user = await UserTransaction.findOne({ email });

//     if (!user) {
//       // If user doesn't exist, create a new user with the provided transactions
//       user = new UserTransaction({
//         email,
//         transactions: transactions,
//         totalAmountSpent: totalAmountSpent,
//       });
//     } else {
//       // If user exists, push the new transactions to the existing user's transactions array
//       user.transactions.push(...transactions);
//       // Recalculate the totalAmountSpent by summing up all transaction amounts
//       const totalAmountSpent = user.transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
//       user.totalAmountSpent = totalAmountSpent; // Update the totalAmountSpent
//     }

//     // Save the user document (including the transactions)
//     await user.save();

//     // Respond with the updated user document
//     res.status(201).json(user);
//   } catch (error) {
//     console.error('Error saving transaction:', error);
//     res.status(500).send('Server error');
//   }
// });

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

module.exports = router;
