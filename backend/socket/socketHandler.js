import { parseCookie } from 'cookie';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
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
      socket.on('joinConversation', async (conversationId) => {
        if (!conversationId) return;
        const conv = await Conversation.findById(conversationId);
        const isMember = conv?.participants.some(p => p.toString() ===
          socket.user.userId.toString());
        if (isMember) {
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
      socket.on('messageSeen', async ({ conversationId, messageId, senderId }) => {
        try {
          if (conversationId && senderId) {
            await Message.updateMany(
              {
                conversationId: conversationId.toString(),
                senderId: senderId,
                status: { $ne: 'seen' }
              },
              { $set: { status: 'seen' } }
            );

            const conv = await Conversation.findById(conversationId);
            if (conv && conv.lastMessage && conv.lastMessage.senderId?.toString() === senderId.toString()) {
              conv.lastMessage.status = 'seen';
              await conv.save();
            }
          }

          // Notify the person who sent the message that it was seen
          socket.to(senderId.toString()).emit('messageSeen', {
            conversationId,
            messageId,
            seenBy: socket.user.userId
          });

          // Also notify the conversation room
          if (conversationId) {
            socket.to(conversationId.toString()).emit('messageSeen', {
              conversationId,
              messageId,
              seenBy: socket.user.userId
            });
          }
        } catch (err) {
          console.error('Error in socket messageSeen:', err);
        }
      });

      // 6. Quick Emoji Update Event
      socket.on('changeQuickEmoji', async ({ conversationId, quickEmoji }) => {
        try {
          if (!conversationId || !quickEmoji) return;
          const conv = await Conversation.findById(conversationId);
          if (!conv) return;

          conv.quickEmoji = quickEmoji;
          await conv.save();

          const user = await User.findById(socket.user.userId);
          const changerName = user?.fullName || socket.user.username || 'Một người dùng';

          const systemMessage = new Message({
            conversationId: conversationId.toString(),
            senderId: socket.user.userId,
            content: `${changerName} đã đổi biểu tượng cảm xúc nhanh thành ${quickEmoji}`,
            type: 'system',
            status: 'seen'
          });
          await systemMessage.save();

          io.to(conversationId.toString()).emit('quickEmojiUpdated', {
            conversationId: conversationId.toString(),
            quickEmoji,
            systemMessage,
            changedBy: socket.user.userId,
            changerName
          });
          io.to(conversationId.toString()).emit('receiveMessage', systemMessage);
        } catch (err) {
          console.error('Error in socket changeQuickEmoji:', err);
        }
      });

      socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${socket.id}`);
      });
    });
  } catch (error) {
    console.error('Socket setup error:', error);
  }
};
