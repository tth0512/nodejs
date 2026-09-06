import express from 'express';
import { sendMessage, getConversations, getMessages } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', sendMessage);
router.get('/inbox', getConversations);
router.get('/:conversationId', getMessages);

export default router;
