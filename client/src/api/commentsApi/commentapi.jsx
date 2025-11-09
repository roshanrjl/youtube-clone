import apiClient from "../ApiClient/ApiClinet";

// Fetch comments for a video (supports optional pagination)
export const getVideoComments = (videoId, { page = 1, limit = 10 } = {}) => {
  return apiClient.get(`comment/${videoId}`, { params: { page, limit } });
};

// Add a new comment to a video
export const addComment = (videoId, comment) => {
  return apiClient.post(`comment/${videoId}`, { comment });
};

export const updateComment = (commentId, comment) => {
  return apiClient.patch(`comment/${commentId}`, { comment });
};

export const deleteComment = (commentId) => {
  return apiClient.delete(`comment/${commentId}`);
};
