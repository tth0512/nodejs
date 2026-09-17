// frontend/src/api/adminApi.js
import axiosClient from './axiosClient';

export const adminApi = {
  // Dashboard
  getDashboardStats: () =>
    axiosClient.get('/admin/stats'),

  // Users
  getUsers: (params) =>
    axiosClient.get('/admin/users', { params }),
  updateUserStatus: (id, status) =>
    axiosClient.patch(`/admin/users/${id}/status`, { status }),
  updateUserRole: (id, role) =>
    axiosClient.patch(`/admin/users/${id}/role`, { role }),
  getUserActionHistory: (id) =>
    axiosClient.get(`/admin/users/${id}/history`),

  // Posts
  getPosts: (params) =>
    axiosClient.get('/admin/posts', { params }),
  updatePostStatus: (id, status) =>
    axiosClient.patch(`/admin/posts/${id}/status`, { status }),
  deletePost: (id) =>
    axiosClient.delete(`/admin/posts/${id}`),
};

export default adminApi;
