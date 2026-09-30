const {
  getUser,
  createUser,
  getBalance,
  addBalance,
  deductBalance,
  createTransaction,
  getUserTransactions
} = require("../database/database");

/**
 * Ensure that a user exists before wallet operations.
 */
function ensureUser(userData) {
  let user = getUser(userData.id);

  if (!user) {
    user = createUser({
      id: userData.id,
      username: userData.username || "",
      firstName: userData.firstName || "",
      lastName: userData.lastName || ""
    });
  }

  return user;
}

/**
 * Get wallet balance.
 */
function getWalletBalance(userId) {
  return getBalance(userId);
}

/**
 * Add money to a user's wallet.
 *
 * This function records the transaction locally.
 * A real payment provider can be connected later.
 */
function creditWallet(userId, amount, description = "Wallet deposit") {
  const value = Number(amount);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const user = getUser(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const updatedUser = addBalance(userId, value);

  const transaction = createTransaction({
    userId,
    type: "credit",
    amount: value,
    status: "completed",
    description
  });

  return {
    user: updatedUser,
    transaction
  };
}

/**
 * Charge a user's wallet.
 */
function chargeWallet(
  userId,
  amount,
  description = "Campaign payment"
) {
  const value = Number(amount);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const balance = getBalance(userId);

  if (balance < value) {
    throw new Error("Insufficient wallet balance");
  }

  const updatedUser = deductBalance(userId, value);

  if (!updatedUser) {
    throw new Error("Unable to charge wallet");
  }

  const transaction = createTransaction({
    userId,
    type: "debit",
    amount: value,
    status: "completed",
    description
  });

  return {
    user: updatedUser,
    transaction
  };
}

/**
 * Get transaction history.
 */
function getTransactions(userId) {
  return getUserTransactions(userId);
}

/**
 * Create a pending payment record.
 *
 * This is useful when a real payment gateway
 * is connected later.
 */
function createPendingPayment(
  userId,
  amount,
  description = "Pending wallet deposit"
) {
  const value = Number(amount);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  return createTransaction({
    userId,
    type: "credit",
    amount: value,
    status: "pending",
    description
  });
}

/**
 * Return a simple wallet summary.
 */
function getWalletSummary(userId) {
  const balance = getBalance(userId);
  const transactions = getUserTransactions(userId);

  const credits = transactions
    .filter(transaction => transaction.type === "credit")
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount || 0),
      0
    );

  const debits = transactions
    .filter(transaction => transaction.type === "debit")
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount || 0),
      0
    );

  return {
    balance,
    totalCredits: credits,
    totalDebits: debits,
    transactionCount: transactions.length
  };
}

module.exports = {
  ensureUser,
  getWalletBalance,
  creditWallet,
  chargeWallet,
  getTransactions,
  createPendingPayment,
  getWalletSummary
};
