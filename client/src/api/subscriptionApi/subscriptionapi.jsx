import apiClient from "../ApiClient/ApiClinet";

export const toggleSubscription = (channelId) => {
  return apiClient.get(`subscription/toggle/${channelId}`);
};

export const getUserChannelSubscribers = (channelId) => {
  // server route: /api/v1/subscription/user/list/:channelId
  return apiClient.get(`subscription/user/list/${channelId}`);
};

export const getSubscribedChannels = (subscriberId) => {
  return apiClient.get(`subscription/user/${subscriberId}`);
};
