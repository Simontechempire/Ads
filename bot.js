require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;

if (!token || token === "PASTE_YOUR_BOTFATHER_TOKEN_HERE") {
  console.error("❌ BOT_TOKEN is missing in .env");
  process.exit(1);
}

const bot = new TelegramBot(token, {
  polling: true
});

const OWNER_ID = String(process.env.OWNER_ID || "");

const forceJoinChannels = [
  process.env.FORCE_JOIN_CHANNEL_1,
  process.env.FORCE_JOIN_CHANNEL_2,
  process.env.FORCE_JOIN_CHANNEL_3,
  process.env.FORCE_JOIN_CHANNEL_4,
  process.env.FORCE_JOIN_CHANNEL_5
].filter(Boolean);

const forceJoinEnabled =
  String(process.env.FORCE_JOIN_ENABLED).toLowerCase() === "true";

function isOwner(userId) {
  return String(userId) === OWNER_ID;
}

async function isMember(userId, channel) {
  try {
    const member = await bot.getChatMember(channel, userId);

    return ["creator", "administrator", "member"].includes(member.status);
  } catch (error) {
    console.error(`Force-join check failed for ${channel}:`, error.message);
    return false;
  }
}

async function checkForceJoin(userId) {
  if (!forceJoinEnabled || forceJoinChannels.length === 0) {
    return true;
  }

  for (const channel of forceJoinChannels) {
    if (channel.startsWith("@REPLACE_")) {
      continue;
    }

    const joined = await isMember(userId, channel);

    if (!joined) {
      return false;
    }
  }

  return true;
}

function joinKeyboard() {
  const buttons = forceJoinChannels
    .filter(channel => !channel.startsWith("@REPLACE_"))
    .map(channel => [
      {
        text: `📢 Join ${channel}`,
        url: `https://t.me/${channel.replace("@", "")}`
      }
    ]);

  buttons.push([
    {
      text: "🔄 Check Again",
      callback_data: "check_force_join"
    }
  ]);

  return {
    inline_keyboard: buttons
  };
}

function mainMenu(userId) {
  const keyboard = [
    [
      { text: "📢 Create Campaign", callback_data: "create_campaign" },
      { text: "📊 My Campaigns", callback_data: "my_campaigns" }
    ],
    [
      { text: "💰 Wallet", callback_data: "wallet" },
      { text: "📈 Statistics", callback_data: "statistics" }
    ]
  ];

  if (isOwner(userId)) {
    keyboard.push([
      { text: "👑 Owner Panel", callback_data: "owner_panel" }
    ]);
  }

  return {
    inline_keyboard: keyboard
  };
}

async function sendMainMenu(chatId, userId) {
  await bot.sendMessage(
    chatId,
    "📢 *Telegram Ads Manager*\n\nChoose an option below:",
    {
      parse_mode: "Markdown",
      reply_markup: mainMenu(userId)
    }
  );
}

async function handleStart(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isOwner(userId)) {
    const allowed = await checkForceJoin(userId);

    if (!allowed) {
      await bot.sendMessage(
        chatId,
        "🔒 *Access Required*\n\nPlease join all required channels, then press *Check Again*.",
        {
          parse_mode: "Markdown",
          reply_markup: joinKeyboard()
        }
      );

      return;
    }
  }

  await sendMainMenu(chatId, userId);
}

bot.onText(/^\/start$/, handleStart);

bot.on("callback_query", async query => {
  const userId = query.from.id;
  const chatId = query.message.chat.id;
  const data = query.data;

  try {
    if (data === "check_force_join") {
      const allowed = isOwner(userId) || await checkForceJoin(userId);

      await bot.answerCallbackQuery(query.id);

      if (allowed) {
        await bot.sendMessage(
          chatId,
          "✅ Membership verified."
        );

        await sendMainMenu(chatId, userId);
      } else {
        await bot.sendMessage(
          chatId,
          "❌ You still need to join all required channels.",
          {
            reply_markup: joinKeyboard()
          }
        );
      }

      return;
    }

    if (data === "owner_panel") {
      if (!isOwner(userId)) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔ Owner access only.",
          show_alert: true
        });
        return;
      }

      await bot.answerCallbackQuery(query.id);

      await bot.sendMessage(
        chatId,
        "👑 *Owner Panel*\n\nOwner access is free.",
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "👥 Manage Access",
                  callback_data: "manage_access"
                }
              ],
              [
                {
                  text: "📢 Manage Campaigns",
                  callback_data: "manage_campaigns"
                }
              ]
            ]
          }
        }
      );

      return;
    }

    if (data === "create_campaign") {
      await bot.answerCallbackQuery(query.id);

      await bot.sendMessage(
        chatId,
        "📢 *Create Campaign*\n\nCampaign creation will be connected to the real advertising workflow in the next module.",
        {
          parse_mode: "Markdown"
        }
      );

      return;
    }

    if (data === "my_campaigns") {
      await bot.answerCallbackQuery(query.id);

      await bot.sendMessage(
        chatId,
        "📊 You currently have no campaigns."
      );

      return;
    }

    if (data === "wallet") {
      await bot.answerCallbackQuery(query.id);

      await bot.sendMessage(
        chatId,
        "💰 Wallet module coming next."
      );

      return;
    }

    if (data === "statistics") {
      await bot.answerCallbackQuery(query.id);

      await bot.sendMessage(
        chatId,
        "📈 Statistics module coming next."
      );

      return;
    }

    if (data === "manage_access") {
      if (!isOwner(userId)) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔ Owner access only.",
          show_alert: true
        });
        return;
      }

      await bot.answerCallbackQuery(query.id);

      await bot.sendMessage(
        chatId,
        "👥 *Manage Access*\n\nUser access management will be added in the access-control module.",
        {
          parse_mode: "Markdown"
        }
      );

      return;
    }

    if (data === "manage_campaigns") {
      if (!isOwner(userId)) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔ Owner access only.",
          show_alert: true
        });
        return;
      }

      await bot.answerCallbackQuery(query.id);

      await bot.sendMessage(
        chatId,
        "📢 *Campaign Management*\n\nCampaign administration will be added next.",
        {
          parse_mode: "Markdown"
        }
      );

      return;
    }

    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error("Callback error:", error);

    try {
      await bot.answerCallbackQuery(query.id, {
        text: "Something went wrong.",
        show_alert: true
      });
    } catch {}
  }
});

bot.on("polling_error", error => {
  console.error("Telegram polling error:", error.message);
});

console.log("======================================");
console.log("📢 TELEGRAM ADS MANAGER v2.0.0");
console.log("🤖 Bot is starting...");
console.log("🔐 Force Join:", forceJoinEnabled ? "ON" : "OFF");
console.log("👑 Owner:", OWNER_ID || "NOT SET");
console.log("======================================");
