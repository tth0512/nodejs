import { parseCookie } from 'cookie';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const setupSocket = (io) => {
  try {

    // Middleware for Auth via HttpOnly cookie
    io.use((socket, next) => {
      try {
        const cookies = parseCookie(socket.request.headers.cookie || '');
        const token = cookies.token;
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded; // Attach user to socket
        next();
      } catch (err) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    io.on('connection', (socket) => {
      console.log(`✅ User connected: ${socket.id} (UserId: ${socket.user.userId})`);

      // 1. Join Personal Room for cross-device notifications
      socket.join(socket.user.userId.toString());
      console.log(`🔔 User ${socket.user.userId} joined their personal room`);

      // 2. Join Conversation Room
      socket.on('joinConversation', (conversationId) => {
        if (conversationId) {
          socket.join(conversationId);
          console.log(`💬 User ${socket.user.userId} joined conversation ${conversationId}`);
        }
      });

      // 3. Leave Conversation Room
      socket.on('leaveConversation', (conversationId) => {
        if (conversationId) {
          socket.leave(conversationId);
        }
      });

      // 4. Typing Events
      socket.on('typing', ({ conversationId, receiverId }) => {
        // Emit to the conversation room (excluding sender)
        socket.to(conversationId).emit('typing', {
          conversationId,
          senderId: socket.user.userId
        });
      });

      // 5. Message Seen Event
      socket.on('messageSeen', ({ conversationId, messageId, senderId }) => {
        // Notify the person who sent the message that it was seen
        socket.to(senderId).emit('messageSeen', {
          conversationId,
          messageId,
          seenBy: socket.user.userId
        });
      });

      socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${socket.id}`);
      });
    });
  } catch (error) {
    console.error('Socket setup error:', error);
  }
};
