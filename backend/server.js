import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors'; // 1. Import cors
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 2. Sử dụng CORS Middleware (Cho phép mọi frontend gọi vào)
app.use(cors({
  origin: 'http://localhost:5173', // Bắt buộc phải ghi rõ URL của frontend
  credentials: true
}));

// Middleware đọc JSON body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Khai báo Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Đã kết nối MongoDB thành công!');
    app.listen(PORT, () => console.log(`🚀 Server chạy tại port ${PORT}`));
  })
  .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err.message));