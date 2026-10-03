// frontend/src/api/communityApi.js
import axiosClient from './axiosClient';

// 1. Lấy danh sách tất cả cộng đồng (hỗ trợ search)
export const getCommunities = async (params = {}) => {
  const res = await axiosClient.get('/communities', { params });
  return res.data;
};

// 2. Lấy thông tin chi tiết cộng đồng & bài viết
export const getCommunityById = async (communityId) => {
  const res = await axiosClient.get(`/communities/${communityId}`);
  return res.data;
};

// 3. Lấy danh sách thành viên (Admin/Owner trước, sau đó A-Z)
export const getCommunityMembers = async (communityId, params = {}) => {
  const res = await axiosClient.get(`/communities/${communityId}/members`, { params });
  return res.data;
};

// 4. Tạo cộng đồng mới
export const createCommunity = async (formData) => {
  const res = await axiosClient.post('/communities/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

// 5. Tham gia cộng đồng
export const joinCommunity = async (communityId) => {
  const res = await axiosClient.post(`/communities/${communityId}/join`);
  return res.data;
};

// 6. Rời khỏi cộng đồng
export const leaveCommunity = async (communityId) => {
  const res = await axiosClient.post(`/communities/${communityId}/leave`);
  return res.data;
};

// 7. Đăng bài viết vào cộng đồng
export const createCommunityPost = async (communityId, formData) => {
  const res = await axiosClient.post(`/communities/${communityId}/posts`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

// 8. Lấy danh sách cộng đồng của tôi
export const getUserCommunities = async () => {
  const res = await axiosClient.get('/communities/my-communities');
  return res.data;
};
