const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const DATABASE_FILE = path.join(DATA_DIR, "database.json");

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
    const data = fs.readFileSync(DATABASE_FILE, "utf8");
    return JSON.parse(data);
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

function getUser(userId) {
  const db = readDatabase();
  return db.users[String(userId)] || null;
}

function createUser(user) {
  const db = readDatabase();
  const id = String(user.id);

  if (!db.users[id]) {
    db.users[id] = {
      id: user.id,
      username: user.username || "",
      firstName: user.first_name || "",
      balance: 0,
      totalSpent: 0,
      totalCampaigns: 0,
      createdAt: new Date().toISOString()
    };

    db.statistics.totalUsers += 1;
    writeDatabase(db);
  }

  return db.users[id];
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

function createCampaign(userId, campaignData) {
  const db = readDatabase();

  const campaignId =
    `CMP-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  db.campaigns[campaignId] = {
    id: campaignId,
    userId: Number(userId),
    title: campaignData.title || "Untitled Campaign",
    content: campaignData.content || "",
    status: campaignData.status || "draft",
    budget: Number(campaignData.budget || 0),
    spent: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const user = db.users[String(userId)];

  if (user) {
    user.totalCampaigns += 1;
  }

  db.statistics.totalCampaigns += 1;

  writeDatabase(db);

  return db.campaigns[campaignId];
}

function getCampaign(campaignId) {
  const db = readDatabase();
  return db.campaigns[campaignId] || null;
}

function getUserCampaigns(userId) {
  const db = readDatabase();

  return Object.values(db.campaigns).filter(
    campaign => String(campaign.userId) === String(userId)
  );
}

function updateCampaign(campaignId, updates) {
  const db = readDatabase();

  if (!db.campaigns[campaignId]) {
    return null;
  }

  db.campaigns[campaignId] = {
    ...db.campaigns[campaignId],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  writeDatabase(db);

  return db.campaigns[campaignId];
}

function deleteCampaign(campaignId) {
  const db = readDatabase();

  if (!db.campaigns[campaignId]) {
    return false;
  }

  delete db.campaigns[campaignId];

  writeDatabase(db);

  return true;
}

function getBalance(userId) {
  const user = getUser(userId);

  return user ? Number(user.balance || 0) : 0;
}

function addBalance(userId, amount) {
  const user = getUser(userId);

  if (!user) {
    return null;
  }

  const newBalance =
    Number(user.balance || 0) + Number(amount || 0);

  return updateUser(userId, {
    balance: newBalance
  });
}

function deductBalance(userId, amount) {
  const user = getUser(userId);

  if (!user) {
    return {
      success: false,
      reason: "USER_NOT_FOUND"
    };
  }

  const currentBalance = Number(user.balance || 0);
  const deduction = Number(amount || 0);

  if (deduction <= 0) {
    return {
      success: false,
      reason: "INVALID_AMOUNT"
    };
  }

  if (currentBalance < deduction) {
    return {
      success: false,
      reason: "INSUFFICIENT_BALANCE"
    };
  }

  const newBalance = currentBalance - deduction;

  updateUser(userId, {
    balance: newBalance,
    totalSpent: Number(user.totalSpent || 0) + deduction
  });

  const db = readDatabase();

  db.statistics.totalSpent =
    Number(db.statistics.totalSpent || 0) + deduction;

  writeDatabase(db);

  return {
    success: true,
    balance: newBalance
  };
}

function createTransaction(userId, transactionData) {
  const db = readDatabase();

  const transactionId =
    `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  db.transactions[transactionId] = {
    id: transactionId,
    userId: Number(userId),
    type: transactionData.type || "unknown",
    amount: Number(transactionData.amount || 0),
    status: transactionData.status || "pending",
    description: transactionData.description || "",
    createdAt: new Date().toISOString()
  };

  writeDatabase(db);

  return db.transactions[transactionId];
}

function getUserTransactions(userId) {
  const db = readDatabase();

  return Object.values(db.transactions).filter(
    transaction =>
      String(transaction.userId) === String(userId)
  );
}

function getStatistics() {
  const db = readDatabase();

  return {
    ...db.statistics,
    totalUsers: Object.keys(db.users).length,
    totalCampaigns: Object.keys(db.campaigns).length
  };
}

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
  addBalance,
  deductBalance,

  createTransaction,
  getUserTransactions,

  getStatistics
};
