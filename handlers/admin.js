const config = require("../config/config");
const {
  readDatabase,
  writeDatabase,
  getStatistics,
  getUser
} = require("../database/database");

function isOwner(userId) {
  return String(userId) === String(config.ownerId);
}

function ownerKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "📊 Statistics",
          callback_data: "admin_statistics"
        }
      ],
      [
        {
          text: "📢 Campaigns",
          callback_data: "admin_campaigns"
        },
        {
          text: "👥 Users",
          callback_data: "admin_users"
        }
      ],
      [
        {
          text: "🔙 Main Menu",
          callback_data: "main_menu"
        }
      ]
    ]
  };
}

function registerAdminHandlers(bot) {
  bot.on("callback_query", async query => {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const data = query.data;

    if (
      ![
        "owner_panel",
        "manage_access",
        "manage_campaigns",
        "admin_statistics",
        "admin_campaigns",
        "admin_users"
      ].includes(data)
    ) {
      return;
    }

    if (!isOwner(userId)) {
      await bot.answerCallbackQuery(query.id, {
        text: "❌ Owner access only.",
        show_alert: true
      });

      return;
    }

    try {
      await bot.answerCallbackQuery(query.id);

      if (data === "owner_panel") {
        await bot.sendMessage(
          chatId,
          `╭━━━━━━━━━━━━━━━━━━━━╮
┃  👑 *OWNER PANEL*
╰━━━━━━━━━━━━━━━━━━━━╯

Welcome to the administrator panel.

Select an option below:`,
          {
            parse_mode: "Markdown",
            reply_markup: ownerKeyboard()
          }
        );

        return;
      }

      if (
        data === "admin_statistics" ||
        data === "manage_access"
      ) {
        const stats = getStatistics();

        await bot.sendMessage(
          chatId,
          `📊 *Bot Statistics*\n\n` +
          `👥 Users: *${stats.totalUsers}*\n` +
          `📢 Campaigns: *${stats.totalCampaigns}*\n` +
          `💳 Transactions: *${stats.totalTransactions}*\n` +
          `💰 Total Spent: *${stats.totalSpent}*\n` +
          `💵 Total Revenue: *${stats.totalRevenue}*`,
          {
            parse_mode: "Markdown",
            reply_markup: ownerKeyboard()
          }
        );

        return;
      }

      if (
        data === "admin_campaigns" ||
        data === "manage_campaigns"
      ) {
        const db = readDatabase();
        const campaigns = Object.values(db.campaigns);

        if (!campaigns.length) {
          await bot.sendMessage(
            chatId,
            "📢 *Campaign Management*\n\nNo campaigns have been created yet.",
            {
              parse_mode: "Markdown",
              reply_markup: ownerKeyboard()
            }
          );

          return;
        }

        let text = "📢 *Campaign Management*\n\n";

        campaigns.slice(-20).reverse().forEach((campaign, index) => {
          text +=
            `*${index + 1}. ${campaign.title}*\n` +
            `🆔 ${campaign.id}\n` +
            `👤 User: ${campaign.userId}\n` +
            `💰 Budget: ${campaign.budget}\n` +
            `📌 Status: ${campaign.status}\n\n`;
        });

        await bot.sendMessage(
          chatId,
          text,
          {
            parse_mode: "Markdown",
            reply_markup: ownerKeyboard()
          }
        );

        return;
      }

      if (data === "admin_users") {
        const db = readDatabase();
        const users = Object.values(db.users);

        if (!users.length) {
          await bot.sendMessage(
            chatId,
            "👥 No users registered yet.",
            {
              reply_markup: ownerKeyboard()
            }
          );

          return;
        }

        let text = "👥 *Registered Users*\n\n";

        users.slice(-20).reverse().forEach((user, index) => {
          text +=
            `*${index + 1}. ${user.firstName || "User"}*\n` +
            `🆔 ${user.id}\n` +
            `👤 @${user.username || "no_username"}\n` +
            `💰 Balance: ${user.balance || 0}\n\n`;
        });

        await bot.sendMessage(
          chatId,
          text,
          {
            parse_mode: "Markdown",
            reply_markup: ownerKeyboard()
          }
        );
      }
    } catch (error) {
      console.error(
        "❌ Admin handler error:",
        error.message
      );

      await bot.sendMessage(
        chatId,
        "❌ An administrator operation failed."
      );
    }
  });
}

module.exports = {
  registerAdminHandlers,
  isOwner
};
