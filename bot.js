
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
// VALIDATION
// ==========================================

if (!config.botToken) {
  console.error("❌ BOT_TOKEN is missing.");
  process.exit(1);
}

// ==========================================
// RENDER HTTP HEALTH SERVER
// ==========================================

const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(
      JSON.stringify({
        status: "online",
        bot: config.botName,
        environment: config.environment
      })
    );

    return;
  }

  res.writeHead(404, {
    "Content-Type": "application/json"
  });

  res.end(
    JSON.stringify({
      error: "Not found"
    })
  );
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 HTTP server listening on port ${PORT}`);
});

// ==========================================
// TELEGRAM BOT
// ==========================================

const bot = new TelegramBot(config.botToken, {
  polling: true
});

// ==========================================
// STATISTICS
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

      const totalUsers = stats.totalUsers || 0;
      const totalCampaigns = stats.totalCampaigns || 0;
      const totalTransactions = stats.totalTransactions || 0;
      const totalSpent = Number(stats.totalSpent || 0);
      const totalRevenue = Number(stats.totalRevenue || 0);

      await bot.sendMessage(
        chatId,
        `╭━━━━━━━━━━━━━━━━━━━━╮
┃ 📈 *STATISTICS*
╰━━━━━━━━━━━━━━━━━━━━╯

👥 Total Users: *${totalUsers}*

📢 Total Campaigns: *${totalCampaigns}*

💳 Total Transactions: *${totalTransactions}*

💰 Total Spent: *${totalSpent.toLocaleString()} ${config.currency}*

💵 Total Revenue: *${totalRevenue.toLocaleString()} ${config.currency}*`,
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

      try {
        await bot.sendMessage(
          chatId,
          "❌ Unable to load statistics."
        );
      } catch {}
    }
  });
}

// ==========================================
// MAIN MENU
// ==========================================

function registerMainMenuHandler() {
  bot.on("callback_query", async query => {
    if (query.data !== "main_menu") {
      return;
    }

    const chatId = query.message.chat.id;

    try {
      await bot.answerCallbackQuery(query.id);

      await sendMainMenu(
        bot,
        chatId,
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
// REGISTER HANDLERS
// ==========================================

try {
  registerStartHandler(bot);
  registerCampaignHandlers(bot);
  registerPaymentHandlers(bot);
  registerAdminHandlers(bot);

  registerStatisticsHandler();
  registerMainMenuHandler();

  console.log("✅ All handlers registered.");
} catch (error) {
  console.error(
    "❌ Handler registration failed:",
    error
  );

  process.exit(1);
}

// ==========================================
// TELEGRAM POLLING ERRORS
// ==========================================

bot.on("polling_error", error => {
  console.error(
    "❌ Telegram polling error:",
    error.message
  );
});

// ==========================================
// PROCESS ERRORS
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
// SHUTDOWN
// ==========================================

function shutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Shutting down...`);

  try {
    bot.stopPolling();
  } catch (error) {
    console.error(
      "❌ Error stopping Telegram polling:",
      error.message
    );
  }

  server.close(() => {
    console.log("✅ HTTP server closed.");
    process.exit(0);
  });

  setTimeout(() => {
    process.exit(0);
  }, 5000);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ==========================================
// STARTUP
// ==========================================

console.log("======================================");
console.log("📢 TELEGRAM ADS MANAGER v2.0.0");
console.log("🤖 Bot starting...");
console.log(
  `🔐 Force Join: ${
    config.forceJoinEnabled ? "ON" : "OFF"
  }`
);
console.log(
  `👑 Owner: ${config.ownerId || "NOT SET"}`
);
console.log(
  `📢 Force-Join Channels: ${
    config.forceJoinChannels.length
  }`
);
console.log(
  `💰 Currency: ${config.currency}`
);
console.log(
  `🌍 Environment: ${config.environment}`
);
console.log("======================================");
