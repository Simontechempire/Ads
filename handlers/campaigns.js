const {
  createCampaign,
  getCampaign,
  getUserCampaigns,
  updateCampaign,
  deleteCampaign
} = require("../database/database");

const userStates = new Map();

function clearState(userId) {
  userStates.delete(String(userId));
}

function getState(userId) {
  return userStates.get(String(userId));
}

function setState(userId, state) {
  userStates.set(String(userId), state);
}

function campaignMenu() {
  return {
    inline_keyboard: [
      [
        {
          text: "📢 Create Campaign",
          callback_data: "campaign_create"
        }
      ],
      [
        {
          text: "📊 My Campaigns",
          callback_data: "campaign_list"
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

function registerCampaignHandlers(bot) {
  // ==============================
  // CREATE CAMPAIGN
  // ==============================

  bot.on("callback_query", async query => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;

    if (query.data !== "create_campaign" &&
        query.data !== "campaign_create") {
      return;
    }

    clearState(userId);

    setState(userId, {
      step: "title",
      data: {}
    });

    await bot.answerCallbackQuery(query.id);

    await bot.sendMessage(
      chatId,
      `📢 *Create Campaign*\n\n` +
      `Step 1/4\n\n` +
      `Send the *campaign title*.\n\n` +
      `Example: New Product Promotion`,
      {
        parse_mode: "Markdown"
      }
    );
  });

  // ==============================
  // MY CAMPAIGNS
  // ==============================

  bot.on("callback_query", async query => {
    if (query.data !== "my_campaigns" &&
        query.data !== "campaign_list") {
      return;
    }

    const chatId = query.message.chat.id;
    const userId = query.from.id;

    const campaigns = getUserCampaigns(userId);

    await bot.answerCallbackQuery(query.id);

    if (!campaigns.length) {
      await bot.sendMessage(
        chatId,
        `📊 *My Campaigns*\n\n` +
        `You don't have any campaigns yet.`,
        {
          parse_mode: "Markdown",
          reply_markup: campaignMenu()
        }
      );

      return;
    }

    let text = "📊 *My Campaigns*\n\n";

    campaigns.forEach((campaign, index) => {
      text +=
        `*${index + 1}. ${campaign.title}*\n` +
        `🆔 ${campaign.id}\n` +
        `💰 Budget: ${campaign.budget}\n` +
        `📌 Status: ${campaign.status}\n\n`;
    });

    await bot.sendMessage(
      chatId,
      text,
      {
        parse_mode: "Markdown",
        reply_markup: campaignMenu()
      }
    );
  });

  // ==============================
  // CAMPAIGN CALLBACKS
  // ==============================

  bot.on("callback_query", async query => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;

    if (query.data === "campaign_cancel") {
      clearState(userId);

      await bot.answerCallbackQuery(query.id, {
        text: "Campaign creation cancelled."
      });

      await bot.sendMessage(
        chatId,
        "❌ Campaign creation cancelled.",
        {
          reply_markup: campaignMenu()
        }
      );
    }
  });

  // ==============================
  // TEXT INPUT
  // ==============================

  bot.on("message", async message => {
    if (!message.text || message.text.startsWith("/")) {
      return;
    }

    const userId = message.from.id;
    const chatId = message.chat.id;

    const state = getState(userId);

    if (!state) {
      return;
    }

    try {
      // STEP 1 — TITLE
      if (state.step === "title") {
        const title = message.text.trim();

        if (title.length < 3) {
          await bot.sendMessage(
            chatId,
            "❌ Campaign title must contain at least 3 characters."
          );
          return;
        }

        state.data.title = title;
        state.step = "description";

        setState(userId, state);

        await bot.sendMessage(
          chatId,
          `📝 *Step 2/4*\n\n` +
          `Send a short description for your campaign.`,
          {
            parse_mode: "Markdown"
          }
        );

        return;
      }

      // STEP 2 — DESCRIPTION
      if (state.step === "description") {
        state.data.description = message.text.trim();
        state.step = "url";

        setState(userId, state);

        await bot.sendMessage(
          chatId,
          `🔗 *Step 3/4*\n\n` +
          `Send the URL you want to advertise.\n\n` +
          `Example: https://example.com`,
          {
            parse_mode: "Markdown"
          }
        );

        return;
      }

      // STEP 3 — URL
      if (state.step === "url") {
        const url = message.text.trim();

        if (!/^https?:\/\/\S+$/i.test(url)) {
          await bot.sendMessage(
            chatId,
            "❌ Please send a valid URL starting with `http://` or `https://`.",
            {
              parse_mode: "Markdown"
            }
          );

          return;
        }

        state.data.targetUrl = url;
        state.step = "budget";

        setState(userId, state);

        await bot.sendMessage(
          chatId,
          `💰 *Step 4/4*\n\n` +
          `Enter your campaign budget in ${require("../config/config").currency}.\n\n` +
          `Example: 5000`,
          {
            parse_mode: "Markdown"
          }
        );

        return;
      }

      // STEP 4 — BUDGET
      if (state.step === "budget") {
        const budget = Number(message.text.trim());

        if (!Number.isFinite(budget) || budget <= 0) {
          await bot.sendMessage(
            chatId,
            "❌ Please enter a valid budget greater than 0."
          );

          return;
        }

        state.data.budget = budget;

        const campaign = createCampaign({
          userId,
          title: state.data.title,
          description: state.data.description,
          targetUrl: state.data.targetUrl,
          budget,
          status: "draft"
        });

        clearState(userId);

        await bot.sendMessage(
          chatId,
          `✅ *Campaign Created!*\n\n` +
          `📢 *Title:* ${campaign.title}\n` +
          `🆔 *ID:* ${campaign.id}\n` +
          `💰 *Budget:* ${campaign.budget}\n` +
          `📌 *Status:* ${campaign.status}\n\n` +
          `Your campaign has been saved as a draft.`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "📊 My Campaigns",
                    callback_data: "campaign_list"
                  }
                ],
                [
                  {
                    text: "📢 Create Another",
                    callback_data: "campaign_create"
                  }
                ]
              ]
            }
          }
        );
      }
    } catch (error) {
      console.error(
        "❌ Campaign handler error:",
        error.message
      );

      clearState(userId);

      await bot.sendMessage(
        chatId,
        "❌ An error occurred while processing your campaign."
      );
    }
  });
}

module.exports = {
  registerCampaignHandlers,
  getCampaign,
  updateCampaign,
  deleteCampaign
};
