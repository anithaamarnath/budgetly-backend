const express = require("express");
const { User, UserTransaction } = require("../models/user");  
const { ObjectId } = require("mongodb");
const router = express.Router();
const { 
  STATUS_CODE_BAD_REQUEST,
  STATUS_CODE_CREATED, 
  STATUS_CODE_INTERNAL_SERVER_ERROR, 
  STATUS_CODE_NOT_FOUND, 
  ZERO 
} = require("../constants");



router.get("/:email", async (req, res) => {
  try { 
    const user = await User.findOne({ email: req.params.email.toLowerCase() });

    if (!user) {
      console.error("User not found in DB");
      return res.status(STATUS_CODE_NOT_FOUND).json({ message: "User not found" });
    }

    const userTransaction = await UserTransaction.findOne({ user: user._id }).populate('user');

   
    if (!userTransaction) {
      console.warn("No transactions found for user. Returning default values.");
      return res.json({
        totalBudget: ZERO,
        totalAmountSpent: ZERO,
        remainingBudget: ZERO,
        transactions: [],
      });
    }


    res.json({
      totalBudget: userTransaction.totalBudget,
      totalAmountSpent: userTransaction.totalAmountSpent,
      remainingBudget: userTransaction.remainingBudget,
      transactions: userTransaction.transactions,
    });

  } catch (error) {
    console.error("Error fetching user budget data:", error);
    res.status(500).json({ message: error.message });
  }
});


router.post("/add-transaction/:email", async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;

    if (!category || !amount) {
      return res.status(STATUS_CODE_BAD_REQUEST).json({ message: "Category and Amount are required" });
    }

    const user = await User.findOne({ email: req.params.email });

    if (!user) {
      return res.status(STATUS_CODE_NOT_FOUND).json({ message: "User not found" });
    }

    let userTransaction = await UserTransaction.findOne({ user: user._id });

    if (!userTransaction) {
      userTransaction = new UserTransaction({
        user: user._id,
        transactions: [],
        totalBudget: ZERO, 
        totalAmountSpent: ZERO,
      });
    }

    const newTransaction = {
      category,
      amount,
      description: description || "",
      date: date ? new Date(date) : new Date(),
    };

    userTransaction.transactions.push(newTransaction);
    userTransaction.totalAmountSpent += amount;
    userTransaction.remainingBudget = userTransaction.totalBudget - userTransaction.totalAmountSpent;

    await userTransaction.save();

    res.status(STATUS_CODE_CREATED).json({
      message: "Transaction added successfully",
      transaction: newTransaction,
      totalAmountSpent: userTransaction.totalAmountSpent,
      remainingBudget: userTransaction.remainingBudget,
    });
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(STATUS_CODE_INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
});


router.put("/edit-transaction/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;
    const updatedData = req.body;

  
    if (!updatedData.category || !updatedData.amount) {
      return res.status(STATUS_CODE_BAD_REQUEST).json({ message: "Category and amount are required" });
    }


    const userTransaction = await UserTransaction.findOne({ "transactions._id": new ObjectId(transactionId) });

    if (!userTransaction) {
      return res.status(STATUS_CODE_NOT_FOUND).json({ message: "Transaction not found" });
    }

    const transaction = userTransaction.transactions.find((t) => t._id.toString() === transactionId);

    if (!transaction) {
      return res.status(STATUS_CODE_NOT_FOUND).json({ message: "Transaction not found in user's data" });
    }

    const amountDifference = updatedData.amount - transaction.amount;

    transaction.category = updatedData.category;
    transaction.amount = updatedData.amount;
    if (updatedData.description) {
      transaction.description = updatedData.description;
    }


    userTransaction.totalAmountSpent += amountDifference;
    userTransaction.remainingBudget = userTransaction.totalBudget - userTransaction.totalAmountSpent;

    await userTransaction.save();

    res.json({
      totalBudget: userTransaction.totalBudget,
      totalAmountSpent: userTransaction.totalAmountSpent,
      remainingBudget: userTransaction.remainingBudget,
      transactions: userTransaction.transactions,
    });
  } catch (error) {
    console.error("Error editing transaction:", error);
    res.status(STATUS_CODE_INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
});


router.put("/update-budget/:email", async (req, res) => {
  try {
    const { email } = req.params; 
    const { totalBudget } = req.body; 
 
    if (totalBudget < ZERO) {
      return res.status(STATUS_CODE_BAD_REQUEST).json({ message: "Total budget must be a positive number" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(STATUS_CODE_NOT_FOUND).json({ message: "User not found" });
    }


    const userTransaction = await UserTransaction.findOne({ user: user._id });

    if (!userTransaction) {
      return res.status(STATUS_CODE_NOT_FOUND).json({ message: "User transaction data not found" });
    } 
    userTransaction.totalBudget = totalBudget;
    userTransaction.remainingBudget = totalBudget - userTransaction.totalAmountSpent;

    await userTransaction.save();

  
    res.json({
      totalBudget: userTransaction.totalBudget,
      remainingBudget: userTransaction.remainingBudget,
    });

  } catch (error) {
    console.error("Error updating budget:", error);
    res.status(STATUS_CODE_INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
});




router.delete("/delete-transaction/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;
   

    const user = await UserTransaction.findOne({ "transactions._id": new ObjectId(transactionId) });

    if (!user) {
      return res.status(STATUS_CODE_NOT_FOUND).json({ message: "Transaction not found" });
    }


    const transaction = user.transactions.find((t) => t._id.toString() === transactionId);
    if (!transaction) {
      return res.status(STATUS_CODE_NOT_FOUND).json({ message: "Transaction not found in user's data" });
    }

    const amountToDelete = transaction.amount;

  
    const updatedUser = await UserTransaction.findOneAndUpdate(
      { "transactions._id": new ObjectId(transactionId) },
      {
        $pull: { transactions: { _id: new ObjectId(transactionId) } },
        $inc: { totalAmountSpent: -amountToDelete, remainingBudget: amountToDelete },
      },
      { new: true }
    );

    res.json({
      message: "Transaction deleted successfully",
      totalAmountSpent: updatedUser.totalAmountSpent,
      remainingBudget: updatedUser.remainingBudget,
      transactions: updatedUser.transactions,
    });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(STATUS_CODE_INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
});

module.exports = router;
