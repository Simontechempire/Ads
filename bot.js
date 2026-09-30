const TelegramBot = require("node-telegram-bot-api");

const config = require("./config/config");
const {
  registerStartHandler,
  sendMainMenu
} = require("./handlers/start");

const {
  registerCampaignHandlers
} = require("./handlers/campaigns");

const {
  registerPaymentHandlers
} = require("./handlers/payments");

const {
  registerAdminHandlers
} = require("./handlers/admin");

const {
  getStatistics
} = require("./database/database");

const {
  createTelegramService
} = require("./services/telegram");

// ==========================================
// BOT INITIALIZATION
// ==========================================

const bot = new TelegramBot(config.botToken, {
  polling: true
});

const telegram = createTelegramService(bot);

// ==========================================
// OWNER CHECK
// ==========================================

function isOwner(userId) {
  return String(userId) === String(config.ownerId);
}

// ==========================================
// STATISTICS HANDLER
// ==========================================

function registerStatisticsHandler() {
  bot.on("callback_query", async query => {
    if (query.data !== "statistics") {
      return;
    }

    const chatId = query.message.chat.id;
    const userId = query.from.id;

    try {
      await bot.answerCallbackQuery(query.id);

      const stats = getStatistics();

      await bot.sendMessage(
        chatId,
        `╭━━━━━━━━━━━━━━━━━━━━╮
┃  📈 *STATISTICS*
╰━━━━━━━━━━━━━━━━━━━━╯

👥 Total Users: *${stats.totalUsers}*

📢 Total Campaigns: *${stats.totalCampaigns}*

💳 Total Transactions: *${stats.totalTransactions}*

💰 Total Spent: *${Number(
          stats.totalSpent || 0
        ).toLocaleString()} ${config.currency}*

💵 Total Revenue: *${Number(
          stats.totalRevenue || 0
        ).toLocaleString()} ${config.currency}*`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔙 Main Menu",
                  callback_data: "main_menu"
                }
              ]
            ]
          }
        }
      );
    } catch (error) {
      console.error(
        "❌ Statistics error:",
        error.message
      );

      await bot.sendMessage(
        chatId,
        "❌ Unable to load statistics."
      );
    }
  });
}

// ==========================================
// MAIN MENU HANDLER
// ==========================================

function registerMainMenuHandler() {
  bot.on("callback_query", async query => {
    if (query.data !== "main_menu") {
      return;
    }

    try {
      await bot.answerCallbackQuery(query.id);

      await sendMainMenu(
        query.message.chat.id,
        query.from.id
      );
    } catch (error) {
      console.error(
        "❌ Main menu error:",
        error.message
      );
    }
  });
}

// ==========================================
// REGISTER ALL HANDLERS
// ==========================================

registerStartHandler(bot);
registerCampaignHandlers(bot);
registerPaymentHandlers(bot);
registerAdminHandlers(bot);

registerStatisticsHandler();
registerMainMenuHandler();

// ==========================================
// POLLING ERROR
// ==========================================

bot.on("polling_error", error => {
  console.error(
    "❌ Telegram polling error:",
    error.message
  );
});

// ==========================================
// GENERAL ERROR HANDLING
// ==========================================

process.on("unhandledRejection", error => {
  console.error(
    "❌ Unhandled promise rejection:",
    error
  );
});

process.on("uncaughtException", error => {
  console.error(
    "❌ Uncaught exception:",
    error
  );
});

// ==========================================
// STARTUP
// ==========================================

console.log("======================================");
console.log("📢 TELEGRAM ADS MANAGER v2.0.0");
console.log("🤖 Bot is starting...");
console.log(
  "🔐 Force Join:",
  config.forceJoinEnabled ? "ON" : "OFF"
);
console.log(
  "👑 Owner:",
  config.ownerId || "NOT SET"
);
console.log(
  "📢 Force-Join Channels:",
  config.forceJoinChannels.length
);
console.log(
  "🌍 Environment:",
  config.environment
);
console.log("======================================");
