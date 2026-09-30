const database = require("./database");

/**
 * Get a user's wallet.
 */
function getWallet(userId) {
  const user = database.getUser(userId);

  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    balance: Number(user.balance || 0),
    totalSpent: Number(user.totalSpent || 0)
  };
}

/**
 * Ensure a user exists.
 */
function ensureUser(user) {
  if (!user || !user.id) {
    throw new Error("Valid user information is required.");
  }

  let existingUser = database.getUser(user.id);

  if (!existingUser) {
    existingUser = database.createUser(user);
  }

  return existingUser;
}

/**
 * Add funds to a wallet.
 *
 * This should normally be called after a payment
 * has been verified by your payment system.
 */
function creditWallet(user, amount, description = "Wallet credit") {
  const account = ensureUser(user);
  const value = Number(amount);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  const updatedUser = database.addBalance(
    account.id,
    value
  );

  database.createTransaction(account.id, {
    type: "credit",
    amount: value,
    status: "completed",
    description
  });

  return {
    success: true,
    balance: Number(updatedUser.balance || 0)
  };
}

/**
 * Spend money from a wallet.
 */
function chargeWallet(
  userId,
  amount,
  description = "Campaign payment"
) {
  const value = Number(amount);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  const result = database.deductBalance(
    userId,
    value
  );

  if (!result.success) {
    if (result.reason === "USER_NOT_FOUND") {
      throw new Error("User wallet was not found.");
    }

    if (result.reason === "INSUFFICIENT_BALANCE") {
      throw new Error("Insufficient wallet balance.");
    }

    throw new Error("Wallet transaction failed.");
  }

  database.createTransaction(userId, {
    type: "debit",
    amount: value,
    status: "completed",
    description
  });

  return {
    success: true,
    balance: result.balance
  };
}

/**
 * Get wallet transaction history.
 */
function getTransactions(userId) {
  return database.getUserTransactions(userId);
}

/**
 * Get wallet summary.
 */
function getWalletSummary(userId) {
  const wallet = getWallet(userId);

  if (!wallet) {
    return null;
  }

  const transactions = getTransactions(userId);

  const deposits = transactions
    .filter(transaction => transaction.type === "credit")
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount || 0),
      0
    );

  const spending = transactions
    .filter(transaction => transaction.type === "debit")
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount || 0),
      0
    );

  return {
    balance: wallet.balance,
    totalDeposited: deposits,
    totalSpent: spending,
    transactionCount: transactions.length
  };
}

module.exports = {
  getWallet,
  ensureUser,
  creditWallet,
  chargeWallet,
  getTransactions,
  getWalletSummary
};
