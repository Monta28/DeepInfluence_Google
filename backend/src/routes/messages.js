const express = require('express');
const MessageController = require('../controllers/messages/messageController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Initiate a conversation
router.post('/initiate', verifyToken, MessageController.initiateConversation);

// Get all conversations for the logged-in user
router.get('/conversations', verifyToken, MessageController.getConversations);

// Delete an entire conversation
router.delete('/conversations/:conversationId', verifyToken, MessageController.deleteConversation);

// Get messages for a specific conversation
router.get('/:conversationId', verifyToken, MessageController.getMessages);

// Send a message to an existing conversation
router.post('/:conversationId', verifyToken, MessageController.sendMessage);

// Mark all messages in a conversation as read
router.post('/:conversationId/read', verifyToken, MessageController.markAllMessagesAsRead);

// Delete a single message
router.delete('/:messageId', verifyToken, MessageController.deleteMessage);

// Mark a single message as read
router.post('/:messageId/read', verifyToken, MessageController.markMessageAsRead);

// AJOUTEZ CETTE NOUVELLE ROUTE
router.put('/conversations/:conversationId/toggle-free', verifyToken, MessageController.toggleConversationFree);

module.exports = router;