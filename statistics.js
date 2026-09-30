const database = require("./database");

/**
 * Get global bot statistics.
 */
function getGlobalStatistics() {
  const stats = database.getStatistics();

  return {
    totalUsers: Number(stats.totalUsers || 0),
    totalCampaigns: Number(stats.totalCampaigns || 0),
    totalSpent: Number(stats.totalSpent || 0),
    totalRevenue: Number(stats.totalRevenue || 0)
  };
}

/**
 * Get statistics for one user.
 */
function getUserStatistics(userId) {
  const user = database.getUser(userId);

  if (!user) {
    return null;
  }

  const campaigns = database.getUserCampaigns(userId);

  const active = campaigns.filter(
    campaign => campaign.status === "active"
  ).length;

  const completed = campaigns.filter(
    campaign => campaign.status === "completed"
  ).length;

  const pending = campaigns.filter(
    campaign => campaign.status === "pending"
  ).length;

  const totalBudget = campaigns.reduce(
    (total, campaign) =>
      total + Number(campaign.budget || 0),
    0
  );

  const totalSpent = Number(user.totalSpent || 0);

  return {
    userId: user.id,
    balance: Number(user.balance || 0),
    totalCampaigns: campaigns.length,
    activeCampaigns: active,
    pendingCampaigns: pending,
    completedCampaigns: completed,
    totalBudget,
    totalSpent
  };
}

/**
 * Get campaign counts grouped by status.
 */
function getCampaignStatusStatistics() {
  const db = database.readDatabase();

  const campaigns = Object.values(db.campaigns);

  const result = {
    draft: 0,
    pending: 0,
    approved: 0,
    active: 0,
    paused: 0,
    completed: 0,
    rejected: 0
  };

  for (const campaign of campaigns) {
    if (Object.prototype.hasOwnProperty.call(
      result,
      campaign.status
    )) {
      result[campaign.status] += 1;
    }
  }

  return result;
}

/**
 * Get wallet transaction statistics.
 */
function getTransactionStatistics() {
  const db = database.readDatabase();

  const transactions = Object.values(
    db.transactions
  );

  let credits = 0;
  let debits = 0;

  for (const transaction of transactions) {
    const amount = Number(transaction.amount || 0);

    if (transaction.type === "credit") {
      credits += amount;
    }

    if (transaction.type === "debit") {
      debits += amount;
    }
  }

  return {
    totalTransactions: transactions.length,
    totalCredits: credits,
    totalDebits: debits
  };
}

module.exports = {
  getGlobalStatistics,
  getUserStatistics,
  getCampaignStatusStatistics,
  getTransactionStatistics
};
