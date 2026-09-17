// backend/routes/adminRoutes.js
import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  updateUserRole,
  getUserActionHistory,
  getPosts,
  updatePostStatus,
  deletePost
} from '../controllers/adminController.js';

const router = express.Router();

// All routes require system_admin role
router.use(protect, authorizeRoles('system_admin'));

// Dashboard
router.get('/stats', getDashboardStats);

// User Management
router.get('/users',               getUsers);
router.patch('/users/:id/status',  updateUserStatus);
router.patch('/users/:id/role',    updateUserRole);
router.get('/users/:id/history',   getUserActionHistory);

// Post Management
router.get('/posts',               getPosts);
router.patch('/posts/:id/status',  updatePostStatus);
router.delete('/posts/:id',        deletePost);

export default router;
