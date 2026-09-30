const fs = require("fs");
const path = require("path");

const DATA_DIR = path.resolve(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "campaigns.json");

const DEFAULT_DATABASE = {
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

function ensureDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(DEFAULT_DATABASE, null, 2),
      "utf8"
    );
  }
}

function readDatabase() {
  ensureDatabase();

  try {
    const data = fs.readFileSync(DATA_FILE, "utf8");
    return data ? JSON.parse(data) : { ...DEFAULT_DATABASE };
  } catch (error) {
    console.error("❌ Database read error:", error.message);
    return { ...DEFAULT_DATABASE };
  }
}

function writeDatabase(database) {
  ensureDatabase();

  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(database, null, 2),
    "utf8"
  );

  return database;
}

// ==============================
// USERS
// ==============================

function getUser(userId) {
  const db = readDatabase();
  return db.users[String(userId)] || null;
}

function createUser(userData) {
  const db = readDatabase();
  const userId = String(userData.id);

  if (db.users[userId]) {
    return db.users[userId];
  }

  const user = {
    id: userId,
    username: userData.username || "",
    firstName: userData.firstName || "",
    lastName: userData.lastName || "",
    balance: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.users[userId] = user;
  db.statistics.totalUsers += 1;

  writeDatabase(db);

  return user;
}

function updateUser(userId, updates) {
  const db = readDatabase();
  const id = String(userId);

  if (!db.users[id]) {
    return null;
  }

  db.users[id] = {
    ...db.users[id],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  writeDatabase(db);

  return db.users[id];
}

// ==============================
// CAMPAIGNS
// ==============================

function createCampaign(campaignData) {
  const db = readDatabase();

  const campaignId = `CMP-${Date.now()}-${Math.floor(
    Math.random() * 10000
  )}`;

  const campaign = {
    id: campaignId,
    userId: String(campaignData.userId),
    title: campaignData.title || "",
    description: campaignData.description || "",
    targetUrl: campaignData.targetUrl || "",
    budget: Number(campaignData.budget || 0),
    status: campaignData.status || "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.campaigns[campaignId] = campaign;
  db.statistics.totalCampaigns += 1;

  writeDatabase(db);

  return campaign;
}

function getCampaign(campaignId) {
  const db = readDatabase();
  return db.campaigns[String(campaignId)] || null;
}

function getUserCampaigns(userId) {
  const db = readDatabase();
  const id = String(userId);

  return Object.values(db.campaigns).filter(
    campaign => campaign.userId === id
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
// BALANCE
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

  return updateUser(userId, {
    balance: Number(amount)
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

  if (value <= 0 || currentBalance < value) {
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

function createTransaction(transactionData) {
  const db = readDatabase();

  const transactionId = `TXN-${Date.now()}-${Math.floor(
    Math.random() * 10000
  )}`;

  const transaction = {
    id: transactionId,
    userId: String(transactionData.userId),
    type: transactionData.type || "unknown",
    amount: Number(transactionData.amount || 0),
    status: transactionData.status || "pending",
    description: transactionData.description || "",
    createdAt: new Date().toISOString()
  };

  db.transactions[transactionId] = transaction;

  writeDatabase(db);

  return transaction;
}

function getUserTransactions(userId) {
  const db = readDatabase();
  const id = String(userId);

  return Object.values(db.transactions).filter(
    transaction => transaction.userId === id
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
    totalCampaigns: Object.keys(db.campaigns).length,
    totalTransactions: Object.keys(db.transactions).length
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
