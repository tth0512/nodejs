// frontend/src/api/followApi.js
import axiosClient from './axiosClient.js';

// Follow or send follow request
export const followUser = (targetId) => axiosClient.post(`/follow/${targetId}`);

// Unfollow (also cancels pending request)
export const unfollowUser = (targetId) => axiosClient.delete(`/follow/${targetId}`);

// Get follow status between current user and target
export const getFollowStatus = (userId) => axiosClient.get(`/follow/${userId}/status`);

// Followers / Following lists
export const getFollowers = (userId) => axiosClient.get(`/follow/${userId}/followers`);
export const getFollowing = (userId) => axiosClient.get(`/follow/${userId}/following`);

// Follow requests (private accounts)
export const getFollowRequests = () => axiosClient.get('/follow/requests/list');
export const acceptFollowRequest = (requesterId) => axiosClient.post(`/follow/requests/${requesterId}/accept`);
export const rejectFollowRequest = (requesterId) => axiosClient.delete(`/follow/requests/${requesterId}/reject`);

// Block / Unblock
export const blockUser = (targetId) => axiosClient.post(`/block/${targetId}`);
export const unblockUser = (targetId) => axiosClient.delete(`/block/${targetId}`);
export const getBlockedUsers = () => axiosClient.get('/block/list');

// Notifications
export const getNotifications = () => axiosClient.get('/notifications');
export const markNotificationRead = (id) => axiosClient.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => axiosClient.put('/notifications/read-all');
