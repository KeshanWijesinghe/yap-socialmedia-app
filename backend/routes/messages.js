const express = require("express");
const { body } = require("express-validator");
const {
  getConversations,
  createConversation,
  sendMessage,
  getMessages,
  markAsRead,
  editMessage,
  deleteMessage,
  deleteConversation,
  getMessageableUsers,
} = require("../controllers/messageController");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Message validation rules
const messageValidation = [
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Message content is required")
    .isLength({ min: 1, max: 1000 })
    .withMessage("Message content must be between 1 and 1000 characters"),
];

// @route   GET /api/messages/conversations
// @desc    Get user's conversations
// @access  Private
router.get("/conversations", auth, getConversations);

// @route   GET /api/messages/messageable-users
// @desc    Get users that can be messaged (mutual followers)
// @access  Private
router.get("/messageable-users", auth, getMessageableUsers);

// @route   POST /api/messages/conversations
// @desc    Create new conversation
// @access  Private
router.post("/conversations", auth, createConversation);

// @route   GET /api/messages/conversations/:conversationId
// @desc    Get messages in a conversation
// @access  Private
router.get("/conversations/:conversationId", auth, getMessages);

// @route   POST /api/messages/conversations/:conversationId
// @desc    Send message to conversation
// @access  Private
router.post(
  "/conversations/:conversationId",
  auth,
  messageValidation,
  sendMessage
);

// @route   POST /api/messages/:messageId/read
// @desc    Mark message as read
// @access  Private
router.post("/:messageId/read", auth, markAsRead);

// @route   PUT /api/messages/:messageId
// @desc    Edit message
// @access  Private
router.put("/:messageId", auth, messageValidation, editMessage);

// @route   DELETE /api/messages/:messageId
// @desc    Delete message
// @access  Private
router.delete("/:messageId", auth, deleteMessage);

// @route   DELETE /api/messages/conversations/:conversationId
// @desc    Delete conversation
// @access  Private
router.delete("/conversations/:conversationId", auth, deleteConversation);

module.exports = router;
