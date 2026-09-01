import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server with Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// CORS Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Middleware đọc JSON body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Khai báo Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Đã kết nối MongoDB thành công!');
    httpServer.listen(PORT, () => console.log(`🚀 Server chạy tại port ${PORT}`));
  })
  .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err.message));