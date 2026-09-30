const config = require("../config/config");
const {
  getUser,
  createUser
} = require("../database/database");

function isUserMember(bot, userId, channel) {
  return bot
    .getChatMember(channel, userId)
    .then(member => {
      return ["creator", "administrator", "member"].includes(member.status);
    })
    .catch(() => false);
}

async function checkForceJoin(bot, userId) {
  if (!config.forceJoinEnabled) {
    return true;
  }

  const channels = config.forceJoinChannels.filter(
    channel => channel && !channel.includes("REPLACE_WITH_CHANNEL")
  );

  if (!channels.length) {
    return true;
  }

  for (const channel of channels) {
    const isMember = await isUserMember(bot, userId, channel);

    if (!isMember) {
      return false;
    }
  }

  return true;
}

function buildJoinKeyboard() {
  const channels = config.forceJoinChannels.filter(
    channel => channel && !channel.includes("REPLACE_WITH_CHANNEL")
  );

  const buttons = channels.map((channel, index) => [
    {
      text: `📢 Join Channel ${index + 1}`,
      url: channel.startsWith("@")
        ? `https://t.me/${channel.slice(1)}`
        : channel
    }
  ]);

  buttons.push([
    {
      text: "✅ Check Again",
      callback_data: "check_force_join"
    }
  ]);

  return {
    inline_keyboard: buttons
  };
}

function registerStartHandler(bot) {
  bot.onText(/^\/start(?:\s+.*)?$/, async message => {
    const chatId = message.chat.id;
    const userId = message.from.id;

    try {
      let user = getUser(userId);

      if (!user) {
        user = createUser({
          id: userId,
          username: message.from.username || "",
          firstName: message.from.first_name || "",
          lastName: message.from.last_name || ""
        });
      }

      const allowed = await checkForceJoin(bot, userId);

      if (!allowed) {
        await bot.sendMessage(
          chatId,
          `🚫 *Channel Join Required*\n\n` +
          `Please join all the required channels below before using ${config.botName}.`,
          {
            parse_mode: "Markdown",
            reply_markup: buildJoinKeyboard()
          }
        );

        return;
      }

      await sendMainMenu(bot, chatId, message.from);
    } catch (error) {
      console.error("❌ /start error:", error.message);

      await bot.sendMessage(
        chatId,
        "❌ Something went wrong while starting the bot. Please try again."
      );
    }
  });

  bot.on("callback_query", async query => {
    if (query.data !== "check_force_join") {
      return;
    }

    const userId = query.from.id;
    const chatId = query.message.chat.id;

    try {
      const allowed = await checkForceJoin(bot, userId);

      if (!allowed) {
        await bot.answerCallbackQuery(query.id, {
          text: "❌ You have not joined all required channels.",
          show_alert: true
        });

        return;
      }

      await bot.answerCallbackQuery(query.id, {
        text: "✅ Membership verified!"
      });

      await sendMainMenu(bot, chatId, query.from);
    } catch (error) {
      console.error("❌ Force-join check error:", error.message);

      await bot.answerCallbackQuery(query.id, {
        text: "❌ Verification failed. Try again.",
        show_alert: true
      });
    }
  });
}

async function sendMainMenu(bot, chatId, user) {
  const owner = String(user.id) === String(config.ownerId);

  const keyboard = [
    [
      {
        text: "📢 Create Campaign",
        callback_data: "create_campaign"
      }
    ],
    [
      {
        text: "📊 My Campaigns",
        callback_data: "my_campaigns"
      },
      {
        text: "💰 Wallet",
        callback_data: "wallet"
      }
    ],
    [
      {
        text: "📈 Statistics",
        callback_data: "statistics"
      }
    ]
  ];

  if (owner) {
    keyboard.push([
      {
        text: "👑 Owner Panel",
        callback_data: "owner_panel"
      }
    ]);
  }

  await bot.sendMessage(
    chatId,
    `╭━━━━━━━━━━━━━━━━━━━━╮
┃ 🚀 *${config.botName}*
┃
┃ Welcome, *${user.first_name || "User"}*!
┃
┃ 📢 Create and manage
┃ your advertising campaigns.
╰━━━━━━━━━━━━━━━━━━━━╯`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: keyboard
      }
    }
  );
}

module.exports = {
  registerStartHandler,
  checkForceJoin,
  sendMainMenu
};
