const config = require("../config/config");

function createTelegramService(bot) {
  return {
    async sendMessage(chatId, text, options = {}) {
      return bot.sendMessage(chatId, text, options);
    },

    async editMessage(chatId, messageId, text, options = {}) {
      return bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        ...options
      });
    },

    async deleteMessage(chatId, messageId) {
      return bot.deleteMessage(chatId, messageId);
    },

    async answerCallback(queryId, options = {}) {
      return bot.answerCallbackQuery(queryId, options);
    },

    async getChatMember(chatId, userId) {
      return bot.getChatMember(chatId, userId);
    },

    async getChat(chatId) {
      return bot.getChat(chatId);
    },

    async getMe() {
      return bot.getMe();
    },

    async sendPhoto(chatId, photo, options = {}) {
      return bot.sendPhoto(chatId, photo, options);
    },

    async sendDocument(chatId, document, options = {}) {
      return bot.sendDocument(chatId, document, options);
    },

    async sendNotification(chatId, text) {
      return bot.sendMessage(chatId, `🔔 ${text}`);
    }
  };
}

function getBotConfig() {
  return {
    name: config.botName,
    ownerId: config.ownerId,
    forceJoinEnabled: config.forceJoinEnabled,
    forceJoinChannels: config.forceJoinChannels
  };
}

module.exports = {
  createTelegramService,
  getBotConfig
};
