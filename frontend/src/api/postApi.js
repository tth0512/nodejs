// frontend/src/api/postApi.js
import axiosClient from './axiosClient';

// ── Like APIs ─────────────────────────────────────────────────────────────
export const togglePostLike = async (postId) => {
  const res = await axiosClient.post(`/posts/${postId}/like`);
  return res.data;
};

export const toggleCommentLike = async (postId, commentId) => {
  const res = await axiosClient.post(`/posts/${postId}/comments/${commentId}/like`);
  return res.data;
};

// ── Comment APIs ──────────────────────────────────────────────────────────
export const getComments = async (postId, { page = 1, limit = 5 } = {}) => {
  const res = await axiosClient.get(`/posts/${postId}/comments`, {
    params: { page, limit }
  });
  return res.data;
};

export const createComment = async (postId, content) => {
  const res = await axiosClient.post(`/posts/${postId}/comments`, { content });
  return res.data;
};

export const replyComment = async (postId, commentId, content) => {
  const res = await axiosClient.post(`/posts/${postId}/comments/${commentId}/reply`, { content });
  return res.data;
};

export const getReplies = async (postId, commentId) => {
  const res = await axiosClient.get(`/posts/${postId}/comments/${commentId}/replies`);
  return res.data;
};

export const deleteComment = async (postId, commentId) => {
  const res = await axiosClient.delete(`/posts/${postId}/comments/${commentId}`);
  return res.data;
};
