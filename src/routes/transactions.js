const express = require("express");
const { User,validateUser, UserTransaction, validateUserTransaction } = require("../models/user");  
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();


// ✅ Get User Transactions & Budget by User ID
router.get("/user/:userId", async (req, res) => {
  try {
    console.log("Fetching transactions for user:", req.params.userId);
    
    const user = await UserTransaction.findOne({ user: req.params.userId }).populate('user');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      totalBudget: user.totalBudget,
      totalAmountSpent: user.totalAmountSpent,
      remainingBudget: user.remainingBudget,
      transactions: user.transactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



router.post("/add-transaction/:email", async (req, res) => {
  try {
    console.log("Adding transaction for user:", req.params.email);

    const { category, amount, description, date } = req.body;

    if (!category || !amount) {
      return res.status(400).json({ message: "Category and Amount are required" });
    }

    // Find the user by email
    const user = await User.findOne({ email: req.params.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the user's transactions or create a new one
    let userTransaction = await UserTransaction.findOne({ user: user._id });

    if (!userTransaction) {
      console.log("No UserTransaction record found. Creating a new one...");
      userTransaction = new UserTransaction({
        user: user._id,
        transactions: [],
        totalBudget: 0, // Set default budget if needed
        totalAmountSpent: 0,
      });
    }

    // Create a new transaction
    const newTransaction = {
      category,
      amount,
      description: description || "",
      date: date ? new Date(date) : new Date(),
    };

    // Update user transactions
    userTransaction.transactions.push(newTransaction);
    userTransaction.totalAmountSpent += amount;
    userTransaction.remainingBudget = userTransaction.totalBudget - userTransaction.totalAmountSpent;

    await userTransaction.save();

    res.status(201).json({
      message: "Transaction added successfully",
      transaction: newTransaction,
      totalAmountSpent: userTransaction.totalAmountSpent,
      remainingBudget: userTransaction.remainingBudget,
    });
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ message: error.message });
  }
});



// ✅ Update the User's Budget (PUT)
router.put("/:userId", async (req, res) => {
  try {
    console.log("Updating budget for:", req.params.userId);
    
    const { totalBudget } = req.body;

    if (!totalBudget || totalBudget < 0) {
      return res.status(400).json({ message: "Total budget must be a positive number" });
    }

    const user = await UserTransaction.findOne({ user: req.params.userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.totalBudget = totalBudget;
    user.remainingBudget = totalBudget - user.totalAmountSpent;

    await user.save();

    res.json({ totalBudget, remainingBudget: user.remainingBudget });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Delete a Transaction (DELETE)
router.delete("/delete-transaction/:userId/:transactionId", async (req, res) => {
  try {
    console.log("Deleting transaction:", req.params.transactionId, "for user:", req.params.userId);
    
    const user = await UserTransaction.findOne({ user: req.params.userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const transactionIndex = user.transactions.findIndex(
      (t) => t._id.toString() === req.params.transactionId
    );

    if (transactionIndex === -1) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Get amount before deleting
    const amountToDelete = user.transactions[transactionIndex].amount;

    // Remove transaction
    user.transactions.splice(transactionIndex, 1);
    user.totalAmountSpent -= amountToDelete;
    user.remainingBudget = user.totalBudget - user.totalAmountSpent;

    await user.save();

    res.json({
      message: "Transaction deleted successfully",
      totalAmountSpent: user.totalAmountSpent,
      remainingBudget: user.remainingBudget,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
