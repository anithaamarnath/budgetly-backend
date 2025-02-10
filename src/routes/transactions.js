const express = require("express");
const { User,validateUser, UserTransaction, validateUserTransaction } = require("../models/user");  
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();


// ✅ Get User Transactions & Budget by User ID
router.get("/:email", async (req, res) => {
  
  try { 
    // First, find the user by email from the User model
    const user = await User.findOne({ email: req.params.email });

   
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Then, use the user's ObjectId to find transactions in UserTransaction
    const userTransaction = await UserTransaction.findOne({ user: user._id }).populate('user');
    
    if (!userTransaction) {
      return res.status(404).json({ message: "User transactions not found" });
    }
   

    res.json({
      totalBudget: userTransaction.totalBudget,
      totalAmountSpent: userTransaction.totalAmountSpent,
      remainingBudget: userTransaction.remainingBudget,
      transactions: userTransaction.transactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.post("/add-transaction/:email", async (req, res) => {
  try {


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

router.put("/update-budget/:email", async (req, res) => {
  try {
    const { email } = req.params; // Get the email from the route params
    const { totalBudget } = req.body; // Get the totalBudget from the request body
 

    // Validate totalBudget
    if (totalBudget < 0) {
      return res.status(400).json({ message: "Total budget must be a positive number" });
    }

    // Find the user transaction by email
   // First, find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Now, use the user's ID to find the corresponding user transaction
    const userTransaction = await UserTransaction.findOne({ user: user._id });

    if (!userTransaction) {
      return res.status(404).json({ message: "User transaction data not found" });
    } 
    // Update the user's total budget and remaining budget
    userTransaction.totalBudget = totalBudget;
    userTransaction.remainingBudget = totalBudget - userTransaction.totalAmountSpent;

    // Save the updated transaction
    await userTransaction.save();

   

    // Respond with the updated user transaction
    res.json({
      totalBudget: userTransaction.totalBudget,
      remainingBudget: userTransaction.remainingBudget,
    });

  } catch (error) {
    console.error("Error updating budget:", error);
    res.status(500).json({ message: "Server error" });
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
