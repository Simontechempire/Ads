const config = require("../config/config");
const {
  getUser,
  createUser,
  getBalance,
  getUserTransactions
} = require("../database/database");

function formatMoney(amount) {
  return `${config.currency} ${Number(amount || 0).toLocaleString()}`;
}

function registerPaymentHandlers(bot) {
  bot.on("callback_query", async query => {
    const data = query.data;

    if (
      data !== "wallet" &&
      data !== "payment_wallet" &&
      data !== "transactions"
    ) {
      return;
    }

    const chatId = query.message.chat.id;
    const userId = query.from.id;

    try {
      let user = getUser(userId);

      if (!user) {
        user = createUser({
          id: userId,
          username: query.from.username || "",
          firstName: query.from.first_name || "",
          lastName: query.from.last_name || ""
        });
      }

      await bot.answerCallbackQuery(query.id);

      if (data === "transactions") {
        return showTransactions(bot, chatId, userId);
      }

      const balance = getBalance(userId);

      await bot.sendMessage(
        chatId,
        `╭━━━━━━━━━━━━━━━━━━━━╮
┃  💰 *WALLET*
╰━━━━━━━━━━━━━━━━━━━━╯

💵 *Balance:* ${formatMoney(balance)}

Choose an option below:`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "💳 Add Funds",
                  callback_data: "add_funds"
                }
              ],
              [
                {
                  text: "📜 Transactions",
                  callback_data: "transactions"
                }
              ],
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
        "❌ Wallet handler error:",
        error.message
      );

      await bot.sendMessage(
        chatId,
        "❌ Unable to load your wallet right now."
      );
    }
  });

  bot.on("callback_query", async query => {
    if (query.data !== "add_funds") {
      return;
    }

    await bot.answerCallbackQuery(query.id);

    await bot.sendMessage(
      query.message.chat.id,
      `💳 *Add Funds*\n\n` +
      `Payment processing is not connected yet.\n\n` +
      `Once the payment service is configured, you will be able to fund your wallet here.`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "💰 Back to Wallet",
                callback_data: "wallet"
              }
            ]
          ]
        }
      }
    );
  });
}

async function showTransactions(bot, chatId, userId) {
  const transactions = getUserTransactions(userId);

  if (!transactions.length) {
    await bot.sendMessage(
      chatId,
      "📜 *Transactions*\n\nNo transactions found yet.",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔙 Wallet",
                callback_data: "wallet"
              }
            ]
          ]
        }
      }
    );

    return;
  }

  let text = "📜 *Transaction History*\n\n";

  transactions
    .slice(-20)
    .reverse()
    .forEach((transaction, index) => {
      text +=
        `*${index + 1}. ${transaction.type}*\n` +
        `🆔 ${transaction.id}\n` +
        `💰 ${formatMoney(transaction.amount)}\n` +
        `📌 ${transaction.status}\n` +
        `📅 ${new Date(transaction.createdAt).toLocaleString()}\n\n`;
    });

  await bot.sendMessage(
    chatId,
    text,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔙 Wallet",
              callback_data: "wallet"
            }
          ]
        ]
      }
    }
  );
}

module.exports = {
  registerPaymentHandlers,
  showTransactions
};
