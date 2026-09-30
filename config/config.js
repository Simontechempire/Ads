require("dotenv").config();

const config = {
  botToken: process.env.BOT_TOKEN || "",

  ownerId: String(process.env.OWNER_ID || ""),

  forceJoinEnabled:
    String(process.env.FORCE_JOIN_ENABLED || "false").toLowerCase() === "true",

  forceJoinChannels: [
    process.env.FORCE_JOIN_CHANNEL_1,
    process.env.FORCE_JOIN_CHANNEL_2,
    process.env.FORCE_JOIN_CHANNEL_3,
    process.env.FORCE_JOIN_CHANNEL_4,
    process.env.FORCE_JOIN_CHANNEL_5
  ]
    .filter(Boolean)
    .filter(channel => !channel.includes("REPLACE_WITH_CHANNEL")),

  botName: process.env.BOT_NAME || "Telegram Ads Manager",

  currency: process.env.CURRENCY || "NGN",

  adminUsername:
    process.env.ADMIN_USERNAME || "",

  environment:
    process.env.NODE_ENV || "production"
};

if (!config.botToken) {
  console.error("❌ BOT_TOKEN is missing in .env");
  process.exit(1);
}

module.exports = config;
