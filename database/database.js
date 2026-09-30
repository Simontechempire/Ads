const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data");
const DATABASE_FILE = path.join(DATA_DIR, "campaigns.json");

function ensureDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATABASE_FILE)) {
    const initialData = {
      users: {},
      campaigns: {},
      transactions: {},
      statistics: {
        totalUsers: 0,
        totalCampaigns: 0,
        totalSpent: 0,
        totalRevenue: 0
      }
    };

    fs.writeFileSync(
      DATABASE_FILE,
      JSON.stringify(initialData, null, 2),
      "utf8"
    );
  }
}

function readDatabase() {
  ensureDatabase();

  try {
    return JSON.parse(
      fs.readFileSync(DATABASE_FILE, "utf8")
    );
  } catch (error) {
    console.error("❌ Database read error:", error.message);
    return {
      users: {},
      campaigns: {},
      transactions: {},
      statistics: {
        totalUsers: 0,
        totalCampaigns: 0,
        totalSpent: 0,
        totalRevenue: 0
      }
    };
  }
}

function writeDatabase(data) {
  ensureDatabase();

  fs.writeFileSync(
    DATABASE_FILE,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

// ==============================
// USERS
// ==============================

function getUser(userId) {
  const db = readDatabase();
  return db.users[String(userId)] || null;
}

function createUser(user) {
  const db = readDatabase();
  const id = String(user.id);

  if (db.users[id]) {
    return db.users[id];
  }

  const newUser = {
    id: user.id,
    username: user.username || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    balance: 0,
    createdAt: new Date().toISOString()
  };

  db.users[id] = newUser;
  db.statistics.totalUsers += 1;

  writeDatabase(db);

  return newUser;
}

function updateUser(userId, updates) {
  const db = readDatabase();
  const id = String(userId);

  if (!db.users[id]) {
    return null;
  }

  db.users[id] = {
    ...db.users[id],
    ...updates
  };

  writeDatabase(db);

  return db.users[id];
}

// ==============================
// CAMPAIGNS
// ==============================

function createCampaign(campaign) {
  const db = readDatabase();

  const id =
    campaign.id ||
    `campaign_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

  const newCampaign = {
    id,
    userId: campaign.userId,
    title: campaign.title || "",
    description: campaign.description || "",
    url: campaign.url || "",
    budget: Number(campaign.budget || 0),
    status: campaign.status || "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.campaigns[id] = newCampaign;
  db.statistics.totalCampaigns += 1;

  writeDatabase(db);

  return newCampaign;
}

function getCampaign(campaignId) {
  const db = readDatabase();
  return db.campaigns[String(campaignId)] || null;
}

function getUserCampaigns(userId) {
  const db = readDatabase();

  return Object.values(db.campaigns).filter(
    campaign => String(campaign.userId) === String(userId)
  );
}

function updateCampaign(campaignId, updates) {
  const db = readDatabase();
  const id = String(campaignId);

  if (!db.campaigns[id]) {
    return null;
  }

  db.campaigns[id] = {
    ...db.campaigns[id],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  writeDatabase(db);

  return db.campaigns[id];
}

function deleteCampaign(campaignId) {
  const db = readDatabase();
  const id = String(campaignId);

  if (!db.campaigns[id]) {
    return false;
  }

  delete db.campaigns[id];

  writeDatabase(db);

  return true;
}

// ==============================
// WALLET
// ==============================

function getBalance(userId) {
  const user = getUser(userId);
  return user ? Number(user.balance || 0) : 0;
}

function updateBalance(userId, amount) {
  const user = getUser(userId);

  if (!user) {
    return null;
  }

  const newBalance = Number(amount);

  return updateUser(userId, {
    balance: newBalance
  });
}

function addBalance(userId, amount) {
  const currentBalance = getBalance(userId);
  return updateBalance(
    userId,
    currentBalance + Number(amount)
  );
}

function deductBalance(userId, amount) {
  const currentBalance = getBalance(userId);
  const value = Number(amount);

  if (value > currentBalance) {
    return null;
  }

  return updateBalance(
    userId,
    currentBalance - value
  );
}

// ==============================
// TRANSACTIONS
// ==============================

function createTransaction(transaction) {
  const db = readDatabase();

  const id =
    transaction.id ||
    `tx_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

  const newTransaction = {
    id,
    userId: transaction.userId,
    type: transaction.type || "unknown",
    amount: Number(transaction.amount || 0),
    status: transaction.status || "pending",
    description: transaction.description || "",
    createdAt: new Date().toISOString()
  };

  db.transactions[id] = newTransaction;

  writeDatabase(db);

  return newTransaction;
}

function getUserTransactions(userId) {
  const db = readDatabase();

  return Object.values(db.transactions)
    .filter(
      transaction =>
        String(transaction.userId) === String(userId)
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );
}

// ==============================
// STATISTICS
// ==============================

function getStatistics() {
  const db = readDatabase();

  return {
    ...db.statistics,
    totalUsers: Object.keys(db.users).length,
    totalCampaigns: Object.keys(db.campaigns).length
  };
}

// ==============================
// EXPORTS
// ==============================

module.exports = {
  ensureDatabase,
  readDatabase,
  writeDatabase,

  getUser,
  createUser,
  updateUser,

  createCampaign,
  getCampaign,
  getUserCampaigns,
  updateCampaign,
  deleteCampaign,

  getBalance,
  updateBalance,
  addBalance,
  deductBalance,

  createTransaction,
  getUserTransactions,

  getStatistics
};
