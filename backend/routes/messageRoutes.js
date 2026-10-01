import express from 'express';
import { sendMessage, getConversations, getMessages, updateQuickEmoji } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', sendMessage);
router.get('/inbox', getConversations);
router.get('/:conversationId', getMessages);
router.patch('/:conversationId/quick-emoji', updateQuickEmoji);

export default router;
