import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors'; // 1. Import cors
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 2. Sử dụng CORS Middleware (Cho phép mọi frontend gọi vào)
app.use(cors());

// Middleware đọc JSON body
app.use(express.json());

// Khai báo Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Đã kết nối MongoDB thành công!');
    app.listen(PORT, () => console.log(`🚀 Server chạy tại port ${PORT}`));
  })
  .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err.message));