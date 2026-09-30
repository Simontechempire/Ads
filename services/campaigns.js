const {
  createCampaign,
  getCampaign,
  getUserCampaigns,
  updateCampaign,
  deleteCampaign
} = require("../database/database");

const VALID_STATUSES = [
  "draft",
  "pending",
  "approved",
  "active",
  "paused",
  "completed",
  "rejected"
];

function createNewCampaign(data) {
  if (!data || !data.userId) {
    throw new Error("userId is required");
  }

  if (!data.title || data.title.trim().length < 3) {
    throw new Error("Campaign title must contain at least 3 characters");
  }

  if (!data.targetUrl) {
    throw new Error("Campaign target URL is required");
  }

  const budget = Number(data.budget);

  if (!Number.isFinite(budget) || budget <= 0) {
    throw new Error("Campaign budget must be greater than 0");
  }

  return createCampaign({
    userId: data.userId,
    title: data.title.trim(),
    description: data.description || "",
    targetUrl: data.targetUrl.trim(),
    budget,
    status: data.status || "draft"
  });
}

function findCampaign(campaignId) {
  return getCampaign(campaignId);
}

function getCampaignsForUser(userId) {
  return getUserCampaigns(userId);
}

function changeCampaignStatus(campaignId, status) {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid campaign status: ${status}`);
  }

  const campaign = getCampaign(campaignId);

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  return updateCampaign(campaignId, {
    status
  });
}

function updateCampaignDetails(campaignId, updates) {
  const campaign = getCampaign(campaignId);

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const allowedUpdates = {};

  if (updates.title !== undefined) {
    if (updates.title.trim().length < 3) {
      throw new Error(
        "Campaign title must contain at least 3 characters"
      );
    }

    allowedUpdates.title = updates.title.trim();
  }

  if (updates.description !== undefined) {
    allowedUpdates.description = updates.description.trim();
  }

  if (updates.targetUrl !== undefined) {
    allowedUpdates.targetUrl = updates.targetUrl.trim();
  }

  if (updates.budget !== undefined) {
    const budget = Number(updates.budget);

    if (!Number.isFinite(budget) || budget <= 0) {
      throw new Error("Budget must be greater than 0");
    }

    allowedUpdates.budget = budget;
  }

  return updateCampaign(campaignId, allowedUpdates);
}

function removeCampaign(campaignId) {
  const campaign = getCampaign(campaignId);

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  return deleteCampaign(campaignId);
}

function getCampaignSummary(userId) {
  const campaigns = getUserCampaigns(userId);

  const summary = {
    total: campaigns.length,
    draft: 0,
    pending: 0,
    approved: 0,
    active: 0,
    paused: 0,
    completed: 0,
    rejected: 0,
    totalBudget: 0
  };

  for (const campaign of campaigns) {
    if (summary[campaign.status] !== undefined) {
      summary[campaign.status]++;
    }

    summary.totalBudget += Number(campaign.budget || 0);
  }

  return summary;
}

module.exports = {
  VALID_STATUSES,
  createNewCampaign,
  findCampaign,
  getCampaignsForUser,
  changeCampaignStatus,
  updateCampaignDetails,
  removeCampaign,
  getCampaignSummary
};
