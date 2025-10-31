import apiClient from "../ApiClient/ApiClinet";


export const createTweet = (text) => {
  return apiClient.post("tweet/",text);
};

export const getUserTweets = () => {
  return apiClient.get("tweet/user");
};

export const updateTweet = (tweetId) => {
  return apiClient.patch(`tweet/${tweetId}`);
};

export const deleteTweet = (tweetId) => {
  return apiClient.delete(`tweet/${tweetId}`);
};
