const TelegramBot = require("node-telegram-bot-api");
const http = require("http");

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

// ==========================================
// HTTP SERVER FOR RENDER
// ==========================================

const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain"
  });

  res.end("Telegram Ads Manager is running.");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 HTTP server listening on port ${PORT}`);
});

// ==========================================
// BOT INITIALIZATION
// ==========================================

const bot = new TelegramBot(config.botToken, {
  polling: true
});

// ==========================================
// STATISTICS HANDLER
// ==========================================

function registerStatisticsHandler() {
  bot.on("callback_query", async query => {
    if (query.data !== "statistics") {
      return;
    }

    const chatId = query.message.chat.id;

    try {
      await bot.answerCallbackQuery(query.id);

      const stats = getStatistics();

      await bot.sendMessage(
        chatId,
        `╭━━━━━━━━━━━━━━━━━━━━╮
┃ 📈 *STATISTICS*
╰━━━━━━━━━━━━━━━━━━━━╯

👥 Total Users: *${stats.totalUsers || 0}*

📢 Total Campaigns: *${stats.totalCampaigns || 0}*

💳 Total Transactions: *${stats.totalTransactions || 0}*

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
        bot,
        query.message.chat.id,
        query.from
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
