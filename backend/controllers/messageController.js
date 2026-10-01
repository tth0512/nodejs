import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Follow from '../models/Follow.js';
import Block from '../models/Block.js';

export const sendMessage = async (req, res) => {
  try {
    const senderId   = req.user?.userId || req.user?.id;
    const { receiverId, content, type } = req.body;

    if (!senderId) {
      return res.status(401).json({ message: 'Unauthorized: No sender ID' });
    }

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    if (senderId.toString() === receiverId?.toString()) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Block check — query the Block model
    const isBlocked = await Block.findOne({
      blockerId: receiverId,
      blockedId: senderId
    });
    if (isBlocked) {
      return res.status(403).json({ message: 'You are blocked by this user' });
    }

    // Privacy check — if receiver's contact is private, they must follow sender
    if (receiver.privacyContact === 'private') {
      const receiverFollowsSender = await Follow.findOne({
        followerId: receiverId,
        followingId: senderId,
        status: 'accepted'
      });
      if (!receiverFollowsSender) {
        return res.status(403).json({ message: 'This user does not accept message requests' });
      }
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (!conversation) {
      // Determine conversation status: accepted if receiver follows sender
      const receiverFollowsSender = await Follow.findOne({
        followerId: receiverId,
        followingId: senderId,
        status: 'accepted'
      });

      conversation = new Conversation({
        participants: [senderId, receiverId],
        status: receiverFollowsSender ? 'accepted' : 'pending'
      });
    }

    // Create message — conversationId stored as String
    const message = new Message({
      conversationId: conversation._id.toString(),
      senderId,
      content,
      type: type || 'text'
    });

    await message.save();

    // Update conversation's lastMessage cache
    conversation.lastMessage = {
      senderId,
      content,
      createdAt: message.createdAt,
      status: 'sent'
    };
    await conversation.save();

    // Emit Socket.IO events
    const io = req.app.get('io');
    if (io) {
      io.to(receiverId.toString()).emit('receiveMessage', message);
      io.to(conversation._id.toString()).emit('receiveMessage', message);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'fullName avatarUrl username isPrivate')
      .sort({ 'lastMessage.createdAt': -1 });

    res.status(200).json(conversations);
  } catch (error) {
    console.error('Error in getConversations:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const currentUserId = req.user?.userId || req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Ensure user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.some(p => p.toString() === currentUserId.toString())) {
      return res.status(404).json({ message: 'Conversation not found or unauthorized' });
    }

    // Mark unread messages sent by other participants as seen
    const unreadUpdated = await Message.updateMany(
      {
        conversationId: conversationId.toString(),
        senderId: { $ne: currentUserId },
        status: { $ne: 'seen' }
      },
      { $set: { status: 'seen' } }
    );

    if (conversation.lastMessage && conversation.lastMessage.senderId?.toString() !== currentUserId.toString() && conversation.lastMessage.status !== 'seen') {
      conversation.lastMessage.status = 'seen';
      await conversation.save();
    }

    if (unreadUpdated.modifiedCount > 0) {
      const io = req.app.get('io');
      if (io) {
        const otherParticipants = conversation.participants.filter(
          p => p.toString() !== currentUserId.toString()
        );
        otherParticipants.forEach(pId => {
          io.to(pId.toString()).emit('messageSeen', {
            conversationId: conversationId.toString(),
            seenBy: currentUserId
          });
        });
        io.to(conversationId.toString()).emit('messageSeen', {
          conversationId: conversationId.toString(),
          seenBy: currentUserId
        });
      }
    }

    const skip = (page - 1) * limit;

    // conversationId in Message is stored as String
    const messages = await Message.find({ conversationId: conversationId.toString() })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Return in chronological order
    res.status(200).json(messages.reverse());
  } catch (error) {
    console.error('Error in getMessages:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateQuickEmoji = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { quickEmoji } = req.body;
    const userId = req.user?.userId || req.user?.id;
    const username = req.user?.username;

    if (!quickEmoji) {
      return res.status(400).json({ message: 'quickEmoji is required' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.some(p => p.toString() === userId.toString())) {
      return res.status(404).json({ message: 'Conversation not found or unauthorized' });
    }

    conversation.quickEmoji = quickEmoji;
    await conversation.save();

    // Create system message announcing who changed the quick emoji
    const user = await User.findById(userId);
    const changerName = user?.fullName || username || 'Một người dùng';

    const systemMessage = new Message({
      conversationId: conversation._id.toString(),
      senderId: userId,
      content: `${changerName} đã đổi biểu tượng cảm xúc nhanh thành ${quickEmoji}`,
      type: 'system',
      status: 'seen'
    });
    await systemMessage.save();

    const io = req.app.get('io');
    if (io) {
      io.to(conversation._id.toString()).emit('quickEmojiUpdated', {
        conversationId: conversation._id.toString(),
        quickEmoji,
        systemMessage,
        changedBy: userId,
        changerName
      });
      io.to(conversation._id.toString()).emit('receiveMessage', systemMessage);
    }

    res.status(200).json({ success: true, quickEmoji, systemMessage });
  } catch (error) {
    console.error('Error in updateQuickEmoji:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
