const database = require("./database");

/**
 * Create a new advertising campaign.
 */
function createCampaign(userId, title, content, budget = 0) {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  if (!title || !title.trim()) {
    throw new Error("Campaign title is required.");
  }

  if (!content || !content.trim()) {
    throw new Error("Campaign content is required.");
  }

  const numericBudget = Number(budget);

  if (!Number.isFinite(numericBudget) || numericBudget < 0) {
    throw new Error("Campaign budget must be a valid positive number.");
  }

  return database.createCampaign(userId, {
    title: title.trim(),
    content: content.trim(),
    budget: numericBudget,
    status: "draft"
  });
}

/**
 * Get one campaign.
 */
function getCampaign(campaignId) {
  if (!campaignId) {
    return null;
  }

  return database.getCampaign(campaignId);
}

/**
 * Get all campaigns belonging to a user.
 */
function getUserCampaigns(userId) {
  if (!userId) {
    return [];
  }

  return database.getUserCampaigns(userId);
}

/**
 * Update an existing campaign.
 */
function updateCampaign(campaignId, updates = {}) {
  const campaign = database.getCampaign(campaignId);

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  const allowedUpdates = {};

  if (typeof updates.title === "string") {
    const title = updates.title.trim();

    if (title) {
      allowedUpdates.title = title;
    }
  }

  if (typeof updates.content === "string") {
    const content = updates.content.trim();

    if (content) {
      allowedUpdates.content = content;
    }
  }

  if (updates.status) {
    const allowedStatuses = [
      "draft",
      "pending",
      "approved",
      "active",
      "paused",
      "completed",
      "rejected"
    ];

    if (!allowedStatuses.includes(updates.status)) {
      throw new Error("Invalid campaign status.");
    }

    allowedUpdates.status = updates.status;
  }

  if (updates.budget !== undefined) {
    const budget = Number(updates.budget);

    if (!Number.isFinite(budget) || budget < 0) {
      throw new Error("Invalid campaign budget.");
    }

    allowedUpdates.budget = budget;
  }

  if (updates.spent !== undefined) {
    const spent = Number(updates.spent);

    if (!Number.isFinite(spent) || spent < 0) {
      throw new Error("Invalid campaign spending amount.");
    }

    allowedUpdates.spent = spent;
  }

  return database.updateCampaign(
    campaignId,
    allowedUpdates
  );
}

/**
 * Delete a campaign.
 */
function deleteCampaign(campaignId) {
  const campaign = database.getCampaign(campaignId);

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  return database.deleteCampaign(campaignId);
}

/**
 * Change campaign status.
 */
function setCampaignStatus(campaignId, status) {
  const allowedStatuses = [
    "draft",
    "pending",
    "approved",
    "active",
    "paused",
    "completed",
    "rejected"
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid campaign status.");
  }

  return database.updateCampaign(campaignId, {
    status
  });
}

/**
 * Approve a campaign.
 */
function approveCampaign(campaignId) {
  return setCampaignStatus(
    campaignId,
    "approved"
  );
}

/**
 * Reject a campaign.
 */
function rejectCampaign(campaignId) {
  return setCampaignStatus(
    campaignId,
    "rejected"
  );
}

/**
 * Activate an approved campaign.
 */
function activateCampaign(campaignId) {
  const campaign = database.getCampaign(campaignId);

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  if (campaign.status !== "approved") {
    throw new Error(
      "Only approved campaigns can be activated."
    );
  }

  return setCampaignStatus(
    campaignId,
    "active"
  );
}

/**
 * Pause an active campaign.
 */
function pauseCampaign(campaignId) {
  const campaign = database.getCampaign(campaignId);

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  if (campaign.status !== "active") {
    throw new Error(
      "Only active campaigns can be paused."
    );
  }

  return setCampaignStatus(
    campaignId,
    "paused"
  );
}

/**
 * Complete a campaign.
 */
function completeCampaign(campaignId) {
  return setCampaignStatus(
    campaignId,
    "completed"
  );
}

/**
 * Get a simple campaign summary.
 */
function getCampaignSummary(userId) {
  const campaigns = getUserCampaigns(userId);

  return {
    total: campaigns.length,
    drafts: campaigns.filter(
      c => c.status === "draft"
    ).length,
    pending: campaigns.filter(
      c => c.status === "pending"
    ).length,
    approved: campaigns.filter(
      c => c.status === "approved"
    ).length,
    active: campaigns.filter(
      c => c.status === "active"
    ).length,
    paused: campaigns.filter(
      c => c.status === "paused"
    ).length,
    completed: campaigns.filter(
      c => c.status === "completed"
    ).length,
    rejected: campaigns.filter(
      c => c.status === "rejected"
    ).length
  };
}

module.exports = {
  createCampaign,
  getCampaign,
  getUserCampaigns,
  updateCampaign,
  deleteCampaign,
  setCampaignStatus,
  approveCampaign,
  rejectCampaign,
  activateCampaign,
  pauseCampaign,
  completeCampaign,
  getCampaignSummary
};
